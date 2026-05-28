<?php

use App\Libraries\AuthService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class AdminCatalogFeatureTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $namespace = 'App';

    public function testCatalogApisRejectGuestsAndRegisteredUsers(): void
    {
        $this->get('/api/admin/books')->assertStatus(401);

        $token = $this->sessionFor($this->user('reader@example.com', 'registered'));
        $response = $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $token])->get('/api/admin/books');

        $response->assertStatus(403);
        $this->assertSame('Tài khoản này không có quyền quản trị.', $this->json($response)['message']);
    }

    public function testAdminCanManageCategoryAndPublicFiltersHideArchivedCategories(): void
    {
        $token = $this->adminToken();

        $create = $this->withHeaders($this->cookie($token))->post('/api/admin/categories', [
            'name' => 'Tài chính cá nhân',
            'slug' => 'tai-chinh-ca-nhan',
            'display_label' => 'Tài chính',
            'display_description' => 'Danh mục tài chính cho người đọc phổ thông.',
            'display_order' => 25,
        ]);
        $create->assertStatus(201);
        $createdCategory = $this->json($create)['data'];
        $categoryId = (int) $createdCategory['id'];
        $this->assertSame('Tài chính', $createdCategory['display_label']);
        $this->assertSame(25, (int) $createdCategory['display_order']);

        $update = $this
            ->withHeaders([
                ...$this->cookie($token),
                'Content-Type' => 'application/json',
            ])
            ->withBody(json_encode([
                'name' => 'Tài chính ứng dụng',
                'display_label' => 'Tài chính ứng dụng',
                'display_order' => 15,
            ], JSON_UNESCAPED_UNICODE))
            ->call('patch', '/api/admin/categories/' . $categoryId);
        $update->assertOK();
        $updatedCategory = $this->json($update)['data'];
        $this->assertSame('Tài chính ứng dụng', $updatedCategory['display_label']);
        $this->assertSame(15, (int) $updatedCategory['display_order']);
        $this->assertSame(2, $this->db->table('admin_audit_logs')->where('entity_type', 'category')->countAllResults());

        $this->withHeaders($this->cookie($token))->post('/api/admin/categories/' . $categoryId . '/archive')->assertOK();
        $filters = $this->json($this->get('/api/public/filters'));
        $this->assertNotContains('tai-chinh-ca-nhan', array_column($filters['data']['categories'], 'slug'));

        $this->withHeaders($this->cookie($token))->post('/api/admin/categories/' . $categoryId . '/restore')->assertOK();
        $filters = $this->json($this->get('/api/public/filters'));
        $this->assertContains('tai-chinh-ca-nhan', array_column($filters['data']['categories'], 'slug'));
        $restored = array_values(array_filter($filters['data']['categories'], static fn (array $category): bool => $category['slug'] === 'tai-chinh-ca-nhan'));
        $this->assertCount(1, $restored);
        $this->assertSame('Tài chính ứng dụng', $restored[0]['display_label']);
        $this->assertSame(15, (int) $restored[0]['display_order']);
    }

    public function testBookArchiveHidesPublicBookPausesActiveAlertsAndPreservesWishlist(): void
    {
        $token = $this->adminToken();
        $readerId = $this->user('reader@example.com', 'registered');
        $bookId = $this->book($this->category());
        $this->wishlist($readerId, $bookId);
        $alertId = $this->alert($readerId, $bookId, 'Active');

        $this->get('/api/public/books/' . $bookId)->assertOK();
        $this->withHeaders($this->cookie($token))->post('/api/admin/books/' . $bookId . '/archive')->assertOK();

        $this->get('/api/public/books/' . $bookId)->assertStatus(404);
        $this->assertSame('Paused', $this->db->table('price_alerts')->where('id', $alertId)->get()->getFirstRow()->status);

        $readerToken = $this->sessionFor($readerId);
        $wishlist = $this->json($this->withHeaders($this->cookie($readerToken))->get('/api/user/wishlist'));
        $this->assertTrue($wishlist['data']['items'][0]['archived']);
        $this->assertSame('Sách đã lưu trữ', $wishlist['data']['items'][0]['status']['label']);

        $this->withHeaders($this->cookie($token))->post('/api/admin/books/' . $bookId . '/restore')->assertOK();
        $this->get('/api/public/books/' . $bookId)->assertOK();
        $this->assertSame('Paused', $this->db->table('price_alerts')->where('id', $alertId)->get()->getFirstRow()->status);
    }

    public function testRetailerMerchantOfferValidationEligibilityAndAuditMasking(): void
    {
        $token = $this->adminToken();
        $bookId = $this->book($this->category());

        $retailer = $this->json($this->withHeaders($this->cookie($token))->post('/api/admin/retailers', [
            'name' => 'Tiki',
            'slug' => 'tiki',
            'approved_domains' => ['tiki.vn'],
        ]))['data'];
        $merchant = $this->json($this->withHeaders($this->cookie($token))->post('/api/admin/merchants', [
            'name' => 'Tiki Trading',
            'slug' => 'tiki-trading',
            'retailer_platform_id' => $retailer['id'],
        ]))['data'];

        $invalid = $this->withHeaders($this->cookie($token))->post('/api/admin/offers', [
            'book_id' => $bookId,
            'retailer_platform_id' => $retailer['id'],
            'merchant_id' => $merchant['id'],
            'external_offer_title' => 'Sách test',
            'affiliate_destination_url' => 'http://evil.test/x?aff_secret=abc',
        ]);
        $invalid->assertStatus(422);

        $offer = $this->json($this->withHeaders($this->cookie($token))->post('/api/admin/offers', [
            'book_id' => $bookId,
            'retailer_platform_id' => $retailer['id'],
            'merchant_id' => $merchant['id'],
            'external_offer_title' => 'Sách test',
            'affiliate_destination_url' => 'https://tiki.vn/sach-test?aff_secret=abc',
            'status' => 'active',
        ]))['data'];
        $this->assertContains('stale_latest_observation', $offer['eligibility_review']['reasons']);

        $log = $this->db->table('admin_audit_logs')->where('action_type', 'offer_created')->get()->getFirstRow();
        $this->assertStringContainsString('tiki.vn/sach-test', (string) $log->after_json);
        $this->assertStringNotContainsString('aff_secret', (string) $log->after_json);

        $this->withHeaders($this->cookie($token))->post('/api/admin/retailers/' . $retailer['id'] . '/archive')->assertOK();
        $detail = $this->json($this->withHeaders($this->cookie($token))->get('/api/admin/offers/' . $offer['id']));
        $this->assertContains('archived_related_entity', $detail['data']['eligibility_review']['reasons']);
    }

    public function testAdminCanAddObservationWithObservationTimeState(): void
    {
        $token = $this->adminToken();
        $categoryId = $this->category();
        $bookId = $this->book($categoryId);
        [$retailerId, $merchantId] = $this->retailerAndMerchant();
        $offer = $this->json($this->withHeaders($this->cookie($token))->post('/api/admin/offers', [
            'book_id' => $bookId,
            'retailer_platform_id' => $retailerId,
            'merchant_id' => $merchantId,
            'external_offer_title' => 'Ưu đãi có quan sát',
            'affiliate_destination_url' => 'https://tiki.vn/uu-dai',
            'status' => 'active',
        ]))['data'];

        $response = $this->withHeaders($this->cookie($token))->post('/api/admin/offers/' . $offer['id'] . '/observations', [
            'cycle_date' => '2026-05-27',
            'observed_at' => '2026-05-27 09:15:00',
            'availability_status' => 'available',
            'listed_item_price' => 99000,
        ]);
        $response->assertStatus(201);

        $observation = $this->db->table('price_observations')->where('offer_id', $offer['id'])->get()->getFirstRow();
        $this->assertSame('active', $observation->book_status_at_observation);
        $this->assertSame('active', $observation->offer_status_at_observation);
        $this->assertSame('active', $observation->retailer_status_at_observation);
        $this->assertSame('valid', $observation->destination_status_at_observation);
        $this->assertSame('2026-05-27 09:15:00', $observation->observed_at);
    }

    private function adminToken(): string
    {
        return $this->sessionFor($this->user('admin@example.com', 'admin'));
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

    private function category(): int
    {
        $this->db->table('categories')->insert([
            'name' => 'Kỹ năng sống',
            'slug' => 'ky-nang-song-' . random_int(1000, 9999),
            'display_label' => null,
            'display_description' => null,
            'display_order' => 0,
            'status' => 'active',
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);

        return (int) $this->db->insertID();
    }

    private function book(int $categoryId): int
    {
        $this->db->table('books')->insert([
            'title' => 'Sách kiểm thử catalog',
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

    private function wishlist(int $userId, int $bookId): void
    {
        $this->db->table('wishlist_items')->insert(['user_id' => $userId, 'book_id' => $bookId, 'created_at' => '2026-05-27 08:00:00', 'updated_at' => '2026-05-27 08:00:00']);
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

    private function retailerAndMerchant(): array
    {
        $this->db->table('retailer_platforms')->insert([
            'name' => 'Tiki',
            'slug' => 'tiki-' . random_int(1000, 9999),
            'approved_domains' => json_encode(['tiki.vn']),
            'status' => 'active',
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);
        $retailerId = (int) $this->db->insertID();
        $this->db->table('merchants')->insert([
            'retailer_platform_id' => $retailerId,
            'name' => 'Tiki Trading',
            'slug' => 'tiki-trading',
            'status' => 'active',
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);

        return [$retailerId, (int) $this->db->insertID()];
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
