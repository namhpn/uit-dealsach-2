<?php

use App\Libraries\AuthService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class AdminDashboardFeatureTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $namespace = 'App';

    public function testDashboardRejectsGuestsAndRegisteredUsers(): void
    {
        $this->get('/api/admin/dashboard')->assertStatus(401);

        $token = $this->sessionFor($this->user('reader@example.com', 'registered'));
        $response = $this->withHeaders($this->cookie($token))->get('/api/admin/dashboard');

        $response->assertStatus(403);
        $this->assertSame('Tài khoản này không có quyền quản trị.', $this->json($response)['message']);
    }

    public function testDashboardReportsDefaultWindowMetricsGroupingAndNoAuditOnRead(): void
    {
        $adminId = $this->user('admin@example.com', 'admin');
        $activeUserId = $this->user('active@example.com', 'registered', true);
        $suppressedUserId = $this->user('suppressed@example.com', 'registered', false);
        $token = $this->sessionFor($adminId);
        $categoryId = $this->category();
        [$retailerId, $merchantId] = $this->retailerAndMerchant('Tiki', 'tiki', 'active');
        $archivedBookId = $this->book($categoryId, 'Sách đã lưu trữ', 'archived');
        $activeBookId = $this->book($categoryId, 'Sách đang theo dõi', 'active');
        $archivedOfferId = $this->offer($archivedBookId, $retailerId, $merchantId, 'Ưu đãi cũ', 'active');
        $activeOfferId = $this->offer($activeBookId, $retailerId, $merchantId, 'Ưu đãi hiện tại', 'active');
        $now = new DateTimeImmutable('now', new DateTimeZone('Asia/Ho_Chi_Minh'));
        $inside = $now->modify('-1 day')->format('Y-m-d H:i:s');
        $outside = $now->modify('-9 days')->format('Y-m-d H:i:s');

        $this->affiliateRedirect($archivedOfferId, $archivedBookId, $retailerId, $merchantId, $inside);
        $this->affiliateRedirect($activeOfferId, $activeBookId, $retailerId, $merchantId, $inside);
        $this->affiliateRedirect($activeOfferId, $activeBookId, $retailerId, $merchantId, $outside);
        $this->redirectFailure($activeOfferId, $activeBookId, $retailerId, $merchantId, $inside, 'invalid_destination');

        $targetAlertId = $this->alert($activeUserId, $activeBookId, 'target_price', 'Active');
        $this->alert($suppressedUserId, $activeBookId, 'target_price', 'Active');
        $this->alert($activeUserId, $activeBookId, 'new_lowest_price', 'Auto-paused');
        $this->alert($activeUserId, $activeBookId, 'target_price', 'Expired');
        $this->emailClick($targetAlertId, $activeBookId, $inside);
        $this->outboundEmail('price_alert_target_price', 'queued', $inside);
        $this->outboundEmail('price_alert_new_lowest', 'failed', $inside);
        $this->outboundEmail('email_verification', 'queued', $inside);
        $this->audit($adminId, $inside);

        $this->observation($activeOfferId, $now->modify('-2 hours')->format('Y-m-d H:i:s'), 100000);
        $this->observation($activeOfferId, $now->modify('-1 hour')->format('Y-m-d H:i:s'), 90000);

        $beforeAuditCount = $this->db->table('admin_audit_logs')->countAllResults();
        $response = $this->withHeaders($this->cookie($token))->get('/api/admin/dashboard?from=2020-01-01');
        $response->assertOK();
        $data = $this->json($response)['data'];

        $this->assertSame('Asia/Ho_Chi_Minh', $data['window']['timezone']);
        $this->assertSame(7, $data['window']['days']);
        $this->assertSame($beforeAuditCount, $this->db->table('admin_audit_logs')->countAllResults());
        $summary = array_column($data['summary_cards'], 'value', 'key');
        $this->assertSame(2, $summary['affiliate_redirects']);
        $this->assertSame(1, $summary['email_deal_link_clicks']);
        $this->assertSame(1, $summary['redirect_failures']);
        $this->assertSame(2, $summary['active_alerts']);
        $this->assertSame(2, $summary['evaluable_alerts']);
        $this->assertSame(1, $summary['email_suppressed_active_alerts']);
        $this->assertSame(1, $summary['auto_paused_alerts']);
        $this->assertSame(1, $summary['expired_alerts']);
        $this->assertSame(1, $summary['alert_email_sent']);
        $this->assertSame(1, $summary['alert_email_failed']);
        $this->assertSame(1, $summary['admin_mutations']);

        $bookRows = array_column($data['affiliate_redirects']['by_book'], null, 'book_id');
        $this->assertTrue($bookRows[$archivedBookId]['archived']);
        $this->assertSame(1, $bookRows[$archivedBookId]['redirect_count']);
        $this->assertSame(2, $data['affiliate_redirects']['by_retailer'][0]['redirect_count']);
        $this->assertSame(1, $data['email_engagement']['by_book_and_alert_type'][0]['click_count']);
        $this->assertSame('target_price', $data['email_engagement']['by_book_and_alert_type'][0]['alert_type']);
        $this->assertSame(1, $data['redirect_failures']['by_reason'][0]['failure_count']);
        $this->assertSame('invalid_destination', $data['redirect_failures']['by_reason'][0]['failure_reason']);

        $priceRows = array_column($data['price_changes']['items'], null, 'book_id');
        $this->assertSame(90000, $priceRows[$activeBookId]['latest_price']);
        $this->assertSame(100000, $priceRows[$activeBookId]['previous_price']);
        $this->assertSame(-10000, $priceRows[$activeBookId]['change_amount']);
    }

    private function user(string $email, string $role, bool $alertEmailsEnabled = true): int
    {
        $this->db->table('users')->insert([
            'normalized_email' => $email,
            'display_email' => $email,
            'role' => $role,
            'status' => 'active',
            'alert_email_enabled' => $alertEmailsEnabled ? 1 : 0,
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);

        return (int) $this->db->insertID();
    }

    private function sessionFor(int $userId): string
    {
        return (new AuthService())->createSession($userId)['token'];
    }

    private function category(): int
    {
        $this->db->table('categories')->insert([
            'name' => 'Kỹ năng sống',
            'slug' => 'ky-nang-song-dashboard',
            'status' => 'active',
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);

        return (int) $this->db->insertID();
    }

    private function book(int $categoryId, string $title, string $status): int
    {
        $this->db->table('books')->insert([
            'title' => $title,
            'author' => 'DealSach',
            'publisher' => 'NXB Kiểm thử',
            'isbn' => null,
            'description' => null,
            'cover_image' => null,
            'primary_category_id' => $categoryId,
            'is_featured' => 0,
            'status' => $status,
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);

        return (int) $this->db->insertID();
    }

    private function retailerAndMerchant(string $name, string $slug, string $status): array
    {
        $this->db->table('retailer_platforms')->insert([
            'name' => $name,
            'slug' => $slug,
            'approved_domains' => json_encode([$slug . '.vn']),
            'status' => $status,
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);
        $retailerId = (int) $this->db->insertID();
        $this->db->table('merchants')->insert([
            'retailer_platform_id' => $retailerId,
            'name' => $name . ' Trading',
            'slug' => $slug . '-trading',
            'status' => 'active',
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);

        return [$retailerId, (int) $this->db->insertID()];
    }

    private function offer(int $bookId, int $retailerId, int $merchantId, string $title, string $status): int
    {
        $this->db->table('offers')->insert([
            'book_id' => $bookId,
            'retailer_platform_id' => $retailerId,
            'merchant_id' => $merchantId,
            'external_offer_title' => $title,
            'affiliate_destination_url' => 'https://tiki.vn/dashboard-test',
            'destination_status' => 'valid',
            'status' => $status,
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);

        return (int) $this->db->insertID();
    }

    private function affiliateRedirect(int $offerId, int $bookId, int $retailerId, int $merchantId, string $eventAt): void
    {
        $this->db->table('affiliate_redirects')->insert($this->eventPayload($offerId, $bookId, $retailerId, $merchantId, $eventAt) + [
            'event_type' => 'affiliate_redirect',
            'redirect_status' => 'redirected',
        ]);
    }

    private function redirectFailure(int $offerId, int $bookId, int $retailerId, int $merchantId, string $eventAt, string $reason): void
    {
        $this->db->table('redirect_failures')->insert($this->eventPayload($offerId, $bookId, $retailerId, $merchantId, $eventAt) + [
            'event_type' => 'redirect_failure',
            'failure_reason' => $reason,
        ]);
    }

    private function eventPayload(int $offerId, int $bookId, int $retailerId, int $merchantId, string $eventAt): array
    {
        return [
            'offer_id' => $offerId,
            'book_id' => $bookId,
            'retailer_platform_id' => $retailerId,
            'merchant_id' => $merchantId,
            'event_at' => $eventAt,
            'destination_domain' => 'tiki.vn',
            'destination_path_summary' => '/dashboard-test',
            'created_at' => $eventAt,
            'updated_at' => $eventAt,
        ];
    }

    private function alert(int $userId, int $bookId, string $type, string $status): int
    {
        $this->db->table('price_alerts')->insert([
            'user_id' => $userId,
            'book_id' => $bookId,
            'alert_type' => $type,
            'status' => $status,
            'target_price' => $type === 'target_price' ? 100000 : null,
            'baseline_price' => $type === 'new_lowest_price' ? 110000 : null,
            'baseline_pending' => 0,
            'comparison_price' => $type === 'target_price' ? 120000 : null,
            'last_notified_price' => null,
            'notification_count' => 0,
            'expires_at' => (new DateTimeImmutable('now', new DateTimeZone('Asia/Ho_Chi_Minh')))->modify('+30 days')->format('Y-m-d H:i:s'),
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);

        return (int) $this->db->insertID();
    }

    private function emailClick(int $alertId, int $bookId, string $clickedAt): void
    {
        $this->db->table('email_deal_links')->insert([
            'price_alert_id' => $alertId,
            'outbound_email_id' => null,
            'book_id' => $bookId,
            'token_hash' => hash('sha256', 'dashboard-token'),
            'landing_path' => '/book/' . $bookId,
            'created_at' => $clickedAt,
            'updated_at' => $clickedAt,
        ]);
        $linkId = (int) $this->db->insertID();
        $this->db->table('email_deal_link_clicks')->insert([
            'email_deal_link_id' => $linkId,
            'price_alert_id' => $alertId,
            'book_id' => $bookId,
            'clicked_at' => $clickedAt,
            'ip_address' => null,
            'user_agent' => null,
            'created_at' => $clickedAt,
            'updated_at' => $clickedAt,
        ]);
    }

    private function outboundEmail(string $type, string $status, string $createdAt): void
    {
        $this->db->table('outbound_emails')->insert([
            'normalized_recipient_email' => 'reader@example.com',
            'display_recipient_email' => 'reader@example.com',
            'email_type' => $type,
            'subject' => 'DealSach',
            'body_text' => 'Nội dung kiểm thử',
            'metadata_json' => null,
            'status' => $status,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }

    private function audit(int $adminId, string $createdAt): void
    {
        $this->db->table('admin_audit_logs')->insert([
            'admin_user_id' => $adminId,
            'actor_email' => 'admin@example.com',
            'action_type' => 'book_updated',
            'entity_type' => 'book',
            'entity_id' => '1',
            'summary' => 'Cập nhật sách kiểm thử.',
            'before_json' => null,
            'after_json' => null,
            'created_at' => $createdAt,
        ]);
    }

    private function observation(int $offerId, string $observedAt, int $price): void
    {
        $date = substr($observedAt, 0, 10);
        $cycle = $this->db->table('observation_cycles')->where('cycle_date', $date)->get()->getFirstRow();
        if ($cycle === null) {
            $this->db->table('observation_cycles')->insert([
                'cycle_date' => $date,
                'processed_at' => $observedAt,
                'notes' => null,
                'created_at' => $observedAt,
                'updated_at' => $observedAt,
            ]);
            $cycleId = (int) $this->db->insertID();
        } else {
            $cycleId = (int) $cycle->id;
        }

        $this->db->table('price_observations')->insert([
            'offer_id' => $offerId,
            'observation_cycle_id' => $cycleId,
            'observed_at' => $observedAt,
            'availability_status' => 'available',
            'listed_item_price' => $price,
            'book_status_at_observation' => 'active',
            'offer_status_at_observation' => 'active',
            'retailer_status_at_observation' => 'active',
            'merchant_status_at_observation' => 'active',
            'merchant_retailer_consistent_at_observation' => 1,
            'destination_status_at_observation' => 'valid',
            'created_at' => $observedAt,
            'updated_at' => $observedAt,
        ]);
    }

    private function cookie(string $token): array
    {
        return ['Cookie' => AuthService::COOKIE_NAME . '=' . $token];
    }

    private function json(object $result): array
    {
        $decoded = json_decode($result->getJSON(), true);
        $this->assertIsArray($decoded);

        return $decoded;
    }
}
