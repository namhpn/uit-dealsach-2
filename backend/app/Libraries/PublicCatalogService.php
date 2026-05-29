<?php

namespace App\Libraries;

use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Database\ConnectionInterface;
use CodeIgniter\I18n\Time;
use Config\Database;
use DateTimeImmutable;
use DateTimeZone;

class PublicCatalogService
{
    public const PRICE_DISCLAIMER = 'Giá tham khảo được ghi nhận gần đây, vui lòng kiểm tra lại tại nơi bán trước khi mua.';
    public const AFFILIATE_DISCLOSURE = 'DealSach chuyển bạn đến nơi bán bên ngoài qua liên kết tiếp thị liên kết đã được kiểm tra.';

    private const ACTIVE = 'active';
    private const AVAILABLE = 'available';
    private const UNAVAILABLE = 'unavailable';
    private const VALID_DESTINATION = 'valid';
    private const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';
    private const DISCOVERY_WINDOW_DAYS = 7;

    private BaseConnection $db;
    private DateTimeImmutable $now;

    /**
     * @param ConnectionInterface&BaseConnection|null $db
     */
    public function __construct(?ConnectionInterface $db = null, ?DateTimeImmutable $now = null)
    {
        $this->db = $db ?? Database::connect();
        $this->now = $now ?? new DateTimeImmutable(Time::now(self::VIETNAM_TIMEZONE)->toDateTimeString(), new DateTimeZone(self::VIETNAM_TIMEZONE));
    }

    /**
     * @param array<string, mixed> $query
     *
     * @return array{ok: bool, data?: array<string, mixed>, errors?: array<string, string>}
     */
    public function listBooks(array $query): array
    {
        $validation = $this->validateListQuery($query);
        if ($validation !== []) {
            return ['ok' => false, 'errors' => $validation];
        }

        $page = max(1, (int) ($query['page'] ?? 1));
        $perPage = (int) ($query['per_page'] ?? 12);
        $books = $this->bookCards();
        $cardsById = [];
        $priceDropsByBookId = [];

        foreach ($this->recentPriceDrops() as $drop) {
            $priceDropsByBookId[(int) $drop['book_id']] = [
                'amount' => (int) $drop['drop_amount'],
                'from_price' => (int) $drop['from_price'],
                'to_price' => (int) $drop['to_price'],
                'date' => (string) $drop['date'],
            ];
        }

        foreach ($books as $card) {
            $cardsById[$card['id']] = $card;
        }

        $filtered = $this->applyListFilters(array_values($cardsById), $query);
        $sorted = $this->sortCards($filtered, (string) ($query['sort'] ?? 'relevance'), trim((string) ($query['q'] ?? '')));
        $total = count($sorted);
        $items = array_map(function (array $card) use ($priceDropsByBookId): array {
            $drop = $priceDropsByBookId[(int) $card['id']] ?? null;
            if ($drop !== null) {
                $card['price_drop'] = $drop;
            }

            return $card;
        }, array_slice($sorted, ($page - 1) * $perPage, $perPage));

        return [
            'ok' => true,
            'data' => [
                'items' => array_values($items),
                'pagination' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'total_pages' => (int) ceil($total / $perPage),
                ],
                'sort' => $query['sort'] ?? 'relevance',
                'price_disclaimer' => self::PRICE_DISCLAIMER,
                'empty_state' => $total === 0 ? [
                    'message' => 'Không tìm thấy sách phù hợp. Hãy thử từ khóa ngắn hơn hoặc bỏ bớt bộ lọc.',
                ] : null,
            ],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function searchSuggestions(string $query, int $limit = 6): array
    {
        $normalizedQuery = trim($query);
        if ($normalizedQuery === '') {
            return [];
        }

        $boundedLimit = max(1, min($limit, 6));
        $cards = array_values($this->bookCards());
        $matches = array_values(array_filter($cards, fn (array $card): bool => $this->searchRank($card, $normalizedQuery) !== null));

        usort($matches, function (array $a, array $b) use ($normalizedQuery): int {
            $rank = ($this->searchRank($a, $normalizedQuery) ?? 99) <=> ($this->searchRank($b, $normalizedQuery) ?? 99);
            if ($rank !== 0) {
                return $rank;
            }

            return $this->compareCardsByTitleAndId($a, $b);
        });

        return array_map(static fn (array $card): array => [
            'book_id' => (int) $card['id'],
            'title' => (string) $card['title'],
            'author' => (string) $card['author'],
            'category' => (string) $card['category'],
            'lowest_eligible_price' => $card['lowest_eligible_price'] === null ? null : (int) $card['lowest_eligible_price'],
            'status' => [
                'value' => (string) $card['status']['value'],
                'label' => (string) $card['status']['label'],
            ],
        ], array_slice($matches, 0, $boundedLimit));
    }

    /**
     * @return array<string, mixed>|null
     */
    public function bookDetail(int $bookId): ?array
    {
        $book = $this->activeBookRows()[$bookId] ?? null;
        if ($book === null) {
            return null;
        }

        $card = $this->bookCards()[$bookId] ?? null;
        if ($card === null) {
            return null;
        }

        return [
            'book' => [
                'id' => (int) $book->id,
                'title' => $book->title,
                'author' => $book->author,
                'publisher' => $book->publisher,
                'category' => $book->category_name,
                'category_slug' => $book->category_slug,
                'isbn' => $book->isbn,
                'description' => $book->description,
                'cover_image' => $book->cover_image,
                'release_date' => $book->release_date,
                'page_count' => $book->page_count === null ? null : (int) $book->page_count,
                'dimensions' => $book->dimensions,
                'format' => $book->format,
                'is_featured' => (bool) $book->is_featured,
            ],
            'summary' => [
                'lowest_eligible_price' => $card['lowest_eligible_price'],
                'highest_eligible_price' => $card['highest_eligible_price'],
                'offer_count' => $card['offer_count'],
                'status' => $card['status'],
                'price_disclaimer' => self::PRICE_DISCLAIMER,
                'affiliate_disclosure' => self::AFFILIATE_DISCLOSURE,
            ],
            'offers' => $this->groupedOffersForBook($bookId),
            'price_history' => $this->priceHistoryForBook($bookId),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function discovery(): array
    {
        $cards = array_values($this->bookCards());
        $popularClickedDeals = $this->popularClickedDeals();
        $featured = array_values(array_filter($cards, static fn (array $card): bool => $card['is_featured']));
        usort($featured, $this->cardTitleSorter());

        $priceDrops = $this->recentPriceDrops();
        $window = [
            'label' => self::DISCOVERY_WINDOW_DAYS . ' ngày gần đây',
            'days' => self::DISCOVERY_WINDOW_DAYS,
            'timezone' => self::VIETNAM_TIMEZONE,
        ];
        $cardById = [];
        foreach ($cards as $card) {
            $cardById[$card['id']] = $card;
        }

        $dropCards = [];
        foreach ($priceDrops as $drop) {
            if (! isset($cardById[$drop['book_id']])) {
                continue;
            }

            $dropCards[] = $cardById[$drop['book_id']] + [
                'price_drop' => [
                    'amount' => $drop['drop_amount'],
                    'from_price' => $drop['from_price'],
                    'to_price' => $drop['to_price'],
                    'date' => $drop['date'],
                ],
            ];
        }

        return [
            'featured_books' => [
                'title' => 'Sách nổi bật',
                'subtitle' => 'Danh sách sách nổi bật được nhóm theo danh mục để bạn khám phá nhanh.',
                'cta_label' => 'Xem tất cả sách',
                'cta_href' => '/search',
                'items' => array_slice($featured, 0, 12),
                'empty_state' => count($featured) === 0 ? 'Chưa có sách nổi bật.' : null,
            ],
            'recent_price_drops' => [
                'title' => 'Sách giảm giá gần đây',
                'subtitle' => 'Mức giảm dựa trên quan sát giá đủ điều kiện trong cửa sổ thời gian gần đây.',
                'cta_label' => 'Mở trang tìm kiếm',
                'cta_href' => '/search',
                'window' => $window,
                'items' => $dropCards,
                'empty_state' => count($dropCards) === 0 ? 'Chưa có sách giảm giá đủ điều kiện trong 7 ngày gần đây.' : null,
            ],
            'popular_clicked_deals' => [
                'title' => 'Ưu đãi được quan tâm',
                'subtitle' => 'Xếp hạng theo lượt chuyển hướng Affiliate Redirect thành công trong cửa sổ thời gian gần đây.',
                'cta_label' => 'Khám phá thêm',
                'cta_href' => '/search',
                'window' => $window,
                'items' => $popularClickedDeals,
                'empty_state' => count($popularClickedDeals) === 0 ? 'Chưa có ưu đãi phổ biến trong 7 ngày gần đây.' : null,
            ],
            'price_disclaimer' => self::PRICE_DISCLAIMER,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function buyOfferEligibility(int $offerId): ?array
    {
        $offer = $this->offerRowForBuy($offerId);
        if ($offer === null) {
            return null;
        }

        $base = [
            'offer_id' => (int) $offer->id,
            'book_id' => (int) $offer->book_id,
            'retailer_platform_id' => (int) $offer->retailer_platform_id,
            'merchant_id' => (int) $offer->merchant_id,
            'destination' => is_string($offer->affiliate_destination_url) ? $offer->affiliate_destination_url : null,
        ];

        if ($offer->book_status !== self::ACTIVE || $offer->retailer_status !== self::ACTIVE || $offer->merchant_status !== self::ACTIVE || ! in_array($offer->status, [self::ACTIVE, self::UNAVAILABLE], true)) {
            return $base + ['eligible' => false, 'reason' => 'entity_inactive'];
        }

        if ((int) $offer->merchant_retailer_platform_id !== (int) $offer->retailer_platform_id) {
            return $base + ['eligible' => false, 'reason' => 'merchant_retailer_mismatch'];
        }

        $classification = $this->classifyOffer($offer);
        if ($classification === 'purchasable') {
            return $base + ['eligible' => true, 'reason' => null];
        }

        return $base + [
            'eligible' => false,
            'reason' => match ($classification) {
                'unavailable' => 'offer_unavailable',
                'stale_reference' => 'offer_stale',
                'missing_valid_seller_link' => $this->destinationFailureReason($offer),
                default => 'entity_inactive',
            },
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function filters(): array
    {
        $books = array_values($this->activeBookRows());
        $authors = [];
        $publishers = [];

        foreach ($books as $book) {
            $authors[$book->author] = $book->author;
            $publishers[$book->publisher] = $book->publisher;
        }

        natcasesort($authors);
        natcasesort($publishers);

        return [
            'categories' => array_values(array_map(static fn (object $category): array => [
                'id' => (int) $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'display_label' => $category->display_label === null ? null : (string) $category->display_label,
                'display_description' => $category->display_description === null ? null : (string) $category->display_description,
                'display_order' => (int) $category->display_order,
            ], $this->activeCategories())),
            'authors' => array_values($authors),
            'publishers' => array_values($publishers),
            'retailers' => $this->publicRelevantRetailers(),
            'availability' => [
                ['value' => 'all', 'label' => 'Tất cả sách đang hoạt động'],
                ['value' => 'available_now', 'label' => 'Có ưu đãi hiện tại'],
                ['value' => 'stale_reference', 'label' => 'Có giá tham khảo cũ'],
                ['value' => 'temporarily_unavailable', 'label' => 'Tạm hết hàng'],
                ['value' => 'missing_valid_seller_link', 'label' => 'Chưa có liên kết mua hợp lệ'],
                ['value' => 'no_tracked_offer', 'label' => 'Chưa có ưu đãi được theo dõi'],
            ],
            'sorts' => [
                ['value' => 'relevance', 'label' => 'Phù hợp nhất'],
                ['value' => 'title_asc', 'label' => 'Tên sách A-Z'],
                ['value' => 'price_asc', 'label' => 'Giá thấp đến cao'],
                ['value' => 'price_desc', 'label' => 'Giá cao đến thấp'],
                ['value' => 'newest', 'label' => 'Mới thêm gần đây'],
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function bookCards(): array
    {
        $cards = [];
        $offersByBook = $this->publicRelevantOffersByBook();

        foreach ($this->activeBookRows() as $bookId => $book) {
            $offers = $offersByBook[$bookId] ?? [];
            $eligiblePrices = [];
            $bucketFlags = [
                'missing_valid_seller_link' => false,
                'temporarily_unavailable' => false,
                'stale_reference' => false,
            ];

            foreach ($offers as $offer) {
                $classification = $this->classifyOffer($offer);
                if ($classification === 'purchasable') {
                    $eligiblePrices[] = (int) $offer->latest_price;
                } elseif ($classification === 'missing_valid_seller_link') {
                    $bucketFlags['missing_valid_seller_link'] = true;
                } elseif ($classification === 'unavailable') {
                    $bucketFlags['temporarily_unavailable'] = true;
                } elseif ($classification === 'stale_reference') {
                    $bucketFlags['stale_reference'] = true;
                }
            }

            $lowestPrice = $eligiblePrices === [] ? null : min($eligiblePrices);
            $highestPrice = $eligiblePrices === [] ? null : max($eligiblePrices);

            $cards[$bookId] = [
                'id' => (int) $book->id,
                'title' => $book->title,
                'author' => $book->author,
                'publisher' => $book->publisher,
                'category' => $book->category_name,
                'category_slug' => $book->category_slug,
                'isbn' => $book->isbn,
                'cover_image' => $book->cover_image,
                'is_featured' => (bool) $book->is_featured,
                'offer_count' => count($offers),
                'lowest_eligible_price' => $lowestPrice,
                'highest_eligible_price' => $highestPrice,
                'status' => $lowestPrice === null ? $this->bookNoPriceStatus($offers, $bucketFlags) : [
                    'value' => 'available_now',
                    'label' => 'Có ưu đãi hiện tại',
                ],
                'price_disclaimer' => self::PRICE_DISCLAIMER,
                '_created_at' => $book->created_at,
                '_search' => [
                    'title' => $this->normalizeSearch($book->title),
                    'author' => $this->normalizeSearch($book->author),
                    'publisher' => $this->normalizeSearch($book->publisher),
                    'category' => $this->normalizeSearch($book->category_name),
                    'isbn' => $this->normalizeIsbn((string) $book->isbn),
                ],
            ];
        }

        return $cards;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function activeBookSummary(int $bookId): ?array
    {
        $book = $this->activeBookRows()[$bookId] ?? null;
        if ($book === null) {
            return null;
        }

        return [
            'id' => (int) $book->id,
            'title' => $book->title,
            'author' => $book->author,
            'publisher' => $book->publisher,
            'category_name' => $book->category_name,
            'category_slug' => $book->category_slug,
            'cover_image' => $book->cover_image,
        ];
    }

    /**
     * @return array{price: int, offer_count: int}|null
     */
    public function currentLowestEligiblePriceSummary(int $bookId): ?array
    {
        $card = $this->bookCards()[$bookId] ?? null;
        if ($card === null || $card['lowest_eligible_price'] === null) {
            return null;
        }

        return [
            'price' => (int) $card['lowest_eligible_price'],
            'offer_count' => (int) $card['offer_count'],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function currentEligibleOffersForBook(int $bookId): array
    {
        $offers = [];

        foreach ($this->publicRelevantOffersByBook()[$bookId] ?? [] as $offer) {
            if ($this->classifyOffer($offer) !== 'purchasable') {
                continue;
            }

            $offers[] = [
                'offer_id' => (int) $offer->id,
                'price' => (int) $offer->latest_price,
                'retailer_name' => (string) $offer->retailer_name,
                'merchant_name' => (string) $offer->merchant_name,
                'observed_at' => (string) $offer->latest_observed_at,
            ];
        }

        usort($offers, static fn (array $a, array $b): int => [$a['price'], $a['offer_id']] <=> [$b['price'], $b['offer_id']]);

        return $offers;
    }

    public function lowestObservationTimeEligiblePrice(int $bookId): ?int
    {
        $history = $this->priceHistoryForBook($bookId);
        if ($history === []) {
            return null;
        }

        return min(array_map(static fn (array $row): int => (int) $row['lowest_price'], $history));
    }

    /**
     * @param array<string, mixed> $query
     *
     * @return array<string, string>
     */
    private function validateListQuery(array $query): array
    {
        $errors = [];
        $allowedKeys = ['q', 'category', 'author', 'publisher', 'retailer', 'availability', 'min_price', 'max_price', 'sort', 'page', 'per_page'];
        $allowedAvailability = ['all', 'available_now', 'stale_reference', 'temporarily_unavailable', 'missing_valid_seller_link', 'no_tracked_offer'];
        $allowedSort = ['relevance', 'title_asc', 'price_asc', 'price_desc', 'newest'];

        foreach (array_keys($query) as $key) {
            if (! in_array($key, $allowedKeys, true)) {
                $errors[$key] = 'Tham số không được hỗ trợ.';
            }
        }

        if (isset($query['availability']) && ! in_array($query['availability'], $allowedAvailability, true)) {
            $errors['availability'] = 'Bộ lọc tình trạng không hợp lệ.';
        }

        if (isset($query['sort']) && ! in_array($query['sort'], $allowedSort, true)) {
            $errors['sort'] = 'Cách sắp xếp không hợp lệ.';
        }

        foreach (['min_price', 'max_price'] as $priceKey) {
            if (isset($query[$priceKey]) && (! ctype_digit((string) $query[$priceKey]) || (int) $query[$priceKey] < 0)) {
                $errors[$priceKey] = 'Khoảng giá phải là số nguyên VND không âm.';
            }
        }

        if (isset($query['min_price'], $query['max_price']) && ctype_digit((string) $query['min_price']) && ctype_digit((string) $query['max_price']) && (int) $query['min_price'] > (int) $query['max_price']) {
            $errors['price_range'] = 'Giá tối thiểu không được lớn hơn giá tối đa.';
        }

        foreach (['page', 'per_page'] as $integerKey) {
            if (isset($query[$integerKey]) && (! ctype_digit((string) $query[$integerKey]) || (int) $query[$integerKey] < 1)) {
                $errors[$integerKey] = 'Giá trị phân trang phải là số nguyên dương.';
            }
        }

        if (isset($query['per_page']) && ctype_digit((string) $query['per_page']) && (int) $query['per_page'] > 60) {
            $errors['per_page'] = 'Mỗi trang chỉ được tối đa 60 sách.';
        }

        return $errors;
    }

    /**
     * @param list<array<string, mixed>> $cards
     * @param array<string, mixed>       $query
     *
     * @return list<array<string, mixed>>
     */
    private function applyListFilters(array $cards, array $query): array
    {
        $search = trim((string) ($query['q'] ?? ''));
        $category = trim((string) ($query['category'] ?? ''));
        $author = trim((string) ($query['author'] ?? ''));
        $publisher = trim((string) ($query['publisher'] ?? ''));
        $retailer = trim((string) ($query['retailer'] ?? ''));
        $availability = (string) ($query['availability'] ?? 'all');
        $minPrice = isset($query['min_price']) ? (int) $query['min_price'] : null;
        $maxPrice = isset($query['max_price']) ? (int) $query['max_price'] : null;

        return array_values(array_filter($cards, function (array $card) use ($search, $category, $author, $publisher, $retailer, $availability, $minPrice, $maxPrice): bool {
            if ($search !== '' && $this->searchRank($card, $search) === null) {
                return false;
            }

            if ($category !== '' && $this->normalizeSearch($category) !== $card['_search']['category'] && $category !== $card['category_slug']) {
                return false;
            }

            if ($author !== '' && $this->normalizeSearch($author) !== $card['_search']['author']) {
                return false;
            }

            if ($publisher !== '' && $this->normalizeSearch($publisher) !== $card['_search']['publisher']) {
                return false;
            }

            if ($retailer !== '' && ! $this->bookHasRetailer((int) $card['id'], $retailer)) {
                return false;
            }

            if ($availability !== 'all' && $card['status']['value'] !== $availability) {
                return false;
            }

            if ($minPrice !== null || $maxPrice !== null) {
                if ($card['lowest_eligible_price'] === null) {
                    return false;
                }

                if ($minPrice !== null && $card['lowest_eligible_price'] < $minPrice) {
                    return false;
                }

                if ($maxPrice !== null && $card['lowest_eligible_price'] > $maxPrice) {
                    return false;
                }
            }

            return true;
        }));
    }

    /**
     * @param list<array<string, mixed>> $cards
     *
     * @return list<array<string, mixed>>
     */
    private function sortCards(array $cards, string $sort, string $search): array
    {
        usort($cards, function (array $a, array $b) use ($sort, $search): int {
            if ($sort === 'price_asc' || $sort === 'price_desc') {
                $aPrice = $a['lowest_eligible_price'];
                $bPrice = $b['lowest_eligible_price'];

                if ($aPrice === null && $bPrice !== null) {
                    return 1;
                }
                if ($aPrice !== null && $bPrice === null) {
                    return -1;
                }
                if ($aPrice !== null && $bPrice !== null && $aPrice !== $bPrice) {
                    return $sort === 'price_asc' ? $aPrice <=> $bPrice : $bPrice <=> $aPrice;
                }
            } elseif ($sort === 'newest') {
                $created = strcmp((string) $b['_created_at'], (string) $a['_created_at']);
                if ($created !== 0) {
                    return $created;
                }
            } elseif ($sort === 'relevance' && $search !== '') {
                $rank = ($this->searchRank($a, $search) ?? 99) <=> ($this->searchRank($b, $search) ?? 99);
                if ($rank !== 0) {
                    return $rank;
                }
            } elseif ($sort === 'relevance' && $search === '') {
                $featured = (int) $b['is_featured'] <=> (int) $a['is_featured'];
                if ($featured !== 0) {
                    return $featured;
                }
            }

            return $this->compareCardsByTitleAndId($a, $b);
        });

        return array_map([$this, 'stripInternalCardKeys'], $cards);
    }

    private function searchRank(array $card, string $search): ?int
    {
        $normalized = $this->normalizeSearch($search);
        $isbn = $this->normalizeIsbn($search);

        if ($isbn !== '' && $isbn === $card['_search']['isbn']) {
            return 1;
        }
        if ($normalized === $card['_search']['title']) {
            return 2;
        }
        if (str_starts_with($card['_search']['title'], $normalized)) {
            return 3;
        }
        if (str_contains($card['_search']['title'], $normalized)) {
            return 4;
        }
        if (str_contains($card['_search']['author'], $normalized)) {
            return 5;
        }
        if (str_contains($card['_search']['publisher'], $normalized)) {
            return 6;
        }
        if (str_contains($card['_search']['category'], $normalized)) {
            return 7;
        }
        if ($isbn !== '' && str_contains($card['_search']['isbn'], $isbn)) {
            return 8;
        }

        return null;
    }

    /**
     * @return array<int, object>
     */
    private function activeBookRows(): array
    {
        $rows = $this->db->table('books b')
            ->select('b.*, c.name AS category_name, c.slug AS category_slug, c.status AS category_status')
            ->join('categories c', 'c.id = b.primary_category_id')
            ->where('b.status', self::ACTIVE)
            ->orderBy('b.title', 'ASC')
            ->orderBy('b.id', 'ASC')
            ->get()
            ->getResult();

        $mapped = [];
        foreach ($rows as $row) {
            $mapped[(int) $row->id] = $row;
        }

        return $mapped;
    }

    /**
     * @return list<object>
     */
    private function activeCategories(): array
    {
        return $this->db->table('categories')
            ->select('id, name, slug, display_label, display_description, display_order')
            ->where('status', self::ACTIVE)
            ->orderBy('display_order', 'ASC')
            ->orderBy('name', 'ASC')
            ->get()
            ->getResult();
    }

    /**
     * @return array<int, list<object>>
     */
    private function publicRelevantOffersByBook(): array
    {
        $offers = $this->publicRelevantOfferRows();
        $byBook = [];

        foreach ($offers as $offer) {
            $byBook[(int) $offer->book_id][] = $offer;
        }

        return $byBook;
    }

    /**
     * @return list<object>
     */
    private function publicRelevantOfferRows(): array
    {
        $latestSubquery = $this->latestObservationSubquery();
        $lastAvailableSubquery = $this->lastAvailableObservationSubquery();

        return $this->db->table('offers o')
            ->select('o.*, r.name AS retailer_name, r.slug AS retailer_slug, r.approved_domains, r.status AS retailer_status')
            ->select('m.name AS merchant_name, m.slug AS merchant_slug, m.retailer_platform_id AS merchant_retailer_platform_id, m.status AS merchant_status')
            ->select('lo.observed_at AS latest_observed_at, lo.availability_status AS latest_availability_status, lo.listed_item_price AS latest_price')
            ->select('la.listed_item_price AS last_available_price')
            ->join('retailer_platforms r', 'r.id = o.retailer_platform_id')
            ->join('merchants m', 'm.id = o.merchant_id')
            ->join("({$latestSubquery}) latest", 'latest.offer_id = o.id', 'left')
            ->join('price_observations lo', 'lo.id = latest.latest_observation_id', 'left')
            ->join("({$lastAvailableSubquery}) last_available", 'last_available.offer_id = o.id', 'left')
            ->join('price_observations la', 'la.id = last_available.last_available_observation_id', 'left')
            ->whereIn('o.status', [self::ACTIVE, self::UNAVAILABLE])
            ->where('r.status', self::ACTIVE)
            ->where('m.status', self::ACTIVE)
            ->where('m.retailer_platform_id = o.retailer_platform_id')
            ->orderBy('o.id', 'ASC')
            ->get()
            ->getResult();
    }

    private function latestObservationSubquery(): string
    {
        $table = $this->db->prefixTable('price_observations');

        return $this->db->table('price_observations po')
            ->select('po.offer_id, MAX(po.id) AS latest_observation_id')
            ->join("(SELECT offer_id, MAX(observed_at) AS latest_observed_at FROM {$table} GROUP BY offer_id) latest_time", 'latest_time.offer_id = po.offer_id AND latest_time.latest_observed_at = po.observed_at')
            ->groupBy('po.offer_id')
            ->getCompiledSelect();
    }

    private function lastAvailableObservationSubquery(): string
    {
        $table = $this->db->prefixTable('price_observations');

        return $this->db->table('price_observations po')
            ->select('po.offer_id, MAX(po.id) AS last_available_observation_id')
            ->join("(SELECT offer_id, MAX(observed_at) AS last_available_observed_at FROM {$table} WHERE availability_status = 'available' AND listed_item_price IS NOT NULL GROUP BY offer_id) last_available_time", 'last_available_time.offer_id = po.offer_id AND last_available_time.last_available_observed_at = po.observed_at')
            ->groupBy('po.offer_id')
            ->getCompiledSelect();
    }

    private function classifyOffer(object $offer): string
    {
        if ($offer->status === self::UNAVAILABLE || $offer->latest_availability_status === self::UNAVAILABLE) {
            return 'unavailable';
        }

        if ($offer->latest_observed_at === null || ! $this->isFresh((string) $offer->latest_observed_at)) {
            return 'stale_reference';
        }

        if ($offer->latest_availability_status !== self::AVAILABLE || $offer->latest_price === null || (int) $offer->latest_price <= 0) {
            return 'unavailable';
        }

        if (! $this->hasValidDestination($offer)) {
            return 'missing_valid_seller_link';
        }

        return 'purchasable';
    }

    private function isFresh(string $observedAt): bool
    {
        $observed = new DateTimeImmutable($observedAt, new DateTimeZone(self::VIETNAM_TIMEZONE));
        $freshCutoff = $this->now->modify('-48 hours');

        return $observed >= $freshCutoff && $observed <= $this->now->modify('+5 minutes');
    }

    private function hasValidDestination(object $offer): bool
    {
        if ($offer->destination_status !== self::VALID_DESTINATION || ! is_string($offer->affiliate_destination_url) || $offer->affiliate_destination_url === '') {
            return false;
        }

        $parts = parse_url($offer->affiliate_destination_url);
        if (($parts['scheme'] ?? '') !== 'https' || empty($parts['host'])) {
            return false;
        }

        $host = strtolower((string) $parts['host']);
        $domains = json_decode((string) $offer->approved_domains, true);
        if (! is_array($domains)) {
            return false;
        }

        foreach ($domains as $domain) {
            $domain = strtolower((string) $domain);
            if ($host === $domain || str_ends_with($host, '.' . $domain)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param array<string, bool> $bucketFlags
     *
     * @return array{value: string, label: string}
     */
    private function bookNoPriceStatus(array $offers, array $bucketFlags): array
    {
        if ($bucketFlags['missing_valid_seller_link']) {
            return ['value' => 'missing_valid_seller_link', 'label' => 'Chưa có liên kết mua hợp lệ'];
        }

        if ($bucketFlags['temporarily_unavailable']) {
            return ['value' => 'temporarily_unavailable', 'label' => 'Tạm hết hàng'];
        }

        if ($bucketFlags['stale_reference']) {
            return ['value' => 'stale_reference', 'label' => 'Giá tham khảo cũ'];
        }

        return ['value' => 'no_tracked_offer', 'label' => 'Chưa có ưu đãi'];
    }

    /**
     * @return array{purchasable: list<array<string, mixed>>, unavailable: list<array<string, mixed>>, stale_reference: list<array<string, mixed>>, missing_valid_seller_link: list<array<string, mixed>>}
     */
    private function groupedOffersForBook(int $bookId): array
    {
        $groups = [
            'purchasable' => [],
            'unavailable' => [],
            'stale_reference' => [],
            'missing_valid_seller_link' => [],
        ];

        foreach ($this->publicRelevantOffersByBook()[$bookId] ?? [] as $offer) {
            $classification = $this->classifyOffer($offer);
            $groups[$classification][] = $this->serializeOffer($offer, $classification);
        }

        return $groups;
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeOffer(object $offer, string $classification): array
    {
        $hasBuyAction = $classification === 'purchasable';

        return [
            'id' => (int) $offer->id,
            'title' => $offer->external_offer_title,
            'retailer' => [
                'id' => (int) $offer->retailer_platform_id,
                'name' => $offer->retailer_name,
                'slug' => $offer->retailer_slug,
            ],
            'merchant' => [
                'id' => (int) $offer->merchant_id,
                'name' => $offer->merchant_name,
                'slug' => $offer->merchant_slug,
            ],
            'latest_price' => $offer->latest_price === null ? null : (int) $offer->latest_price,
            'last_available_price' => $offer->last_available_price === null ? null : (int) $offer->last_available_price,
            'availability' => $classification,
            'status_label' => $this->offerStatusLabel($classification),
            'buy_action' => $hasBuyAction ? [
                'available' => true,
                'method' => 'affiliate_redirect',
                'offer_id' => (int) $offer->id,
                'url' => '/go/offers/' . (int) $offer->id,
                'label' => 'ĐẾN NƠI BÁN',
                'disclosure' => self::AFFILIATE_DISCLOSURE,
            ] : null,
            'price_disclaimer' => self::PRICE_DISCLAIMER,
        ];
    }

    private function offerStatusLabel(string $classification): string
    {
        return match ($classification) {
            'purchasable' => 'Có thể đến nơi bán',
            'unavailable' => 'Tạm hết hàng',
            'stale_reference' => 'Giá tham khảo cũ',
            'missing_valid_seller_link' => 'Chưa có liên kết mua hợp lệ',
            default => 'Chưa có ưu đãi',
        };
    }

    /**
     * @return list<array{date: string, lowest_price: int}>
     */
    private function priceHistoryForBook(int $bookId): array
    {
        $rows = $this->db->table('price_observations po')
            ->select('DATE(po.observed_at) AS observed_date, MIN(po.listed_item_price) AS lowest_price')
            ->join('offers o', 'o.id = po.offer_id')
            ->where('o.book_id', $bookId)
            ->where('po.availability_status', self::AVAILABLE)
            ->where('po.listed_item_price IS NOT NULL')
            ->where('po.book_status_at_observation', self::ACTIVE)
            ->where('po.offer_status_at_observation', self::ACTIVE)
            ->where('po.retailer_status_at_observation', self::ACTIVE)
            ->where('po.merchant_status_at_observation', self::ACTIVE)
            ->where('po.merchant_retailer_consistent_at_observation', 1)
            ->where('po.destination_status_at_observation', self::VALID_DESTINATION)
            ->groupBy('DATE(po.observed_at)')
            ->orderBy('observed_date', 'ASC')
            ->get()
            ->getResult();

        return array_map(static fn (object $row): array => [
            'date' => $row->observed_date,
            'lowest_price' => (int) $row->lowest_price,
        ], $rows);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function recentPriceDrops(): array
    {
        $rows = $this->db->table('price_observations po')
            ->select('o.book_id, oc.cycle_date, MIN(po.listed_item_price) AS lowest_price')
            ->join('offers o', 'o.id = po.offer_id')
            ->join('books b', 'b.id = o.book_id')
            ->join('observation_cycles oc', 'oc.id = po.observation_cycle_id')
            ->where('b.status', self::ACTIVE)
            ->where('po.availability_status', self::AVAILABLE)
            ->where('po.listed_item_price IS NOT NULL')
            ->where('po.book_status_at_observation', self::ACTIVE)
            ->where('po.offer_status_at_observation', self::ACTIVE)
            ->where('po.retailer_status_at_observation', self::ACTIVE)
            ->where('po.merchant_status_at_observation', self::ACTIVE)
            ->where('po.merchant_retailer_consistent_at_observation', 1)
            ->where('po.destination_status_at_observation', self::VALID_DESTINATION)
            ->groupBy('o.book_id, oc.cycle_date')
            ->orderBy('o.book_id', 'ASC')
            ->orderBy('oc.cycle_date', 'ASC')
            ->get()
            ->getResult();

        $byBook = [];
        foreach ($rows as $row) {
            $byBook[(int) $row->book_id][] = [
                'date' => $row->cycle_date,
                'price' => (int) $row->lowest_price,
            ];
        }

        $windowStart = $this->now->modify('-' . self::DISCOVERY_WINDOW_DAYS . ' days')->format('Y-m-d');
        $drops = [];
        $books = $this->activeBookRows();

        foreach ($byBook as $bookId => $cycles) {
            $bestDrop = null;
            $previousEligible = null;

            foreach ($cycles as $cycle) {
                if ($previousEligible !== null && $cycle['date'] >= $windowStart && $cycle['price'] < $previousEligible['price']) {
                    $drop = [
                        'book_id' => $bookId,
                        'date' => $cycle['date'],
                        'from_price' => $previousEligible['price'],
                        'to_price' => $cycle['price'],
                        'drop_amount' => $previousEligible['price'] - $cycle['price'],
                        'title' => $books[$bookId]->title ?? '',
                    ];

                    if ($bestDrop === null || $drop['drop_amount'] > $bestDrop['drop_amount'] || ($drop['drop_amount'] === $bestDrop['drop_amount'] && $drop['date'] > $bestDrop['date'])) {
                        $bestDrop = $drop;
                    }
                }

                $previousEligible = $cycle;
            }

            if ($bestDrop !== null) {
                $drops[] = $bestDrop;
            }
        }

        usort($drops, static function (array $a, array $b): int {
            $amount = $b['drop_amount'] <=> $a['drop_amount'];
            if ($amount !== 0) {
                return $amount;
            }

            $date = strcmp($b['date'], $a['date']);
            if ($date !== 0) {
                return $date;
            }

            return strnatcasecmp($a['title'], $b['title']);
        });

        return array_slice($drops, 0, 12);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function popularClickedDeals(): array
    {
        $windowStart = $this->now->modify('-' . self::DISCOVERY_WINDOW_DAYS . ' days')->format('Y-m-d H:i:s');
        $rows = $this->db->table('affiliate_redirects ar')
            ->select('ar.book_id, ar.retailer_platform_id, b.title AS book_title, r.name AS retailer_name')
            ->join('books b', 'b.id = ar.book_id')
            ->join('retailer_platforms r', 'r.id = ar.retailer_platform_id')
            ->where('ar.event_at >=', $windowStart)
            ->where('ar.event_type', 'affiliate_redirect')
            ->where('ar.redirect_status', 'redirected')
            ->get()
            ->getResult();

        $cards = $this->bookCards();
        $counts = [];
        foreach ($rows as $row) {
            $bookId = (int) $row->book_id;
            if (! isset($cards[$bookId])) {
                continue;
            }

            $retailerId = (int) $row->retailer_platform_id;
            $counts[$bookId]['total'] = ($counts[$bookId]['total'] ?? 0) + 1;
            $counts[$bookId]['title'] = $row->book_title;
            $counts[$bookId]['retailers'][$retailerId]['name'] = $row->retailer_name;
            $counts[$bookId]['retailers'][$retailerId]['count'] = ($counts[$bookId]['retailers'][$retailerId]['count'] ?? 0) + 1;
        }

        $items = [];
        foreach ($counts as $bookId => $count) {
            $topRetailer = null;
            foreach ($count['retailers'] as $retailer) {
                if ($topRetailer === null || $retailer['count'] > $topRetailer['count'] || ($retailer['count'] === $topRetailer['count'] && strnatcasecmp($retailer['name'], $topRetailer['name']) < 0)) {
                    $topRetailer = $retailer;
                }
            }

            $items[] = $cards[$bookId] + [
                'popular_clicked_deal' => [
                    'redirect_count_7d' => $count['total'],
                    'top_retailer' => $topRetailer === null ? null : [
                        'name' => $topRetailer['name'],
                        'redirect_count_7d' => $topRetailer['count'],
                    ],
                ],
            ];
        }

        usort($items, static function (array $a, array $b): int {
            $count = $b['popular_clicked_deal']['redirect_count_7d'] <=> $a['popular_clicked_deal']['redirect_count_7d'];
            if ($count !== 0) {
                return $count;
            }

            return strnatcasecmp($a['title'], $b['title']);
        });

        return array_slice($items, 0, 12);
    }

    /**
     * @return list<array{id: int, name: string, slug: string}>
     */
    private function publicRelevantRetailers(): array
    {
        $rows = $this->db->table('retailer_platforms r')
            ->distinct()
            ->select('r.id, r.name, r.slug')
            ->join('offers o', 'o.retailer_platform_id = r.id')
            ->join('merchants m', 'm.id = o.merchant_id')
            ->join('books b', 'b.id = o.book_id')
            ->where('r.status', self::ACTIVE)
            ->where('m.status', self::ACTIVE)
            ->where('b.status', self::ACTIVE)
            ->whereIn('o.status', [self::ACTIVE, self::UNAVAILABLE])
            ->orderBy('r.name', 'ASC')
            ->get()
            ->getResult();

        return array_map(static fn (object $row): array => [
            'id' => (int) $row->id,
            'name' => $row->name,
            'slug' => $row->slug,
        ], $rows);
    }

    private function bookHasRetailer(int $bookId, string $retailer): bool
    {
        $normalized = $this->normalizeSearch($retailer);

        foreach ($this->publicRelevantOffersByBook()[$bookId] ?? [] as $offer) {
            if ($offer->retailer_slug === $retailer || $this->normalizeSearch($offer->retailer_name) === $normalized) {
                return true;
            }
        }

        return false;
    }

    private function offerRowForBuy(int $offerId): ?object
    {
        $latestSubquery = $this->latestObservationSubquery();

        return $this->db->table('offers o')
            ->select('o.*, b.status AS book_status, r.name AS retailer_name, r.slug AS retailer_slug, r.approved_domains, r.status AS retailer_status')
            ->select('m.name AS merchant_name, m.slug AS merchant_slug, m.retailer_platform_id AS merchant_retailer_platform_id, m.status AS merchant_status')
            ->select('lo.observed_at AS latest_observed_at, lo.availability_status AS latest_availability_status, lo.listed_item_price AS latest_price')
            ->join('books b', 'b.id = o.book_id')
            ->join('retailer_platforms r', 'r.id = o.retailer_platform_id')
            ->join('merchants m', 'm.id = o.merchant_id')
            ->join("({$latestSubquery}) latest", 'latest.offer_id = o.id', 'left')
            ->join('price_observations lo', 'lo.id = latest.latest_observation_id', 'left')
            ->where('o.id', $offerId)
            ->get()
            ->getFirstRow();
    }

    private function destinationFailureReason(object $offer): string
    {
        if ($offer->destination_status === 'missing' || ! is_string($offer->affiliate_destination_url) || $offer->affiliate_destination_url === '') {
            return 'destination_missing';
        }

        if ($offer->destination_status === 'invalid') {
            return 'destination_invalid';
        }

        return 'destination_unsafe';
    }

    /**
     * @return array<string, mixed>
     */
    private function stripInternalCardKeys(array $card): array
    {
        unset($card['_created_at'], $card['_search']);

        return $card;
    }

    private function compareCardsByTitleAndId(array $a, array $b): int
    {
        $title = strnatcasecmp($a['title'], $b['title']);
        if ($title !== 0) {
            return $title;
        }

        return $a['id'] <=> $b['id'];
    }

    private function cardTitleSorter(): callable
    {
        return fn (array $a, array $b): int => $this->compareCardsByTitleAndId($a, $b);
    }

    private function normalizeIsbn(string $value): string
    {
        return preg_replace('/[^0-9Xx]/', '', $value) ?? '';
    }

    private function normalizeSearch(string $value): string
    {
        $value = mb_strtolower(trim($value), 'UTF-8');
        $value = strtr($value, [
            'à' => 'a', 'á' => 'a', 'ạ' => 'a', 'ả' => 'a', 'ã' => 'a',
            'â' => 'a', 'ầ' => 'a', 'ấ' => 'a', 'ậ' => 'a', 'ẩ' => 'a', 'ẫ' => 'a',
            'ă' => 'a', 'ằ' => 'a', 'ắ' => 'a', 'ặ' => 'a', 'ẳ' => 'a', 'ẵ' => 'a',
            'è' => 'e', 'é' => 'e', 'ẹ' => 'e', 'ẻ' => 'e', 'ẽ' => 'e',
            'ê' => 'e', 'ề' => 'e', 'ế' => 'e', 'ệ' => 'e', 'ể' => 'e', 'ễ' => 'e',
            'ì' => 'i', 'í' => 'i', 'ị' => 'i', 'ỉ' => 'i', 'ĩ' => 'i',
            'ò' => 'o', 'ó' => 'o', 'ọ' => 'o', 'ỏ' => 'o', 'õ' => 'o',
            'ô' => 'o', 'ồ' => 'o', 'ố' => 'o', 'ộ' => 'o', 'ổ' => 'o', 'ỗ' => 'o',
            'ơ' => 'o', 'ờ' => 'o', 'ớ' => 'o', 'ợ' => 'o', 'ở' => 'o', 'ỡ' => 'o',
            'ù' => 'u', 'ú' => 'u', 'ụ' => 'u', 'ủ' => 'u', 'ũ' => 'u',
            'ư' => 'u', 'ừ' => 'u', 'ứ' => 'u', 'ự' => 'u', 'ử' => 'u', 'ữ' => 'u',
            'ỳ' => 'y', 'ý' => 'y', 'ỵ' => 'y', 'ỷ' => 'y', 'ỹ' => 'y',
            'đ' => 'd',
        ]);

        $value = preg_replace('/[^a-z0-9]+/', ' ', $value) ?? '';

        return trim(preg_replace('/\s+/', ' ', $value) ?? '');
    }
}
