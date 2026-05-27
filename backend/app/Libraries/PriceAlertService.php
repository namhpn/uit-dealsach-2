<?php

namespace App\Libraries;

use App\Models\BookModel;
use App\Models\PriceAlertEventModel;
use App\Models\PriceAlertModel;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Database\ConnectionInterface;
use CodeIgniter\I18n\Time;
use Config\Database;
use DateTimeImmutable;
use DateTimeZone;

class PriceAlertService
{
    private const TARGET_PRICE = 'target_price';
    private const NEW_LOWEST = 'new_lowest_price';
    private const NON_TERMINAL = ['Active', 'Paused', 'Auto-paused'];
    private const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

    private BaseConnection $db;
    private PriceAlertModel $alerts;
    private PriceAlertEventModel $events;
    private BookModel $books;
    private PublicCatalogService $catalog;
    private AlertPreferenceService $preferences;
    private DateTimeImmutable $now;

    /**
     * @param ConnectionInterface&BaseConnection|null $db
     */
    public function __construct(?ConnectionInterface $db = null, ?DateTimeImmutable $now = null)
    {
        $this->db = $db ?? Database::connect();
        $this->alerts = new PriceAlertModel();
        $this->events = new PriceAlertEventModel();
        $this->books = new BookModel();
        $this->now = $now ?? new DateTimeImmutable(Time::now(self::VIETNAM_TIMEZONE)->toDateTimeString(), new DateTimeZone(self::VIETNAM_TIMEZONE));
        $this->catalog = new PublicCatalogService($this->db, $this->now);
        $this->preferences = new AlertPreferenceService();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listForUser(int $userId): array
    {
        $this->normalizeExpiredAlerts($userId);
        $rows = $this->alerts->where('user_id', $userId)->orderBy('created_at', 'DESC')->orderBy('id', 'DESC')->findAll();

        return array_map(fn (object $alert): array => $this->serializeAlert($alert, true), $rows);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function detailForUser(int $userId, int $alertId): ?array
    {
        $this->normalizeExpiredAlerts($userId);
        $alert = $this->alerts->where('id', $alertId)->where('user_id', $userId)->first();

        return $alert === null ? null : $this->serializeAlert($alert, true);
    }

    /**
     * @return array{ok: bool, statusCode: int, message: string, data?: array<string, mixed>, errors?: array<string, string>}
     */
    public function create(int $userId, array $payload): array
    {
        $this->normalizeExpiredAlerts($userId);

        $alertType = (string) ($payload['alert_type'] ?? '');
        $bookId = $this->positiveInt($payload['book_id'] ?? null);

        if ($bookId === null) {
            return $this->error(422, 'Thông tin sách chưa hợp lệ.', ['book_id' => 'Mã sách phải là số nguyên dương.']);
        }

        $book = $this->books->find($bookId);
        if ($book === null || $book->status !== 'active') {
            return $this->error(404, 'Sách không tồn tại hoặc đã được lưu trữ.', ['book_id' => 'Chỉ có thể tạo cảnh báo cho sách đang công khai.']);
        }

        if (! in_array($alertType, [self::TARGET_PRICE, self::NEW_LOWEST], true)) {
            return $this->error(422, 'Loại cảnh báo chưa hợp lệ.', ['alert_type' => 'Chọn cảnh báo giá mục tiêu hoặc giá thấp mới.']);
        }

        if ($alertType === self::TARGET_PRICE) {
            $targetPrice = $this->validPrice($payload['target_price'] ?? null);
            if ($targetPrice === null) {
                return $this->error(422, 'Giá mục tiêu chưa hợp lệ.', ['target_price' => 'Giá mục tiêu phải là số nguyên VND lớn hơn 0.']);
            }

            $duplicate = $this->duplicateTargetAlert($userId, $bookId, $targetPrice);
            if ($duplicate !== null) {
                return $this->success('Cảnh báo giá mục tiêu đã tồn tại.', $this->serializeAlert($duplicate, true));
            }

            $current = $this->catalog->currentLowestEligiblePriceSummary($bookId);
            $id = (int) $this->alerts->insert([
                'user_id' => $userId,
                'book_id' => $bookId,
                'alert_type' => self::TARGET_PRICE,
                'status' => 'Active',
                'target_price' => $targetPrice,
                'baseline_price' => null,
                'baseline_pending' => 0,
                'comparison_price' => $current['price'] ?? null,
                'last_notified_price' => null,
                'notification_count' => 0,
                'expires_at' => $this->expiresAt(),
            ]);

            $this->recordEvent($id, 'created', null, 'Active', ['alert_type' => self::TARGET_PRICE, 'target_price' => $targetPrice]);

            return $this->success('Đã tạo cảnh báo giá mục tiêu.', $this->serializeAlert($this->alerts->find($id), true), 201);
        }

        if (array_key_exists('target_price', $payload)) {
            return $this->error(422, 'Cảnh báo giá thấp mới không dùng giá mục tiêu.', ['target_price' => 'Không gửi giá mục tiêu cho loại cảnh báo này.']);
        }

        $duplicate = $this->duplicateNewLowestAlert($userId, $bookId);
        if ($duplicate !== null) {
            return $this->success('Cảnh báo giá thấp mới đã tồn tại.', $this->serializeAlert($duplicate, true));
        }

        $current = $this->catalog->currentLowestEligiblePriceSummary($bookId);
        $baseline = $current === null ? null : $this->catalog->lowestObservationTimeEligiblePrice($bookId);
        $id = (int) $this->alerts->insert([
            'user_id' => $userId,
            'book_id' => $bookId,
            'alert_type' => self::NEW_LOWEST,
            'status' => 'Active',
            'target_price' => null,
            'baseline_price' => $baseline,
            'baseline_pending' => $current === null ? 1 : 0,
            'comparison_price' => null,
            'last_notified_price' => null,
            'notification_count' => 0,
            'expires_at' => $this->expiresAt(),
        ]);

        $this->recordEvent($id, 'created', null, 'Active', ['alert_type' => self::NEW_LOWEST, 'baseline_pending' => $current === null]);

        return $this->success('Đã tạo cảnh báo giá thấp mới.', $this->serializeAlert($this->alerts->find($id), true), 201);
    }

    public function updateTargetPrice(int $userId, int $alertId, array $payload): array
    {
        $alert = $this->ownedAlert($userId, $alertId);
        if ($alert === null) {
            return $this->notFound();
        }
        $alert = $this->normalizeAlert($alert);

        if ($alert->alert_type !== self::TARGET_PRICE) {
            return $this->error(422, 'Chỉ cảnh báo giá mục tiêu mới cập nhật được giá.', ['alert_type' => 'Loại cảnh báo này không có giá mục tiêu.']);
        }
        if (! in_array($alert->status, ['Active', 'Paused'], true)) {
            return $this->error(409, 'Trạng thái cảnh báo không cho phép cập nhật giá mục tiêu.', ['status' => 'Chỉ cảnh báo Active hoặc Paused được cập nhật.']);
        }

        $targetPrice = $this->validPrice($payload['target_price'] ?? null);
        if ($targetPrice === null) {
            return $this->error(422, 'Giá mục tiêu chưa hợp lệ.', ['target_price' => 'Giá mục tiêu phải là số nguyên VND lớn hơn 0.']);
        }

        $duplicate = $this->duplicateTargetAlert($userId, (int) $alert->book_id, $targetPrice, (int) $alert->id);
        if ($duplicate !== null) {
            return $this->success('Cảnh báo giá mục tiêu đã tồn tại.', $this->serializeAlert($duplicate, true));
        }

        $current = $this->catalog->currentLowestEligiblePriceSummary((int) $alert->book_id);
        $this->alerts->update((int) $alert->id, [
            'target_price' => $targetPrice,
            'comparison_price' => $current['price'] ?? null,
            'last_notified_price' => null,
            'notification_count' => 0,
        ]);
        $this->recordEvent((int) $alert->id, 'target_price_updated', $alert->status, $alert->status, ['target_price' => $targetPrice]);

        return $this->success('Đã cập nhật giá mục tiêu.', $this->serializeAlert($this->alerts->find((int) $alert->id), true));
    }

    public function pause(int $userId, int $alertId): array
    {
        return $this->transition($userId, $alertId, 'pause');
    }

    public function reactivate(int $userId, int $alertId): array
    {
        return $this->transition($userId, $alertId, 'reactivate');
    }

    public function renew(int $userId, int $alertId): array
    {
        return $this->transition($userId, $alertId, 'renew');
    }

    public function restartTracking(int $userId, int $alertId): array
    {
        $alert = $this->ownedAlert($userId, $alertId);
        if ($alert === null) {
            return $this->notFound();
        }
        $alert = $this->normalizeAlert($alert);

        if ($alert->alert_type !== self::NEW_LOWEST) {
            return $this->error(422, 'Chỉ cảnh báo giá thấp mới có thể bắt đầu theo dõi lại.', ['alert_type' => 'Loại cảnh báo không hỗ trợ thao tác này.']);
        }
        if (! in_array($alert->status, ['Active', 'Paused'], true)) {
            return $this->error(409, 'Trạng thái cảnh báo không cho phép bắt đầu theo dõi lại.', ['status' => 'Chỉ cảnh báo Active hoặc Paused được thao tác.']);
        }

        $current = $this->catalog->currentLowestEligiblePriceSummary((int) $alert->book_id);
        $this->alerts->update((int) $alert->id, [
            'baseline_price' => $current['price'] ?? null,
            'baseline_pending' => $current === null ? 1 : 0,
            'last_notified_price' => null,
            'notification_count' => 0,
        ]);
        $this->recordEvent((int) $alert->id, 'tracking_restarted', $alert->status, $alert->status, ['baseline_pending' => $current === null]);

        return $this->success('Đã bắt đầu theo dõi lại từ giá hiện tại.', $this->serializeAlert($this->alerts->find((int) $alert->id), true));
    }

    public function disable(int $userId, int $alertId): array
    {
        return $this->transition($userId, $alertId, 'disable');
    }

    private function transition(int $userId, int $alertId, string $action): array
    {
        $alert = $this->ownedAlert($userId, $alertId);
        if ($alert === null) {
            return $this->notFound();
        }
        $alert = $this->normalizeAlert($alert);

        if ($action !== 'disable' && $alert->status === 'Disabled') {
            return $this->error(409, 'Cảnh báo đã bị tắt và không thể thay đổi.', ['status' => 'Cảnh báo Disabled chỉ được xem lịch sử.']);
        }

        $previous = $alert->status;
        $updates = [];
        $event = null;
        $message = 'Đã cập nhật cảnh báo.';

        if ($action === 'pause') {
            if ($previous === 'Paused') {
                return $this->success('Cảnh báo đã tạm dừng.', $this->serializeAlert($alert, true));
            }
            if ($previous !== 'Active') {
                return $this->error(409, 'Trạng thái cảnh báo không cho phép tạm dừng.', ['status' => 'Chỉ cảnh báo Active được tạm dừng.']);
            }
            $updates['status'] = 'Paused';
            $event = 'paused';
            $message = 'Đã tạm dừng cảnh báo.';
        } elseif ($action === 'reactivate') {
            if (! in_array($previous, ['Paused', 'Auto-paused'], true)) {
                return $this->error(409, 'Trạng thái cảnh báo không cho phép kích hoạt lại.', ['status' => 'Chỉ cảnh báo Paused hoặc Auto-paused được kích hoạt lại.']);
            }
            if ($this->catalog->activeBookSummary((int) $alert->book_id) === null) {
                return $this->error(409, 'Sách đã lưu trữ nên không thể kích hoạt lại cảnh báo.', ['book_id' => 'Chỉ có thể kích hoạt lại cảnh báo cho sách đang công khai.']);
            }
            $updates['status'] = 'Active';
            if ($previous === 'Auto-paused') {
                $updates['notification_count'] = 0;
            }
            $event = 'reactivated';
            $message = 'Đã kích hoạt lại cảnh báo.';
        } elseif ($action === 'renew') {
            if ($this->catalog->activeBookSummary((int) $alert->book_id) === null) {
                return $this->error(409, 'Sách đã lưu trữ nên không thể gia hạn cảnh báo.', ['book_id' => 'Chỉ có thể gia hạn cảnh báo cho sách đang công khai.']);
            }
            $updates['expires_at'] = $this->expiresAt();
            if ($previous === 'Expired') {
                $updates['status'] = 'Active';
            }
            $event = 'renewed';
            $message = 'Đã gia hạn cảnh báo.';
        } elseif ($action === 'disable') {
            if ($previous === 'Disabled') {
                return $this->success('Cảnh báo đã được tắt.', $this->serializeAlert($alert, true));
            }
            $updates['status'] = 'Disabled';
            $event = 'disabled';
            $message = 'Đã tắt cảnh báo.';
        }

        if ($updates !== []) {
            $this->alerts->update((int) $alert->id, $updates);
            $updated = $this->alerts->find((int) $alert->id);
            $this->recordEvent((int) $alert->id, (string) $event, $previous, $updated->status, []);

            return $this->success($message, $this->serializeAlert($updated, true));
        }

        return $this->success($message, $this->serializeAlert($alert, true));
    }

    private function normalizeExpiredAlerts(int $userId): void
    {
        $rows = $this->alerts
            ->where('user_id', $userId)
            ->whereIn('status', self::NON_TERMINAL)
            ->where('expires_at <=', $this->now->format('Y-m-d H:i:s'))
            ->findAll();

        foreach ($rows as $alert) {
            $this->alerts->update((int) $alert->id, ['status' => 'Expired']);
            $this->recordEvent((int) $alert->id, 'expired', $alert->status, 'Expired', ['expires_at' => $alert->expires_at]);
        }
    }

    private function normalizeAlert(object $alert): object
    {
        if (in_array($alert->status, self::NON_TERMINAL, true) && (string) $alert->expires_at <= $this->now->format('Y-m-d H:i:s')) {
            $this->alerts->update((int) $alert->id, ['status' => 'Expired']);
            $this->recordEvent((int) $alert->id, 'expired', $alert->status, 'Expired', ['expires_at' => $alert->expires_at]);

            return $this->alerts->find((int) $alert->id);
        }

        return $alert;
    }

    private function duplicateTargetAlert(int $userId, int $bookId, int $targetPrice, ?int $excludeId = null): ?object
    {
        $builder = $this->alerts
            ->where('user_id', $userId)
            ->where('book_id', $bookId)
            ->where('alert_type', self::TARGET_PRICE)
            ->where('target_price', $targetPrice)
            ->whereIn('status', self::NON_TERMINAL);

        if ($excludeId !== null) {
            $builder->where('id !=', $excludeId);
        }

        return $builder->first();
    }

    private function duplicateNewLowestAlert(int $userId, int $bookId): ?object
    {
        return $this->alerts
            ->where('user_id', $userId)
            ->where('book_id', $bookId)
            ->where('alert_type', self::NEW_LOWEST)
            ->whereIn('status', self::NON_TERMINAL)
            ->first();
    }

    private function ownedAlert(int $userId, int $alertId): ?object
    {
        return $this->alerts->where('id', $alertId)->where('user_id', $userId)->first();
    }

    private function serializeAlert(object $alert, bool $includeEvents): array
    {
        $book = $this->bookSnapshot((int) $alert->book_id);
        $current = $this->catalog->currentLowestEligiblePriceSummary((int) $alert->book_id);

        return [
            'id' => (int) $alert->id,
            'book_id' => (int) $alert->book_id,
            'book' => $book,
            'alert_type' => $alert->alert_type,
            'status' => $alert->status,
            'target_price' => $alert->target_price === null ? null : (int) $alert->target_price,
            'baseline_price' => $alert->baseline_price === null ? null : (int) $alert->baseline_price,
            'baseline_pending' => (bool) $alert->baseline_pending,
            'comparison_price' => $alert->comparison_price === null ? null : (int) $alert->comparison_price,
            'last_notified_price' => $alert->last_notified_price === null ? null : (int) $alert->last_notified_price,
            'notification_count' => (int) $alert->notification_count,
            'expires_at' => $alert->expires_at,
            'current_lowest_eligible_price' => $current === null ? null : ['price' => $current['price'], 'offer_count' => $current['offer_count']],
            'alert_emails_enabled' => $this->preferences->getForUser((int) $alert->user_id)['alert_emails_enabled'],
            'recent_events' => $includeEvents ? $this->recentEvents((int) $alert->id) : [],
            'created_at' => $alert->created_at,
            'updated_at' => $alert->updated_at,
        ];
    }

    private function bookSnapshot(int $bookId): ?array
    {
        $row = $this->db->table('books b')
            ->select('b.id, b.title, b.author, b.publisher, b.cover_image, c.name AS category_name, c.slug AS category_slug')
            ->join('categories c', 'c.id = b.primary_category_id')
            ->where('b.id', $bookId)
            ->get()
            ->getFirstRow();

        if ($row === null) {
            return null;
        }

        return [
            'id' => (int) $row->id,
            'title' => $row->title,
            'author' => $row->author,
            'publisher' => $row->publisher,
            'category_name' => $row->category_name,
            'category_slug' => $row->category_slug,
            'cover_image' => $row->cover_image,
        ];
    }

    private function recentEvents(int $alertId): array
    {
        $rows = $this->events
            ->where('price_alert_id', $alertId)
            ->orderBy('created_at', 'DESC')
            ->orderBy('id', 'DESC')
            ->findAll(10);

        return array_map(static fn (object $row): array => [
            'id' => (int) $row->id,
            'event_type' => $row->event_type,
            'previous_status' => $row->previous_status,
            'new_status' => $row->new_status,
            'summary' => $row->summary_json === null ? null : json_decode((string) $row->summary_json, true),
            'created_at' => $row->created_at,
        ], $rows);
    }

    private function recordEvent(int $alertId, string $eventType, ?string $previousStatus, ?string $newStatus, array $summary): void
    {
        $this->events->insert([
            'price_alert_id' => $alertId,
            'event_type' => $eventType,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'summary_json' => json_encode($summary, JSON_UNESCAPED_UNICODE),
            'created_at' => $this->now->format('Y-m-d H:i:s'),
        ]);
    }

    private function expiresAt(): string
    {
        return $this->now->modify('+90 days')->format('Y-m-d H:i:s');
    }

    private function validPrice(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value > 0 ? $value : null;
        }

        if (is_string($value) && ctype_digit($value) && (int) $value > 0) {
            return (int) $value;
        }

        return null;
    }

    private function positiveInt(mixed $value): ?int
    {
        if (is_int($value) && $value > 0) {
            return $value;
        }

        if (is_string($value) && ctype_digit($value) && (int) $value > 0) {
            return (int) $value;
        }

        return null;
    }

    private function success(string $message, array $data, int $statusCode = 200): array
    {
        return ['ok' => true, 'statusCode' => $statusCode, 'message' => $message, 'data' => $data];
    }

    private function error(int $statusCode, string $message, array $errors): array
    {
        return ['ok' => false, 'statusCode' => $statusCode, 'message' => $message, 'errors' => $errors];
    }

    private function notFound(): array
    {
        return $this->error(404, 'Không tìm thấy cảnh báo phù hợp.', ['alert' => 'Cảnh báo không tồn tại hoặc bạn không có quyền truy cập.']);
    }
}
