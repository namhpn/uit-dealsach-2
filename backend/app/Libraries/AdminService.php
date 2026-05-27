<?php

namespace App\Libraries;

use App\Models\PriceAlertEventModel;
use App\Models\PriceAlertModel;
use App\Models\UserModel;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Database\ConnectionInterface;
use CodeIgniter\I18n\Time;
use Config\Database;
use DateTimeImmutable;
use DateTimeZone;

class AdminService
{
    private const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

    private BaseConnection $db;
    private UserModel $users;
    private PriceAlertModel $alerts;
    private PriceAlertEventModel $alertEvents;
    private AuthService $auth;
    private AdminAuditService $audit;
    private DateTimeImmutable $now;

    public function __construct(?ConnectionInterface $db = null, ?DateTimeImmutable $now = null)
    {
        $this->db = $db ?? Database::connect();
        $this->users = new UserModel();
        $this->alerts = new PriceAlertModel();
        $this->alertEvents = new PriceAlertEventModel();
        $this->auth = new AuthService($now);
        $this->audit = new AdminAuditService($now);
        $this->now = $now ?? new DateTimeImmutable(Time::now(self::VIETNAM_TIMEZONE)->toDateTimeString(), new DateTimeZone(self::VIETNAM_TIMEZONE));
    }

    public function listUsers(array $filters): array
    {
        $builder = $this->db->table('users u')
            ->select('u.id, u.normalized_email, u.display_email, u.role, u.status, u.alert_email_enabled, u.created_at, u.updated_at');

        $search = trim((string) ($filters['q'] ?? ''));
        if ($search !== '') {
            $builder->groupStart()
                ->like('u.normalized_email', mb_strtolower($search, 'UTF-8'))
                ->orLike('u.display_email', $search)
                ->groupEnd();
        }
        if (in_array($filters['role'] ?? '', ['registered', 'admin'], true)) {
            $builder->where('u.role', $filters['role']);
        }
        if (in_array($filters['status'] ?? '', ['active', 'deactivated'], true)) {
            $builder->where('u.status', $filters['status']);
        }

        $rows = $builder->orderBy('u.id', 'ASC')->get()->getResult();

        return array_map(fn (object $row): array => $this->serializeUserRow($row), $rows);
    }

    public function userDetail(int $userId): ?array
    {
        $row = $this->db->table('users u')
            ->select('u.id, u.normalized_email, u.display_email, u.role, u.status, u.alert_email_enabled, u.created_at, u.updated_at')
            ->where('u.id', $userId)
            ->get()
            ->getFirstRow();

        return $row === null ? null : $this->serializeUserRow($row) + ['active_session_count' => $this->countRows('user_sessions', ['user_id' => $userId, 'status' => 'active'])];
    }

    public function deactivateUser(object $actor, int $userId): array
    {
        $user = $this->users->find($userId);
        if ($user === null) {
            return $this->error(404, 'Không tìm thấy người dùng.', ['user' => 'Người dùng không tồn tại.']);
        }

        $before = $this->userSnapshot($user);
        if ($user->role === 'admin' && $this->activeAdminCount() <= 1) {
            $this->audit->record($actor, 'user_deactivate_blocked_last_admin', 'user', $userId, 'Chặn vô hiệu hóa Admin hoạt động cuối cùng.', $before, $before);
            return $this->error(409, 'Không thể vô hiệu hóa Admin hoạt động cuối cùng.', ['user' => 'Cần ít nhất một Admin đang hoạt động.']);
        }
        if ((int) $actor->id === (int) $user->id) {
            $this->audit->record($actor, 'user_deactivate_blocked_self', 'user', $userId, 'Chặn quản trị viên tự vô hiệu hóa tài khoản.', $before, $before);
            return $this->error(409, 'Quản trị viên không thể tự vô hiệu hóa tài khoản đang dùng.', ['user' => 'Hãy dùng tài khoản Admin khác để thao tác.']);
        }
        if ($user->status === 'deactivated') {
            return $this->success('Người dùng đã ở trạng thái vô hiệu hóa.', $this->userDetail($userId));
        }

        $this->db->transStart();
        $this->users->update($userId, ['status' => 'deactivated']);
        $this->auth->invalidateActiveSessionsForUser($userId);
        $activeAlerts = $this->alerts->where('user_id', $userId)->where('status', 'Active')->findAll();
        foreach ($activeAlerts as $alert) {
            $this->alerts->update((int) $alert->id, ['status' => 'Disabled']);
            $this->recordAlertEvent((int) $alert->id, 'disabled_by_admin_user_deactivation', 'Active', 'Disabled', ['admin_user_id' => (int) $actor->id]);
        }
        $afterUser = $this->users->find($userId);
        $this->audit->record($actor, 'user_deactivated', 'user', $userId, 'Vô hiệu hóa người dùng và tắt cảnh báo Active.', $before, $this->userSnapshot($afterUser));
        $this->db->transComplete();

        return $this->success('Đã vô hiệu hóa người dùng.', $this->userDetail($userId));
    }

    public function reactivateUser(object $actor, int $userId): array
    {
        $user = $this->users->find($userId);
        if ($user === null) {
            return $this->error(404, 'Không tìm thấy người dùng.', ['user' => 'Người dùng không tồn tại.']);
        }
        if ($user->status === 'active') {
            return $this->success('Người dùng đã hoạt động.', $this->userDetail($userId));
        }

        $before = $this->userSnapshot($user);
        $this->users->update($userId, ['status' => 'active']);
        $this->audit->record($actor, 'user_reactivated', 'user', $userId, 'Kích hoạt lại người dùng, không tự bật lại cảnh báo cũ.', $before, $this->userSnapshot($this->users->find($userId)));

        return $this->success('Đã kích hoạt lại người dùng.', $this->userDetail($userId));
    }

    public function listAlerts(): array
    {
        $rows = $this->db->table('price_alerts pa')
            ->select('pa.*, u.display_email AS user_email, b.title AS book_title')
            ->join('users u', 'u.id = pa.user_id')
            ->join('books b', 'b.id = pa.book_id')
            ->orderBy('pa.updated_at', 'DESC')
            ->orderBy('pa.id', 'DESC')
            ->get()
            ->getResult();

        return array_map(fn (object $row): array => $this->serializeAlert($row, false), $rows);
    }

    public function alertDetail(int $alertId): ?array
    {
        $row = $this->db->table('price_alerts pa')
            ->select('pa.*, u.display_email AS user_email, b.title AS book_title')
            ->join('users u', 'u.id = pa.user_id')
            ->join('books b', 'b.id = pa.book_id')
            ->where('pa.id', $alertId)
            ->get()
            ->getFirstRow();

        return $row === null ? null : $this->serializeAlert($row, true);
    }

    public function disableAlert(object $actor, int $alertId): array
    {
        $alert = $this->alerts->find($alertId);
        if ($alert === null) {
            return $this->error(404, 'Không tìm thấy cảnh báo.', ['alert' => 'Cảnh báo không tồn tại.']);
        }
        if ($alert->status === 'Disabled') {
            return $this->success('Cảnh báo đã bị tắt.', $this->alertDetail($alertId));
        }

        $before = $this->alertSnapshot($alert);
        $this->db->transStart();
        $this->alerts->update($alertId, ['status' => 'Disabled']);
        $this->recordAlertEvent($alertId, 'disabled_by_admin', (string) $alert->status, 'Disabled', ['admin_user_id' => (int) $actor->id]);
        $this->audit->record($actor, 'alert_disabled', 'price_alert', $alertId, 'Admin tắt cảnh báo có vấn đề.', $before, $this->alertSnapshot($this->alerts->find($alertId)));
        $this->db->transComplete();

        return $this->success('Đã tắt cảnh báo.', $this->alertDetail($alertId));
    }

    private function serializeUserRow(object $row): array
    {
        return [
            'id' => (int) $row->id,
            'email' => (string) $row->display_email,
            'role' => (string) $row->role,
            'status' => (string) $row->status,
            'alert_email_enabled' => (bool) $row->alert_email_enabled,
            'wishlist_count' => $this->countRows('wishlist_items', ['user_id' => (int) $row->id]),
            'alert_count' => $this->countRows('price_alerts', ['user_id' => (int) $row->id]),
            'active_alert_count' => $this->countRows('price_alerts', ['user_id' => (int) $row->id, 'status' => 'Active']),
            'created_at' => (string) $row->created_at,
            'updated_at' => (string) $row->updated_at,
        ];
    }

    private function serializeAlert(object $row, bool $includeEvents): array
    {
        return [
            'id' => (int) $row->id,
            'user_id' => (int) $row->user_id,
            'user_email' => (string) $row->user_email,
            'book_id' => (int) $row->book_id,
            'book_title' => (string) $row->book_title,
            'alert_type' => (string) $row->alert_type,
            'status' => (string) $row->status,
            'target_price' => $row->target_price === null ? null : (int) $row->target_price,
            'notification_count' => (int) $row->notification_count,
            'expires_at' => (string) $row->expires_at,
            'recent_events' => $includeEvents ? $this->alertEvents($row->id) : $this->alertEvents($row->id, 1),
            'created_at' => (string) $row->created_at,
            'updated_at' => (string) $row->updated_at,
        ];
    }

    private function alertEvents(int $alertId, int $limit = 10): array
    {
        $events = $this->alertEvents->where('price_alert_id', $alertId)->orderBy('created_at', 'DESC')->orderBy('id', 'DESC')->findAll($limit);

        return array_map(static fn (object $event): array => [
            'id' => (int) $event->id,
            'event_type' => (string) $event->event_type,
            'previous_status' => $event->previous_status,
            'new_status' => $event->new_status,
            'summary' => $event->summary_json === null ? null : json_decode((string) $event->summary_json, true),
            'created_at' => (string) $event->created_at,
        ], $events);
    }

    private function activeAdminCount(): int
    {
        return (int) $this->users->where('role', 'admin')->where('status', 'active')->countAllResults();
    }

    private function countRows(string $table, array $where): int
    {
        if (! $this->db->tableExists($table)) {
            return 0;
        }

        try {
            return (int) $this->db->table($table)->where($where)->countAllResults();
        } catch (\Throwable) {
            return 0;
        }
    }

    private function userSnapshot(object $user): array
    {
        return [
            'id' => (int) $user->id,
            'email' => (string) $user->display_email,
            'role' => (string) $user->role,
            'status' => (string) $user->status,
            'alert_email_enabled' => (bool) $user->alert_email_enabled,
        ];
    }

    private function alertSnapshot(object $alert): array
    {
        return [
            'id' => (int) $alert->id,
            'user_id' => (int) $alert->user_id,
            'book_id' => (int) $alert->book_id,
            'alert_type' => (string) $alert->alert_type,
            'status' => (string) $alert->status,
            'notification_count' => (int) $alert->notification_count,
        ];
    }

    private function recordAlertEvent(int $alertId, string $type, ?string $previous, ?string $next, array $summary): void
    {
        $this->alertEvents->insert([
            'price_alert_id' => $alertId,
            'event_type' => $type,
            'previous_status' => $previous,
            'new_status' => $next,
            'summary_json' => json_encode($summary, JSON_UNESCAPED_UNICODE),
            'created_at' => $this->now->format('Y-m-d H:i:s'),
        ]);
    }

    private function success(string $message, mixed $data): array
    {
        return ['ok' => true, 'statusCode' => 200, 'message' => $message, 'data' => $data];
    }

    private function error(int $statusCode, string $message, array $errors): array
    {
        return ['ok' => false, 'statusCode' => $statusCode, 'message' => $message, 'errors' => $errors];
    }
}
