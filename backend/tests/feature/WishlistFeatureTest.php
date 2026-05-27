<?php

use App\Database\Seeds\DealSachDemoSeeder;
use App\Libraries\AuthService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class WishlistFeatureTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $seed = DealSachDemoSeeder::class;
    protected $namespace = 'App';

    public function testGuestWishlistRequestsAreRejectedWithVietnameseJson(): void
    {
        foreach ([
            $this->get('/api/user/wishlist'),
            $this->get('/api/user/wishlist/books/1'),
            $this->post('/api/user/wishlist/books/1'),
            $this->delete('/api/user/wishlist/books/1'),
        ] as $result) {
            $result->assertStatus(401);
            $body = $this->json($result);
            $this->assertSame('error', $body['status']);
            $this->assertSame('Vui lòng đăng nhập để dùng danh sách yêu thích.', $body['message']);
            $this->assertNull($body['data']);
            $this->assertArrayHasKey('auth', $body['errors']);
        }
    }

    public function testAuthenticatedUserCanAddListStatusAndRemoveWishlistBook(): void
    {
        $token = $this->createAuthenticatedSession('wishlist@example.com');
        $bookId = $this->bookIdByIsbn('9786041000003');

        $add = $this->auth($token)->post('/api/user/wishlist/books/' . $bookId);
        $add->assertOK();
        $this->assertTrue($this->json($add)['data']['wishlisted']);

        $status = $this->auth($token)->get('/api/user/wishlist/books/' . $bookId);
        $status->assertOK();
        $this->assertTrue($this->json($status)['data']['wishlisted']);

        $list = $this->auth($token)->get('/api/user/wishlist');
        $list->assertOK();
        $item = $this->json($list)['data']['items'][0];
        $this->assertSame($bookId, $item['id']);
        $this->assertSame('Nhà giả kim', $item['title']);
        $this->assertSame('Văn học Việt Nam', $item['category']);
        $this->assertArrayHasKey('lowest_eligible_price', $item);
        $this->assertArrayHasKey('added_at', $item);
        $this->assertFalse($item['archived']);

        $remove = $this->auth($token)->delete('/api/user/wishlist/books/' . $bookId);
        $remove->assertOK();
        $this->assertFalse($this->json($remove)['data']['wishlisted']);

        $removedStatus = $this->auth($token)->get('/api/user/wishlist/books/' . $bookId);
        $this->assertFalse($this->json($removedStatus)['data']['wishlisted']);
    }

    public function testDuplicateAddAndMissingRemoveAreNoOpSuccesses(): void
    {
        $token = $this->createAuthenticatedSession('noop@example.com');
        $bookId = $this->bookIdByIsbn('9786041000003');

        $this->auth($token)->post('/api/user/wishlist/books/' . $bookId)->assertOK();
        $this->auth($token)->post('/api/user/wishlist/books/' . $bookId)->assertOK();
        $this->assertSame(1, $this->db->table('wishlist_items')->where('book_id', $bookId)->countAllResults());

        $otherBookId = $this->bookIdByIsbn('9786041000004');
        $removeMissing = $this->auth($token)->delete('/api/user/wishlist/books/' . $otherBookId);
        $removeMissing->assertOK();
        $this->assertFalse($this->json($removeMissing)['data']['wishlisted']);
    }

    public function testArchivedBookCannotBeNewlyAddedButExistingItemRemainsListed(): void
    {
        $token = $this->createAuthenticatedSession('archived@example.com');
        $bookId = $this->bookIdByIsbn('9786041000003');

        $this->db->table('books')->where('id', $bookId)->update(['status' => 'archived']);

        $rejected = $this->auth($token)->post('/api/user/wishlist/books/' . $bookId);
        $rejected->assertStatus(404);
        $this->assertSame('error', $this->json($rejected)['status']);

        $userId = $this->userIdByEmail('archived@example.com');
        $this->db->table('wishlist_items')->insert([
            'user_id' => $userId,
            'book_id' => $bookId,
            'created_at' => '2026-05-27 09:00:00',
            'updated_at' => '2026-05-27 09:00:00',
        ]);

        $list = $this->auth($token)->get('/api/user/wishlist');
        $list->assertOK();
        $item = $this->json($list)['data']['items'][0];
        $this->assertSame($bookId, $item['id']);
        $this->assertTrue($item['archived']);
        $this->assertSame('archived', $item['status']['value']);
        $this->assertSame('Sách đã lưu trữ', $item['status']['label']);
    }

    public function testInvalidatedOrDeactivatedSessionIsRejected(): void
    {
        $token = $this->createAuthenticatedSession('blocked-session@example.com');
        $this->db->table('users')->where('normalized_email', 'blocked-session@example.com')->update(['status' => 'deactivated']);

        $result = $this->auth($token)->get('/api/user/wishlist');
        $result->assertStatus(401);
        $this->assertSame('error', $this->json($result)['status']);
    }

    public function testPublicCatalogAndBuyFlowSmokeStillPassAfterWishlistMigration(): void
    {
        foreach (['/api/public/filters', '/api/public/discovery', '/api/public/books'] as $path) {
            $this->get($path)->assertOK();
        }

        $offerId = $this->offerIdByTitle('Nhà giả kim - tái bản');
        $result = $this->get('/go/offers/' . $offerId);
        $result->assertStatus(302);
        $this->assertSame('https://tiki.vn/nha-gia-kim-demo', $result->response()->getHeaderLine('Location'));
    }

    private function createAuthenticatedSession(string $email): string
    {
        $this->db->table('users')->insert([
            'normalized_email' => $email,
            'display_email' => $email,
            'role' => 'registered',
            'status' => 'active',
            'alert_email_enabled' => 1,
            'created_at' => '2026-05-27 09:00:00',
            'updated_at' => '2026-05-27 09:00:00',
        ]);
        $userId = (int) $this->db->insertID();
        $token = bin2hex(random_bytes(32));

        $this->db->table('user_sessions')->insert([
            'user_id' => $userId,
            'token_hash' => hash('sha256', $token),
            'status' => 'active',
            'issued_at' => '2026-05-27 09:00:00',
            'expires_at' => '2026-06-03 09:00:00',
            'last_seen_at' => '2026-05-27 09:00:00',
            'created_at' => '2026-05-27 09:00:00',
            'updated_at' => '2026-05-27 09:00:00',
        ]);

        return $token;
    }

    private function auth(string $token): self
    {
        return $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $token]);
    }

    private function bookIdByIsbn(string $isbn): int
    {
        return (int) $this->db->table('books')
            ->select('id')
            ->where('isbn', $isbn)
            ->get()
            ->getFirstRow()
            ->id;
    }

    private function offerIdByTitle(string $title): int
    {
        return (int) $this->db->table('offers')
            ->select('id')
            ->where('external_offer_title', $title)
            ->get()
            ->getFirstRow()
            ->id;
    }

    private function userIdByEmail(string $email): int
    {
        return (int) $this->db->table('users')
            ->select('id')
            ->where('normalized_email', $email)
            ->get()
            ->getFirstRow()
            ->id;
    }

    /**
     * @return array<string, mixed>
     */
    private function json(object $result): array
    {
        $decoded = json_decode($result->getJSON(), true);
        $this->assertIsArray($decoded);

        return $decoded;
    }
}
