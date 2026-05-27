<?php

use App\Libraries\AuthService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class AdminFeatureTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $namespace = 'App';

    public function testAdminApisRejectGuestsAndRegisteredUsers(): void
    {
        $this->get('/api/admin/users')->assertStatus(401);

        $userToken = $this->sessionFor($this->user('reader@example.com', 'registered'));
        $response = $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $userToken])->get('/api/admin/users');
        $response->assertStatus(403);
        $this->assertSame('Tài khoản này không có quyền quản trị.', $this->json($response)['message']);
    }

    public function testAdminCanListAndDeactivateUserWithSessionAndAlertInvalidation(): void
    {
        $adminId = $this->user('admin@example.com', 'admin');
        $userId = $this->user('target@example.com', 'registered');
        $token = $this->sessionFor($adminId);
        $userToken = $this->sessionFor($userId);
        $bookId = $this->book();
        $alertId = $this->alert($userId, $bookId, 'Active');

        $list = $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $token])->get('/api/admin/users');
        $list->assertOK();
        $this->assertCount(2, $this->json($list)['data']['items']);

        $deactivate = $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $token])->post('/api/admin/users/' . $userId . '/deactivate');
        $deactivate->assertOK();
        $this->assertSame('deactivated', $this->db->table('users')->where('id', $userId)->get()->getFirstRow()->status);
        $this->assertSame('invalidated', $this->db->table('user_sessions')->where('token_hash', hash('sha256', $userToken))->get()->getFirstRow()->status);
        $this->assertSame('Disabled', $this->db->table('price_alerts')->where('id', $alertId)->get()->getFirstRow()->status);
        $this->assertSame(1, $this->db->table('admin_audit_logs')->where('action_type', 'user_deactivated')->countAllResults());

        $reactivate = $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $token])->post('/api/admin/users/' . $userId . '/reactivate');
        $reactivate->assertOK();
        $this->assertSame('active', $this->db->table('users')->where('id', $userId)->get()->getFirstRow()->status);
        $this->assertSame('Disabled', $this->db->table('price_alerts')->where('id', $alertId)->get()->getFirstRow()->status);
    }

    public function testSelfAndLastAdminDeactivationAreBlockedAndAudited(): void
    {
        $adminId = $this->user('admin@example.com', 'admin');
        $token = $this->sessionFor($adminId);

        $otherAdminId = $this->user('other-admin@example.com', 'admin');
        $self = $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $token])->post('/api/admin/users/' . $adminId . '/deactivate');
        $self->assertStatus(409);
        $this->assertSame(1, $this->db->table('admin_audit_logs')->where('action_type', 'user_deactivate_blocked_self')->countAllResults());

        $this->db->table('users')->where('id', $otherAdminId)->update(['status' => 'deactivated']);
        $blocked = $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $token])->post('/api/admin/users/' . $adminId . '/deactivate');
        $blocked->assertStatus(409);
        $this->assertSame(1, $this->db->table('admin_audit_logs')->where('action_type', 'user_deactivate_blocked_last_admin')->countAllResults());
    }

    public function testAdminCanDisableAlertAndAuditMasksSensitiveFields(): void
    {
        $adminId = $this->user('admin@example.com', 'admin');
        $userId = $this->user('reader@example.com', 'registered');
        $token = $this->sessionFor($adminId);
        $alertId = $this->alert($userId, $this->book(), 'Active');

        $beforeCount = $this->db->table('admin_audit_logs')->countAllResults();
        $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $token])->get('/api/admin/audit')->assertOK();
        $this->assertSame($beforeCount, $this->db->table('admin_audit_logs')->countAllResults());

        $disable = $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $token])->post('/api/admin/alerts/' . $alertId . '/disable');
        $disable->assertOK();
        $this->assertSame('Disabled', $this->db->table('price_alerts')->where('id', $alertId)->get()->getFirstRow()->status);
        $this->assertSame(1, $this->db->table('price_alert_events')->where('price_alert_id', $alertId)->where('event_type', 'disabled_by_admin')->countAllResults());

        $log = $this->db->table('admin_audit_logs')->where('action_type', 'alert_disabled')->get()->getFirstRow();
        $this->assertNotNull($log);
        $this->assertStringNotContainsString('token_hash', (string) $log->before_json);
    }

    private function user(string $email, string $role): int
    {
        $this->db->table('users')->insert([
            'normalized_email' => $email,
            'display_email' => $email,
            'role' => $role,
            'status' => 'active',
            'alert_email_enabled' => 1,
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);

        return (int) $this->db->insertID();
    }

    private function sessionFor(int $userId): string
    {
        return (new AuthService())->createSession($userId)['token'];
    }

    private function book(): int
    {
        $this->db->table('categories')->insert([
            'name' => 'Kỹ năng sống',
            'slug' => 'ky-nang-song',
            'status' => 'active',
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);
        $categoryId = (int) $this->db->insertID();
        $this->db->table('books')->insert([
            'title' => 'Sách kiểm thử Admin',
            'author' => 'DealSach',
            'publisher' => 'NXB Kiểm thử',
            'isbn' => '9786041999999',
            'description' => null,
            'cover_image' => null,
            'primary_category_id' => $categoryId,
            'is_featured' => 0,
            'status' => 'active',
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);

        return (int) $this->db->insertID();
    }

    private function alert(int $userId, int $bookId, string $status): int
    {
        $this->db->table('price_alerts')->insert([
            'user_id' => $userId,
            'book_id' => $bookId,
            'alert_type' => 'target_price',
            'status' => $status,
            'target_price' => 100000,
            'baseline_price' => null,
            'baseline_pending' => 0,
            'comparison_price' => 120000,
            'last_notified_price' => null,
            'notification_count' => 0,
            'expires_at' => '2026-08-27 08:00:00',
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);

        return (int) $this->db->insertID();
    }

    private function json(object $result): array
    {
        $decoded = json_decode($result->getJSON(), true);
        $this->assertIsArray($decoded);

        return $decoded;
    }
}
