<?php

use App\Database\Seeds\DealSachDemoSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class PublicCatalogApiTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $seed = DealSachDemoSeeder::class;
    protected $namespace = 'App';

    public function testPublicRoutesReturnJsonAndExpectedStatuses(): void
    {
        $bookId = $this->bookIdByIsbn('9786041000001');

        foreach (['/api/public/books', '/api/public/discovery', '/api/public/filters', '/api/public/books/' . $bookId] as $path) {
            $result = $this->get($path);
            $result->assertOK();
            $this->assertStringStartsWith('application/json', $result->response()->getHeaderLine('Content-Type'));
            $this->assertSame('success', $this->json($result)['status']);
        }

        $this->get('/api/public/books/999999')->assertStatus(404);
    }

    public function testInvalidQueryParametersReturnVietnameseValidationErrors(): void
    {
        $result = $this->get('/api/public/books?availability=no_available_offer&min_price=abc&foo=bar');

        $result->assertStatus(422);
        $body = $this->json($result);

        $this->assertSame('error', $body['status']);
        $this->assertSame('Bộ lọc tình trạng không hợp lệ.', $body['errors']['availability']);
        $this->assertSame('Tham số không được hỗ trợ.', $body['errors']['foo']);
        $this->assertArrayHasKey('min_price', $body['errors']);
    }

    public function testSearchExcludesArchivedBooksAndSupportsVietnameseAccentNormalization(): void
    {
        $this->db->table('books')
            ->where('isbn', '9786041000012')
            ->update(['status' => 'archived']);

        $accented = $this->json($this->get('/api/public/books?q=Đắc nhân tâm'));
        $unaccented = $this->json($this->get('/api/public/books?q=dac%20nhan%20tam'));
        $archived = $this->json($this->get('/api/public/books?q=Viet%20Nam%20su%20luoc'));

        $this->assertSame('Đắc nhân tâm', $accented['data']['items'][0]['title']);
        $this->assertSame('Đắc nhân tâm', $unaccented['data']['items'][0]['title']);
        $this->assertSame(0, $archived['data']['pagination']['total']);
    }

    public function testIsbnSearchIgnoresHyphensAndSpaces(): void
    {
        $body = $this->json($this->get('/api/public/books?q=978-604%201000003'));

        $this->assertSame('Nhà giả kim', $body['data']['items'][0]['title']);
    }

    public function testSuggestionsSupportAccentNormalizationPartialMatchAndBoundedResults(): void
    {
        $accented = $this->json($this->get('/api/public/books/suggestions?q=Đắc'));
        $unaccented = $this->json($this->get('/api/public/books/suggestions?q=dac%20nhan'));
        $bounded = $this->json($this->get('/api/public/books/suggestions?q=a&limit=20'));

        $this->assertSame('Đắc nhân tâm', $accented['data']['items'][0]['title']);
        $this->assertSame('Đắc nhân tâm', $unaccented['data']['items'][0]['title']);
        $this->assertLessThanOrEqual(6, count($bounded['data']['items']));
        $this->assertSame(6, $bounded['data']['limit']);
    }

    public function testSuggestionsReturnRequiredFieldsAndExcludeArchivedBooks(): void
    {
        $this->db->table('books')
            ->where('isbn', '9786041000012')
            ->update(['status' => 'archived']);

        $this->makeOnlyUnavailableBookVisible();
        $suggestions = $this->json($this->get('/api/public/books/suggestions?q=dac%20nhan'));
        $archived = $this->json($this->get('/api/public/books/suggestions?q=Viet%20Nam%20su%20luoc'));

        $this->assertNotEmpty($suggestions['data']['items']);
        $first = $suggestions['data']['items'][0];
        $this->assertArrayHasKey('title', $first);
        $this->assertArrayHasKey('author', $first);
        $this->assertArrayHasKey('category', $first);
        $this->assertArrayHasKey('lowest_eligible_price', $first);
        $this->assertArrayHasKey('status', $first);
        $this->assertSame('Tạm hết hàng', $first['status']['label']);
        $this->assertSame([], $archived['data']['items']);
    }

    public function testPaginationDefaultsToTwelveBooks(): void
    {
        $body = $this->json($this->get('/api/public/books'));

        $this->assertCount(12, $body['data']['items']);
        $this->assertSame(12, $body['data']['pagination']['per_page']);
    }

    public function testAvailabilityFiltersUseRequiredBuckets(): void
    {
        $available = $this->json($this->get('/api/public/books?availability=available_now'));
        $stale = $this->json($this->get('/api/public/books?availability=stale_reference'));

        $this->makeOnlyMissingLinkBookVisible();
        $missing = $this->json($this->get('/api/public/books?availability=missing_valid_seller_link&q=hoa%20vang'));

        $this->assertGreaterThan(0, $available['data']['pagination']['total']);
        $this->assertContains('Nghĩ giàu làm giàu', array_column($stale['data']['items'], 'title'));
        $this->assertSame('Tôi thấy hoa vàng trên cỏ xanh', $missing['data']['items'][0]['title']);
        $this->assertSame('Chưa có liên kết mua hợp lệ', $missing['data']['items'][0]['status']['label']);
    }

    public function testPriceRangeFiltersUseOnlyCurrentlyEligibleOffers(): void
    {
        $body = $this->json($this->get('/api/public/books?min_price=120000&max_price=130000'));
        $titles = array_column($body['data']['items'], 'title');

        $this->assertNotContains('Nghĩ giàu làm giàu', $titles, 'Stale prices must not satisfy price range filters.');
        foreach ($body['data']['items'] as $item) {
            $this->assertNotNull($item['lowest_eligible_price']);
            $this->assertGreaterThanOrEqual(120000, $item['lowest_eligible_price']);
            $this->assertLessThanOrEqual(130000, $item['lowest_eligible_price']);
        }
    }

    public function testBookCardStatusPriorityIsApplied(): void
    {
        $this->makeOnlyMissingLinkBookVisible();
        $missing = $this->json($this->get('/api/public/books?q=hoa%20vang'))['data']['items'][0];

        $this->makeOnlyUnavailableBookVisible();
        $unavailable = $this->json($this->get('/api/public/books?q=dac%20nhan%20tam'))['data']['items'][0];

        $stale = $this->json($this->get('/api/public/books?q=nghi%20giau'))['data']['items'][0];

        $this->assertSame('missing_valid_seller_link', $missing['status']['value']);
        $this->assertSame('temporarily_unavailable', $unavailable['status']['value']);
        $this->assertSame('stale_reference', $stale['status']['value']);
    }

    public function testBookDetailGroupsOffersAndSuppressesInactiveBuyActions(): void
    {
        $nhaGiaKim = $this->json($this->get('/api/public/books/' . $this->bookIdByIsbn('9786041000003')))['data']['offers'];
        $dacNhanTam = $this->json($this->get('/api/public/books/' . $this->bookIdByIsbn('9786041000004')))['data']['offers'];
        $nghiGiau = $this->json($this->get('/api/public/books/' . $this->bookIdByIsbn('9786041000007')))['data']['offers'];

        $this->assertNotEmpty($nhaGiaKim['purchasable']);
        $this->assertNotEmpty($nhaGiaKim['missing_valid_seller_link']);
        $this->assertNotEmpty($dacNhanTam['unavailable']);
        $this->assertNotEmpty($nghiGiau['stale_reference']);

        $this->assertNotNull($nhaGiaKim['purchasable'][0]['buy_action']);
        $this->assertNull($nhaGiaKim['missing_valid_seller_link'][0]['buy_action']);
        $this->assertNull($dacNhanTam['unavailable'][0]['buy_action']);
        $this->assertNull($nghiGiau['stale_reference'][0]['buy_action']);
        $this->assertNotNull($dacNhanTam['unavailable'][0]['last_available_price']);
    }

    public function testLowestEligiblePriceCoversCurrentEligibilityRules(): void
    {
        $nhaGiaKim = $this->json($this->get('/api/public/books?q=nha%20gia%20kim'))['data']['items'][0];
        $nghiGiau = $this->json($this->get('/api/public/books?q=nghi%20giau'))['data']['items'][0];

        $this->assertSame(139000, $nhaGiaKim['lowest_eligible_price']);
        $this->assertSame(139000, $nhaGiaKim['highest_eligible_price']);
        $this->assertSame('available_now', $nhaGiaKim['status']['value']);
        $this->assertNull($nghiGiau['lowest_eligible_price']);
        $this->assertNull($nghiGiau['highest_eligible_price']);
    }

    public function testPriceHistoryUsesObservationTimeEligibilityAndOmitsExactTimestamps(): void
    {
        $body = $this->json($this->get('/api/public/books/' . $this->bookIdByIsbn('9786041000003')));
        $expectedFirstDate = (new DateTimeImmutable('now', new DateTimeZone('Asia/Ho_Chi_Minh')))->modify('-13 days')->format('Y-m-d');

        $this->assertNotEmpty($body['data']['price_history']);
        $this->assertSame($expectedFirstDate, $body['data']['price_history'][0]['date']);
        $this->assertArrayNotHasKey('observed_at', $body['data']['price_history'][0]);
        $this->assertFalse($this->containsTimestampKey($body));
    }

    public function testDiscoveryReturnsPriceDropsAndPersistedPopularClickedDeals(): void
    {
        $body = $this->json($this->get('/api/public/discovery'));
        $featuredSection = $body['data']['featured_books'];
        $dropsSection = $body['data']['recent_price_drops'];
        $popularSection = $body['data']['popular_clicked_deals'];
        $featuredCategorySlugs = array_unique(array_column($body['data']['featured_books']['items'], 'category_slug'));
        $allDiscoveryCards = [
            ...$featuredSection['items'],
            ...$dropsSection['items'],
            ...$popularSection['items'],
        ];
        $cardsWithReferenceSpread = array_values(array_filter($allDiscoveryCards, static fn (array $card): bool => isset($card['lowest_eligible_price'], $card['highest_eligible_price'])
            && $card['lowest_eligible_price'] !== null
            && $card['highest_eligible_price'] !== null
            && $card['highest_eligible_price'] > $card['lowest_eligible_price']));

        $this->assertNotEmpty($body['data']['featured_books']['items']);
        $this->assertGreaterThanOrEqual(4, count($featuredCategorySlugs));
        $this->assertNotEmpty($body['data']['recent_price_drops']['items']);
        $this->assertGreaterThan(0, $body['data']['recent_price_drops']['items'][0]['price_drop']['amount']);
        $this->assertNotEmpty($body['data']['popular_clicked_deals']['items']);
        $this->assertGreaterThanOrEqual(5, count($body['data']['popular_clicked_deals']['items']));
        $this->assertSame('Cà phê cùng Tony', $body['data']['popular_clicked_deals']['items'][0]['title']);
        $this->assertSame(3, $body['data']['popular_clicked_deals']['items'][0]['popular_clicked_deal']['redirect_count_7d']);
        $this->assertSame('Fahasa', $body['data']['popular_clicked_deals']['items'][0]['popular_clicked_deal']['top_retailer']['name']);
        $this->assertNull($body['data']['popular_clicked_deals']['empty_state']);
        $this->assertSame('Mở trang tìm kiếm', $dropsSection['cta_label']);
        $this->assertSame('/search', $dropsSection['cta_href']);
        $this->assertSame('7 ngày gần đây', $dropsSection['window']['label']);
        $this->assertSame(7, $dropsSection['window']['days']);
        $this->assertSame('Asia/Ho_Chi_Minh', $dropsSection['window']['timezone']);
        $this->assertSame('Khám phá thêm', $popularSection['cta_label']);
        $this->assertSame('/search', $popularSection['cta_href']);
        $this->assertArrayHasKey('subtitle', $featuredSection);
        $this->assertArrayHasKey('subtitle', $dropsSection);
        $this->assertArrayHasKey('subtitle', $popularSection);
        $this->assertNotEmpty($cardsWithReferenceSpread);
    }

    public function testFiltersEndpointReturnsMetadataWithoutBroadNoAvailableOfferFilter(): void
    {
        $body = $this->json($this->get('/api/public/filters'));
        $availabilityValues = array_column($body['data']['availability'], 'value');

        $this->assertContains('available_now', $availabilityValues);
        $this->assertContains('missing_valid_seller_link', $availabilityValues);
        $this->assertNotContains('no_available_offer', $availabilityValues);
        $this->assertContains('Tiki', array_column($body['data']['retailers'], 'name'));

        $categorySlugs = array_column($body['data']['categories'], 'slug');
        $this->assertContains('cong-nghe', $categorySlugs);
        $this->assertContains('kinh-te', $categorySlugs);
        $this->assertNotContains('tai-chinh', $categorySlugs);

        $technology = array_values(array_filter($body['data']['categories'], static fn (array $category): bool => $category['slug'] === 'cong-nghe'));
        $this->assertCount(1, $technology);
        $this->assertArrayHasKey('display_label', $technology[0]);
        $this->assertArrayHasKey('display_description', $technology[0]);
        $this->assertArrayHasKey('display_order', $technology[0]);
        $this->assertSame('Công nghệ & lập trình', $technology[0]['display_label']);
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

    private function makeOnlyMissingLinkBookVisible(): void
    {
        $this->db->table('offers')
            ->where('id', $this->offerIdByTitle('Tôi thấy hoa vàng trên cỏ xanh'))
            ->update(['status' => 'inactive']);
    }

    private function makeOnlyUnavailableBookVisible(): void
    {
        $this->db->table('offers')
            ->where('id', $this->offerIdByTitle('Đắc nhân tâm - bản phổ thông'))
            ->update(['status' => 'inactive']);
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

    private function containsTimestampKey(mixed $value): bool
    {
        if (! is_array($value)) {
            return false;
        }

        foreach ($value as $key => $nested) {
            if (is_string($key) && str_contains($key, 'observed_at')) {
                return true;
            }

            if ($this->containsTimestampKey($nested)) {
                return true;
            }
        }

        return false;
    }
}
