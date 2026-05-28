<?php

namespace App\Libraries;

use App\Models\BookModel;
use App\Models\CategoryModel;
use App\Models\MerchantModel;
use App\Models\ObservationCycleModel;
use App\Models\OfferModel;
use App\Models\PriceAlertEventModel;
use App\Models\PriceAlertModel;
use App\Models\PriceObservationModel;
use App\Models\RetailerPlatformModel;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Database\ConnectionInterface;
use CodeIgniter\I18n\Time;
use Config\Database;
use DateTimeImmutable;
use DateTimeZone;

class AdminCatalogService
{
    private const TZ = 'Asia/Ho_Chi_Minh';
    private const LIFECYCLE = ['active', 'archived'];
    private const OFFER_STATUSES = ['pending_review', 'active', 'unavailable', 'inactive', 'removed_invalid'];

    private BaseConnection $db;
    private AdminAuditService $audit;
    private CategoryModel $categories;
    private BookModel $books;
    private RetailerPlatformModel $retailers;
    private MerchantModel $merchants;
    private OfferModel $offers;
    private ObservationCycleModel $cycles;
    private PriceObservationModel $observations;
    private PriceAlertModel $alerts;
    private PriceAlertEventModel $alertEvents;
    private DateTimeImmutable $now;

    public function __construct(?ConnectionInterface $db = null, ?DateTimeImmutable $now = null)
    {
        $this->db = $db ?? Database::connect();
        $this->audit = new AdminAuditService($now);
        $this->categories = new CategoryModel();
        $this->books = new BookModel();
        $this->retailers = new RetailerPlatformModel();
        $this->merchants = new MerchantModel();
        $this->offers = new OfferModel();
        $this->cycles = new ObservationCycleModel();
        $this->observations = new PriceObservationModel();
        $this->alerts = new PriceAlertModel();
        $this->alertEvents = new PriceAlertEventModel();
        $this->now = $now ?? new DateTimeImmutable(Time::now(self::TZ)->toDateTimeString(), new DateTimeZone(self::TZ));
    }

    public function listCategories(array $filters): array
    {
        $builder = $this->db->table('categories')->select('*');
        $this->applySearch($builder, $filters, ['name', 'slug']);
        $this->applyStatus($builder, $filters, self::LIFECYCLE);

        return ['items' => array_map([$this, 'categoryRow'], $builder->orderBy('display_order', 'ASC')->orderBy('name', 'ASC')->get()->getResult())];
    }

    public function createCategory(object $actor, array $body): array
    {
        $data = $this->categoryPayload($body);
        $errors = $this->validateCategory($data);
        if ($errors !== []) {
            return $this->error(422, 'Dữ liệu danh mục chưa hợp lệ.', $errors);
        }
        if ($this->exists('categories', 'slug', $data['slug'])) {
            return $this->error(422, 'Dữ liệu danh mục chưa hợp lệ.', ['slug' => 'Slug danh mục đã tồn tại.']);
        }

        $id = (int) $this->categories->insert($data);
        $after = $this->categories->find($id);
        $this->audit->record($actor, 'category_created', 'category', $id, 'Tạo danh mục.', null, $this->snapshot($after));

        return $this->success(201, 'Đã tạo danh mục.', $this->categoryDetail($id));
    }

    public function updateCategory(object $actor, int $id, array $body): array
    {
        $category = $this->categories->find($id);
        if ($category === null) {
            return $this->notFound('Không tìm thấy danh mục.', 'category');
        }
        $data = $this->categoryPayload($body, $category);
        $errors = $this->validateCategory($data);
        if ($errors !== []) {
            return $this->error(422, 'Dữ liệu danh mục chưa hợp lệ.', $errors);
        }
        if ($this->exists('categories', 'slug', $data['slug'], $id)) {
            return $this->error(422, 'Dữ liệu danh mục chưa hợp lệ.', ['slug' => 'Slug danh mục đã tồn tại.']);
        }

        $before = $this->snapshot($category);
        $this->categories->update($id, $data);
        $after = $this->categories->find($id);
        $this->audit->record($actor, 'category_updated', 'category', $id, 'Cập nhật danh mục.', $before, $this->snapshot($after));

        return $this->success(200, 'Đã cập nhật danh mục.', $this->categoryDetail($id));
    }

    public function setCategoryStatus(object $actor, int $id, string $status): array
    {
        return $this->setStatus($actor, $this->categories, 'category', $id, $status, 'category_' . ($status === 'archived' ? 'archived' : 'restored'), 'Cập nhật trạng thái danh mục.');
    }

    public function categoryDetail(int $id): ?array
    {
        $row = $this->categories->find($id);

        return $row === null ? null : $this->categoryRow($row) + [
            'book_count' => $this->countRows('books', ['primary_category_id' => $id]),
        ];
    }

    public function listBooks(array $filters): array
    {
        $builder = $this->db->table('books b')
            ->select('b.*, c.name AS category_name, c.slug AS category_slug, c.status AS category_status')
            ->join('categories c', 'c.id = b.primary_category_id');
        $this->applySearch($builder, $filters, ['b.title', 'b.author', 'b.isbn']);
        $this->applyStatus($builder, $filters, self::LIFECYCLE, 'b.status');
        if (isset($filters['category_id']) && ctype_digit((string) $filters['category_id'])) {
            $builder->where('b.primary_category_id', (int) $filters['category_id']);
        }
        if (isset($filters['featured']) && in_array((string) $filters['featured'], ['0', '1'], true)) {
            $builder->where('b.is_featured', (int) $filters['featured']);
        }

        return ['items' => array_map([$this, 'bookRow'], $builder->orderBy('b.title')->get()->getResult())];
    }

    public function createBook(object $actor, array $body): array
    {
        $data = $this->bookPayload($body);
        $errors = $this->validateBook($data);
        if ($errors !== []) {
            return $this->error(422, 'Dữ liệu sách chưa hợp lệ.', $errors);
        }
        $id = (int) $this->books->insert($data);
        $this->audit->record($actor, 'book_created', 'book', $id, 'Tạo sách.', null, $this->snapshot($this->books->find($id)));

        return $this->success(201, 'Đã tạo sách.', $this->bookDetail($id));
    }

    public function updateBook(object $actor, int $id, array $body): array
    {
        $book = $this->books->find($id);
        if ($book === null) {
            return $this->notFound('Không tìm thấy sách.', 'book');
        }
        $data = $this->bookPayload($body, $book);
        $errors = $this->validateBook($data);
        if ($errors !== []) {
            return $this->error(422, 'Dữ liệu sách chưa hợp lệ.', $errors);
        }
        $before = $this->snapshot($book);
        $this->books->update($id, $data);
        $this->audit->record($actor, 'book_updated', 'book', $id, 'Cập nhật sách.', $before, $this->snapshot($this->books->find($id)));

        return $this->success(200, 'Đã cập nhật sách.', $this->bookDetail($id));
    }

    public function archiveBook(object $actor, int $id): array
    {
        $book = $this->books->find($id);
        if ($book === null) {
            return $this->notFound('Không tìm thấy sách.', 'book');
        }
        if ($book->status === 'archived') {
            return $this->success(200, 'Sách đã được lưu trữ.', $this->bookDetail($id));
        }

        $before = $this->snapshot($book);
        $this->db->transStart();
        $this->books->update($id, ['status' => 'archived']);
        $this->pauseActiveAlertsForBook($actor, $id);
        $this->audit->record($actor, 'book_archived', 'book', $id, 'Lưu trữ sách và tạm dừng cảnh báo Active.', $before, $this->snapshot($this->books->find($id)));
        $this->db->transComplete();

        return $this->success(200, 'Đã lưu trữ sách.', $this->bookDetail($id));
    }

    public function restoreBook(object $actor, int $id): array
    {
        return $this->setStatus($actor, $this->books, 'book', $id, 'active', 'book_restored', 'Khôi phục sách, không tự bật lại cảnh báo đã tạm dừng.');
    }

    public function bookDetail(int $id): ?array
    {
        $row = $this->db->table('books b')
            ->select('b.*, c.name AS category_name, c.slug AS category_slug, c.status AS category_status')
            ->join('categories c', 'c.id = b.primary_category_id')
            ->where('b.id', $id)
            ->get()
            ->getFirstRow();

        return $row === null ? null : $this->bookRow($row) + [
            'offer_count' => $this->countRows('offers', ['book_id' => $id]),
            'active_alert_count' => $this->countRows('price_alerts', ['book_id' => $id, 'status' => 'Active']),
            'wishlist_count' => $this->countRows('wishlist_items', ['book_id' => $id]),
        ];
    }

    public function listRetailers(array $filters): array
    {
        $builder = $this->db->table('retailer_platforms')->select('*');
        $this->applySearch($builder, $filters, ['name', 'slug']);
        $this->applyStatus($builder, $filters, self::LIFECYCLE);

        return ['items' => array_map([$this, 'retailerRow'], $builder->orderBy('name')->get()->getResult())];
    }

    public function createRetailer(object $actor, array $body): array
    {
        $data = $this->retailerPayload($body);
        $errors = $this->validateRetailer($data);
        if ($errors !== []) {
            return $this->error(422, 'Dữ liệu nền tảng bán lẻ chưa hợp lệ.', $errors);
        }
        if ($this->exists('retailer_platforms', 'slug', $data['slug'])) {
            return $this->error(422, 'Dữ liệu nền tảng bán lẻ chưa hợp lệ.', ['slug' => 'Slug nền tảng đã tồn tại.']);
        }
        $id = (int) $this->retailers->insert($data);
        $this->audit->record($actor, 'retailer_created', 'retailer_platform', $id, 'Tạo nền tảng bán lẻ.', null, $this->snapshot($this->retailers->find($id)));

        return $this->success(201, 'Đã tạo nền tảng bán lẻ.', $this->retailerDetail($id));
    }

    public function updateRetailer(object $actor, int $id, array $body): array
    {
        $retailer = $this->retailers->find($id);
        if ($retailer === null) {
            return $this->notFound('Không tìm thấy nền tảng bán lẻ.', 'retailer');
        }
        $data = $this->retailerPayload($body, $retailer);
        $errors = $this->validateRetailer($data);
        if ($errors !== []) {
            return $this->error(422, 'Dữ liệu nền tảng bán lẻ chưa hợp lệ.', $errors);
        }
        if ($this->exists('retailer_platforms', 'slug', $data['slug'], $id)) {
            return $this->error(422, 'Dữ liệu nền tảng bán lẻ chưa hợp lệ.', ['slug' => 'Slug nền tảng đã tồn tại.']);
        }
        $before = $this->snapshot($retailer);
        $this->retailers->update($id, $data);
        $this->audit->record($actor, 'retailer_updated', 'retailer_platform', $id, 'Cập nhật nền tảng bán lẻ.', $before, $this->snapshot($this->retailers->find($id)));

        return $this->success(200, 'Đã cập nhật nền tảng bán lẻ.', $this->retailerDetail($id));
    }

    public function setRetailerStatus(object $actor, int $id, string $status): array
    {
        return $this->setStatus($actor, $this->retailers, 'retailer_platform', $id, $status, 'retailer_' . ($status === 'archived' ? 'archived' : 'restored'), 'Cập nhật trạng thái nền tảng bán lẻ.');
    }

    public function retailerDetail(int $id): ?array
    {
        $row = $this->retailers->find($id);

        return $row === null ? null : $this->retailerRow($row) + [
            'merchant_count' => $this->countRows('merchants', ['retailer_platform_id' => $id]),
            'offer_count' => $this->countRows('offers', ['retailer_platform_id' => $id]),
        ];
    }

    public function listMerchants(array $filters): array
    {
        $builder = $this->db->table('merchants m')
            ->select('m.*, r.name AS retailer_name, r.slug AS retailer_slug, r.status AS retailer_status')
            ->join('retailer_platforms r', 'r.id = m.retailer_platform_id');
        $this->applySearch($builder, $filters, ['m.name', 'm.slug', 'r.name']);
        $this->applyStatus($builder, $filters, self::LIFECYCLE, 'm.status');
        if (isset($filters['retailer_platform_id']) && ctype_digit((string) $filters['retailer_platform_id'])) {
            $builder->where('m.retailer_platform_id', (int) $filters['retailer_platform_id']);
        }

        return ['items' => array_map([$this, 'merchantRow'], $builder->orderBy('m.name')->get()->getResult())];
    }

    public function createMerchant(object $actor, array $body): array
    {
        $data = $this->merchantPayload($body);
        $errors = $this->validateMerchant($data);
        if ($errors !== []) {
            return $this->error(422, 'Dữ liệu nhà bán chưa hợp lệ.', $errors);
        }
        $id = (int) $this->merchants->insert($data);
        $this->audit->record($actor, 'merchant_created', 'merchant', $id, 'Tạo nhà bán.', null, $this->snapshot($this->merchants->find($id)));

        return $this->success(201, 'Đã tạo nhà bán.', $this->merchantDetail($id));
    }

    public function updateMerchant(object $actor, int $id, array $body): array
    {
        $merchant = $this->merchants->find($id);
        if ($merchant === null) {
            return $this->notFound('Không tìm thấy nhà bán.', 'merchant');
        }
        $data = $this->merchantPayload($body, $merchant);
        $errors = $this->validateMerchant($data);
        if ($errors !== []) {
            return $this->error(422, 'Dữ liệu nhà bán chưa hợp lệ.', $errors);
        }
        $before = $this->snapshot($merchant);
        $this->merchants->update($id, $data);
        $this->audit->record($actor, 'merchant_updated', 'merchant', $id, 'Cập nhật nhà bán.', $before, $this->snapshot($this->merchants->find($id)));

        return $this->success(200, 'Đã cập nhật nhà bán.', $this->merchantDetail($id));
    }

    public function setMerchantStatus(object $actor, int $id, string $status): array
    {
        return $this->setStatus($actor, $this->merchants, 'merchant', $id, $status, 'merchant_' . ($status === 'archived' ? 'archived' : 'restored'), 'Cập nhật trạng thái nhà bán.');
    }

    public function merchantDetail(int $id): ?array
    {
        $row = $this->db->table('merchants m')
            ->select('m.*, r.name AS retailer_name, r.slug AS retailer_slug, r.status AS retailer_status')
            ->join('retailer_platforms r', 'r.id = m.retailer_platform_id')
            ->where('m.id', $id)
            ->get()
            ->getFirstRow();

        return $row === null ? null : $this->merchantRow($row) + ['offer_count' => $this->countRows('offers', ['merchant_id' => $id])];
    }

    public function listOffers(array $filters): array
    {
        $builder = $this->offerBuilder();
        $this->applySearch($builder, $filters, ['o.external_offer_title', 'b.title', 'r.name', 'm.name']);
        $this->applyStatus($builder, $filters, self::OFFER_STATUSES, 'o.status');
        foreach (['book_id' => 'o.book_id', 'retailer_platform_id' => 'o.retailer_platform_id', 'merchant_id' => 'o.merchant_id'] as $key => $column) {
            if (isset($filters[$key]) && ctype_digit((string) $filters[$key])) {
                $builder->where($column, (int) $filters[$key]);
            }
        }

        return ['items' => array_map([$this, 'offerRow'], $builder->orderBy('o.id', 'DESC')->get()->getResult())];
    }

    public function createOffer(object $actor, array $body): array
    {
        $data = $this->offerPayload($body);
        $errors = $this->validateOffer($data);
        if ($errors !== []) {
            return $this->error(422, 'Dữ liệu ưu đãi chưa hợp lệ.', $errors);
        }
        $id = (int) $this->offers->insert($data);
        $this->audit->record($actor, 'offer_created', 'offer', $id, 'Tạo ưu đãi.', null, $this->snapshot($this->offers->find($id)));

        return $this->success(201, 'Đã tạo ưu đãi.', $this->offerDetail($id));
    }

    public function updateOffer(object $actor, int $id, array $body): array
    {
        $offer = $this->offers->find($id);
        if ($offer === null) {
            return $this->notFound('Không tìm thấy ưu đãi.', 'offer');
        }
        $data = $this->offerPayload($body, $offer);
        $errors = $this->validateOffer($data);
        if ($errors !== []) {
            return $this->error(422, 'Dữ liệu ưu đãi chưa hợp lệ.', $errors);
        }
        $before = $this->snapshot($offer);
        $this->offers->update($id, $data);
        $this->audit->record($actor, 'offer_updated', 'offer', $id, 'Cập nhật ưu đãi.', $before, $this->snapshot($this->offers->find($id)));

        return $this->success(200, 'Đã cập nhật ưu đãi.', $this->offerDetail($id));
    }

    public function offerDetail(int $id): ?array
    {
        $row = $this->offerBuilder()->where('o.id', $id)->get()->getFirstRow();

        return $row === null ? null : $this->offerRow($row) + [
            'observations' => $this->offerObservations($id),
        ];
    }

    public function offerObservations(int $offerId): array
    {
        $rows = $this->db->table('price_observations po')
            ->select('po.*, oc.cycle_date, oc.notes AS cycle_notes')
            ->join('observation_cycles oc', 'oc.id = po.observation_cycle_id')
            ->where('po.offer_id', $offerId)
            ->orderBy('po.observed_at', 'DESC')
            ->orderBy('po.id', 'DESC')
            ->get()
            ->getResult();

        return array_map(static fn (object $row): array => [
            'id' => (int) $row->id,
            'offer_id' => (int) $row->offer_id,
            'observation_cycle_id' => (int) $row->observation_cycle_id,
            'cycle_date' => (string) $row->cycle_date,
            'observed_at' => (string) $row->observed_at,
            'availability_status' => (string) $row->availability_status,
            'listed_item_price' => $row->listed_item_price === null ? null : (int) $row->listed_item_price,
            'book_status_at_observation' => (string) $row->book_status_at_observation,
            'offer_status_at_observation' => (string) $row->offer_status_at_observation,
            'retailer_status_at_observation' => (string) $row->retailer_status_at_observation,
            'merchant_status_at_observation' => (string) $row->merchant_status_at_observation,
            'merchant_retailer_consistent_at_observation' => (bool) $row->merchant_retailer_consistent_at_observation,
            'destination_status_at_observation' => (string) $row->destination_status_at_observation,
        ], $rows);
    }

    public function addObservation(object $actor, int $offerId, array $body): array
    {
        $row = $this->offerBuilder()->where('o.id', $offerId)->get()->getFirstRow();
        if ($row === null) {
            return $this->notFound('Không tìm thấy ưu đãi.', 'offer');
        }
        $availability = (string) ($body['availability_status'] ?? '');
        $price = array_key_exists('listed_item_price', $body) && $body['listed_item_price'] !== '' ? (int) $body['listed_item_price'] : null;
        $cycleDate = (string) ($body['cycle_date'] ?? $this->now->format('Y-m-d'));
        $observedAt = (string) ($body['observed_at'] ?? ($cycleDate . ' ' . $this->now->format('H:i:s')));
        $errors = [];
        if (! in_array($availability, ['available', 'unavailable'], true)) {
            $errors['availability_status'] = 'Tình trạng quan sát phải là available hoặc unavailable.';
        }
        if ($availability === 'available' && ($price === null || $price <= 0)) {
            $errors['listed_item_price'] = 'Giá niêm yết phải là số VND nguyên dương khi còn hàng.';
        }
        if ($availability === 'unavailable' && $price !== null) {
            $errors['listed_item_price'] = 'Quan sát hết hàng không lưu giá niêm yết.';
        }
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $cycleDate)) {
            $errors['cycle_date'] = 'Ngày chu kỳ phải có dạng YYYY-MM-DD.';
        }
        if ($errors !== []) {
            return $this->error(422, 'Dữ liệu quan sát giá chưa hợp lệ.', $errors);
        }

        $this->db->transStart();
        $cycleId = $this->cycleId($cycleDate, (string) ($body['cycle_notes'] ?? 'Chu kỳ quan sát mock do Admin thêm.'));
        $data = [
            'offer_id' => $offerId,
            'observation_cycle_id' => $cycleId,
            'observed_at' => $observedAt,
            'availability_status' => $availability,
            'listed_item_price' => $price,
            'book_status_at_observation' => (string) $row->book_status,
            'offer_status_at_observation' => (string) $row->status,
            'retailer_status_at_observation' => (string) $row->retailer_status,
            'merchant_status_at_observation' => (string) $row->merchant_status,
            'merchant_retailer_consistent_at_observation' => (int) ((int) $row->merchant_retailer_platform_id === (int) $row->retailer_platform_id),
            'destination_status_at_observation' => (string) $row->destination_status,
        ];
        $id = (int) $this->observations->insert($data);
        $this->audit->record($actor, 'price_observation_created', 'price_observation', $id, 'Thêm quan sát giá mock cho ưu đãi.', null, $data);
        $this->db->transComplete();

        return $this->success(201, 'Đã thêm quan sát giá.', $this->offerDetail($offerId));
    }

    private function offerBuilder(): \CodeIgniter\Database\BaseBuilder
    {
        $latestSubquery = $this->latestObservationSubquery();

        return $this->db->table('offers o')
            ->select('o.*, b.title AS book_title, b.status AS book_status, r.name AS retailer_name, r.slug AS retailer_slug, r.approved_domains, r.status AS retailer_status')
            ->select('m.name AS merchant_name, m.slug AS merchant_slug, m.retailer_platform_id AS merchant_retailer_platform_id, m.status AS merchant_status')
            ->select('lo.observed_at AS latest_observed_at, lo.availability_status AS latest_availability_status, lo.listed_item_price AS latest_price')
            ->join('books b', 'b.id = o.book_id')
            ->join('retailer_platforms r', 'r.id = o.retailer_platform_id')
            ->join('merchants m', 'm.id = o.merchant_id')
            ->join("({$latestSubquery}) latest", 'latest.offer_id = o.id', 'left')
            ->join('price_observations lo', 'lo.id = latest.latest_observation_id', 'left');
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

    private function categoryRow(object $row): array
    {
        return [
            'id' => (int) $row->id,
            'name' => (string) $row->name,
            'slug' => (string) $row->slug,
            'display_label' => $row->display_label === null ? null : (string) $row->display_label,
            'display_description' => $row->display_description === null ? null : (string) $row->display_description,
            'display_order' => (int) $row->display_order,
            'status' => (string) $row->status,
            'created_at' => (string) $row->created_at,
            'updated_at' => (string) $row->updated_at,
        ];
    }

    private function bookRow(object $row): array
    {
        return [
            'id' => (int) $row->id,
            'title' => (string) $row->title,
            'author' => (string) $row->author,
            'publisher' => (string) $row->publisher,
            'isbn' => $row->isbn,
            'description' => $row->description,
            'cover_image' => $row->cover_image,
            'primary_category_id' => (int) $row->primary_category_id,
            'category' => ['id' => (int) $row->primary_category_id, 'name' => (string) $row->category_name, 'slug' => (string) $row->category_slug, 'status' => (string) $row->category_status],
            'is_featured' => (bool) $row->is_featured,
            'status' => (string) $row->status,
            'created_at' => (string) $row->created_at,
            'updated_at' => (string) $row->updated_at,
        ];
    }

    private function retailerRow(object $row): array
    {
        $data = $this->snapshot($row);
        $data['approved_domains'] = $this->domainsFromJson((string) $row->approved_domains);

        return $data;
    }

    private function merchantRow(object $row): array
    {
        return $this->snapshot($row) + ['retailer' => ['id' => (int) $row->retailer_platform_id, 'name' => (string) $row->retailer_name, 'slug' => (string) $row->retailer_slug, 'status' => (string) $row->retailer_status]];
    }

    private function offerRow(object $row): array
    {
        return [
            'id' => (int) $row->id,
            'book_id' => (int) $row->book_id,
            'book_title' => (string) $row->book_title,
            'retailer_platform_id' => (int) $row->retailer_platform_id,
            'retailer_name' => (string) $row->retailer_name,
            'merchant_id' => (int) $row->merchant_id,
            'merchant_name' => (string) $row->merchant_name,
            'external_offer_title' => (string) $row->external_offer_title,
            'affiliate_destination_url' => $row->affiliate_destination_url,
            'destination_status' => (string) $row->destination_status,
            'status' => (string) $row->status,
            'latest_observation' => $row->latest_observed_at === null ? null : [
                'observed_at' => (string) $row->latest_observed_at,
                'availability_status' => (string) $row->latest_availability_status,
                'listed_item_price' => $row->latest_price === null ? null : (int) $row->latest_price,
            ],
            'eligibility_review' => $this->eligibilityReview($row),
            'created_at' => (string) $row->created_at,
            'updated_at' => (string) $row->updated_at,
        ];
    }

    private function eligibilityReview(object $row): array
    {
        $reasons = [];
        if ($row->book_status !== 'active' || $row->retailer_status !== 'active' || $row->merchant_status !== 'active') {
            $reasons[] = 'archived_related_entity';
        }
        if ((int) $row->merchant_retailer_platform_id !== (int) $row->retailer_platform_id) {
            $reasons[] = 'merchant_retailer_mismatch';
        }
        if ($row->affiliate_destination_url === null || $row->affiliate_destination_url === '' || $row->destination_status === 'missing') {
            $reasons[] = 'missing_destination';
        } elseif ($row->destination_status !== 'valid' || ! $this->destinationAllowed((string) $row->affiliate_destination_url, (string) $row->approved_domains)) {
            $reasons[] = 'invalid_destination';
        }
        if ($row->latest_observed_at === null || ! $this->fresh((string) $row->latest_observed_at)) {
            $reasons[] = 'stale_latest_observation';
        }
        if ($row->latest_availability_status !== 'available' || $row->latest_price === null || (int) $row->latest_price <= 0) {
            $reasons[] = 'unavailable_latest_observation';
        }
        if ($row->status !== 'active') {
            $reasons[] = 'offer_not_purchasable_status';
        }

        return [
            'purchasable' => $reasons === [],
            'reasons' => array_values(array_unique($reasons)),
        ];
    }

    private function bookPayload(array $body, ?object $current = null): array
    {
        return [
            'title' => trim((string) ($body['title'] ?? $current->title ?? '')),
            'author' => trim((string) ($body['author'] ?? $current->author ?? '')),
            'publisher' => trim((string) ($body['publisher'] ?? $current->publisher ?? '')),
            'isbn' => $body['isbn'] ?? $current->isbn ?? null,
            'description' => $body['description'] ?? $current->description ?? null,
            'cover_image' => $body['cover_image'] ?? $current->cover_image ?? null,
            'primary_category_id' => (int) ($body['primary_category_id'] ?? $current->primary_category_id ?? 0),
            'is_featured' => (int) (bool) ($body['is_featured'] ?? $current->is_featured ?? false),
            'status' => $body['status'] ?? $current->status ?? 'active',
        ];
    }

    private function categoryPayload(array $body, ?object $current = null): array
    {
        return [
            'name' => array_key_exists('name', $body) ? trim((string) $body['name']) : trim((string) ($current->name ?? '')),
            'slug' => array_key_exists('slug', $body)
                ? $this->slug((string) $body['slug'])
                : $this->slug((string) ($current->slug ?? $body['name'] ?? '')),
            'display_label' => $this->normalizeOptionalText($body, 'display_label', $current->display_label ?? null),
            'display_description' => $this->normalizeOptionalText($body, 'display_description', $current->display_description ?? null),
            'display_order' => $this->normalizeDisplayOrder($body, $current->display_order ?? 0),
            'status' => $body['status'] ?? $current->status ?? 'active',
        ];
    }

    private function retailerPayload(array $body, ?object $current = null): array
    {
        $domains = $body['approved_domains'] ?? ($current === null ? [] : $this->domainsFromJson((string) $current->approved_domains));
        if (is_string($domains)) {
            $domains = array_filter(array_map('trim', explode(',', $domains)));
        }

        return [
            'name' => trim((string) ($body['name'] ?? $current->name ?? '')),
            'slug' => $this->slug((string) ($body['slug'] ?? $current->slug ?? $body['name'] ?? '')),
            'approved_domains' => json_encode(array_values(array_unique(array_map('strtolower', (array) $domains))), JSON_UNESCAPED_UNICODE),
            'status' => $body['status'] ?? $current->status ?? 'active',
        ];
    }

    private function merchantPayload(array $body, ?object $current = null): array
    {
        return [
            'retailer_platform_id' => (int) ($body['retailer_platform_id'] ?? $current->retailer_platform_id ?? 0),
            'name' => trim((string) ($body['name'] ?? $current->name ?? '')),
            'slug' => $this->slug((string) ($body['slug'] ?? $current->slug ?? $body['name'] ?? '')),
            'status' => $body['status'] ?? $current->status ?? 'active',
        ];
    }

    private function offerPayload(array $body, ?object $current = null): array
    {
        $retailerId = (int) ($body['retailer_platform_id'] ?? $current->retailer_platform_id ?? 0);
        $url = trim((string) ($body['affiliate_destination_url'] ?? $current->affiliate_destination_url ?? ''));

        return [
            'book_id' => (int) ($body['book_id'] ?? $current->book_id ?? 0),
            'retailer_platform_id' => $retailerId,
            'merchant_id' => (int) ($body['merchant_id'] ?? $current->merchant_id ?? 0),
            'external_offer_title' => trim((string) ($body['external_offer_title'] ?? $current->external_offer_title ?? '')),
            'affiliate_destination_url' => $url === '' ? null : $url,
            'destination_status' => $url === '' ? 'missing' : $this->computedDestinationStatus($url, $retailerId),
            'status' => $body['status'] ?? $current->status ?? 'pending_review',
        ];
    }

    private function validateCategory(array $data): array
    {
        $errors = $this->basicNameSlugStatus($data, 'Tên danh mục không được để trống.', 'Slug danh mục không được để trống.');
        if (($data['display_label'] ?? null) !== null && mb_strlen((string) $data['display_label'], 'UTF-8') > 150) {
            $errors['display_label'] = 'Nhãn hiển thị tối đa 150 ký tự.';
        }
        if (($data['display_description'] ?? null) !== null && mb_strlen((string) $data['display_description'], 'UTF-8') > 1000) {
            $errors['display_description'] = 'Mô tả hiển thị tối đa 1000 ký tự.';
        }
        if (! is_int($data['display_order'] ?? null) || (int) $data['display_order'] < 0) {
            $errors['display_order'] = 'Thứ tự hiển thị phải là số nguyên từ 0 trở lên.';
        }

        return $errors;
    }

    private function validateBook(array $data): array
    {
        $errors = [];
        if ($data['title'] === '') {
            $errors['title'] = 'Tên sách không được để trống.';
        }
        if ($data['author'] === '') {
            $errors['author'] = 'Tác giả không được để trống.';
        }
        if (! in_array($data['status'], self::LIFECYCLE, true)) {
            $errors['status'] = 'Trạng thái sách không hợp lệ.';
        }
        $category = $this->categories->find((int) $data['primary_category_id']);
        if ($category === null || $category->status !== 'active') {
            $errors['primary_category_id'] = 'Sách phải thuộc danh mục Active.';
        }

        return $errors;
    }

    private function validateRetailer(array $data): array
    {
        $errors = $this->basicNameSlugStatus($data, 'Tên nền tảng không được để trống.', 'Slug nền tảng không được để trống.');
        foreach ($this->domainsFromJson((string) $data['approved_domains']) as $domain) {
            if (! preg_match('/^[a-z0-9.-]+\.[a-z]{2,}$/', $domain)) {
                $errors['approved_domains'] = 'Tên miền được duyệt chưa hợp lệ.';
            }
        }

        return $errors;
    }

    private function validateMerchant(array $data): array
    {
        $errors = $this->basicNameSlugStatus($data, 'Tên nhà bán không được để trống.', 'Slug nhà bán không được để trống.');
        if ($this->retailers->find((int) $data['retailer_platform_id']) === null) {
            $errors['retailer_platform_id'] = 'Nền tảng bán lẻ không tồn tại.';
        }

        return $errors;
    }

    private function validateOffer(array $data): array
    {
        $errors = [];
        if ($this->books->find((int) $data['book_id']) === null) {
            $errors['book_id'] = 'Sách không tồn tại.';
        }
        $retailer = $this->retailers->find((int) $data['retailer_platform_id']);
        if ($retailer === null) {
            $errors['retailer_platform_id'] = 'Nền tảng bán lẻ không tồn tại.';
        }
        $merchant = $this->merchants->find((int) $data['merchant_id']);
        if ($merchant === null) {
            $errors['merchant_id'] = 'Nhà bán không tồn tại.';
        } elseif ((int) $merchant->retailer_platform_id !== (int) $data['retailer_platform_id']) {
            $errors['merchant_id'] = 'Nhà bán phải thuộc đúng nền tảng bán lẻ đã chọn.';
        }
        if ($data['external_offer_title'] === '') {
            $errors['external_offer_title'] = 'Tên ưu đãi không được để trống.';
        }
        if (! in_array($data['status'], self::OFFER_STATUSES, true)) {
            $errors['status'] = 'Trạng thái ưu đãi không hợp lệ.';
        }
        if ($data['affiliate_destination_url'] !== null && ($data['destination_status'] !== 'valid' || ! $this->destinationAllowed((string) $data['affiliate_destination_url'], (string) ($retailer->approved_domains ?? '[]')))) {
            $errors['affiliate_destination_url'] = 'Liên kết mua phải dùng https:// và thuộc tên miền đã duyệt.';
        }

        return $errors;
    }

    private function basicNameSlugStatus(array $data, string $nameMessage, string $slugMessage): array
    {
        $errors = [];
        if (($data['name'] ?? '') === '') {
            $errors['name'] = $nameMessage;
        }
        if (($data['slug'] ?? '') === '') {
            $errors['slug'] = $slugMessage;
        }
        if (! in_array($data['status'] ?? '', self::LIFECYCLE, true)) {
            $errors['status'] = 'Trạng thái không hợp lệ.';
        }

        return $errors;
    }

    private function setStatus(object $actor, object $model, string $entityType, int $id, string $status, string $action, string $summary): array
    {
        if (! in_array($status, self::LIFECYCLE, true)) {
            return $this->error(422, 'Trạng thái chưa hợp lệ.', ['status' => 'Trạng thái không hợp lệ.']);
        }
        $row = $model->find($id);
        if ($row === null) {
            return $this->notFound('Không tìm thấy bản ghi.', $entityType);
        }
        if ($row->status === $status) {
            return $this->success(200, 'Trạng thái không thay đổi.', $this->snapshot($row));
        }
        $before = $this->snapshot($row);
        $model->update($id, ['status' => $status]);
        $after = $model->find($id);
        $this->audit->record($actor, $action, $entityType, $id, $summary, $before, $this->snapshot($after));

        return $this->success(200, 'Đã cập nhật trạng thái.', $this->snapshot($after));
    }

    private function pauseActiveAlertsForBook(object $actor, int $bookId): void
    {
        $alerts = $this->alerts->where('book_id', $bookId)->where('status', 'Active')->findAll();
        foreach ($alerts as $alert) {
            $this->alerts->update((int) $alert->id, ['status' => 'Paused']);
            $this->alertEvents->insert([
                'price_alert_id' => (int) $alert->id,
                'event_type' => 'paused_by_book_archive',
                'previous_status' => 'Active',
                'new_status' => 'Paused',
                'summary_json' => json_encode(['admin_user_id' => (int) $actor->id, 'book_id' => $bookId], JSON_UNESCAPED_UNICODE),
                'created_at' => $this->now->format('Y-m-d H:i:s'),
            ]);
        }
    }

    private function computedDestinationStatus(string $url, int $retailerId): string
    {
        $retailer = $this->retailers->find($retailerId);

        return $retailer !== null && $this->destinationAllowed($url, (string) $retailer->approved_domains) ? 'valid' : 'invalid';
    }

    private function destinationAllowed(string $url, string $approvedDomainsJson): bool
    {
        $parts = parse_url($url);
        if (($parts['scheme'] ?? '') !== 'https' || empty($parts['host'])) {
            return false;
        }
        $host = strtolower((string) $parts['host']);
        foreach ($this->domainsFromJson($approvedDomainsJson) as $domain) {
            if ($host === $domain || str_ends_with($host, '.' . $domain)) {
                return true;
            }
        }

        return false;
    }

    private function cycleId(string $cycleDate, string $notes): int
    {
        $existing = $this->cycles->where('cycle_date', $cycleDate)->first();
        if ($existing !== null) {
            return (int) $existing->id;
        }

        return (int) $this->cycles->insert([
            'cycle_date' => $cycleDate,
            'processed_at' => $cycleDate . ' ' . $this->now->format('H:i:s'),
            'notes' => $notes,
        ]);
    }

    private function fresh(string $observedAt): bool
    {
        $observed = new DateTimeImmutable($observedAt, new DateTimeZone(self::TZ));

        return $observed >= $this->now->modify('-48 hours') && $observed <= $this->now->modify('+5 minutes');
    }

    private function domainsFromJson(string $json): array
    {
        $decoded = json_decode($json, true);
        if (! is_array($decoded)) {
            return [];
        }

        return array_values(array_filter(array_map(static fn ($value): string => strtolower(trim((string) $value)), $decoded)));
    }

    private function applySearch(object $builder, array $filters, array $columns): void
    {
        $q = trim((string) ($filters['q'] ?? ''));
        if ($q === '') {
            return;
        }
        $builder->groupStart();
        foreach ($columns as $index => $column) {
            $index === 0 ? $builder->like($column, $q) : $builder->orLike($column, $q);
        }
        $builder->groupEnd();
    }

    private function applyStatus(object $builder, array $filters, array $allowed, string $column = 'status'): void
    {
        if (isset($filters['status']) && in_array((string) $filters['status'], $allowed, true)) {
            $builder->where($column, (string) $filters['status']);
        }
    }

    private function slug(string $value): string
    {
        $value = mb_strtolower(trim($value), 'UTF-8');
        $value = strtr($value, ['đ' => 'd', 'Đ' => 'd']);
        $value = preg_replace('/[^a-z0-9]+/i', '-', $value) ?? '';

        return trim($value, '-');
    }

    private function normalizeOptionalText(array $body, string $field, mixed $fallback): ?string
    {
        if (! array_key_exists($field, $body)) {
            $value = is_string($fallback) ? trim($fallback) : '';

            return $value === '' ? null : $value;
        }

        if ($body[$field] === null) {
            return null;
        }

        $value = trim((string) $body[$field]);

        return $value === '' ? null : $value;
    }

    private function normalizeDisplayOrder(array $body, mixed $fallback): int
    {
        if (! array_key_exists('display_order', $body)) {
            return (int) $fallback;
        }

        $raw = trim((string) $body['display_order']);
        if ($raw === '') {
            return 0;
        }

        if (! preg_match('/^-?\d+$/', $raw)) {
            return -1;
        }

        return (int) $raw;
    }

    private function exists(string $table, string $column, string $value, ?int $exceptId = null): bool
    {
        $builder = $this->db->table($table)->where($column, $value);
        if ($exceptId !== null) {
            $builder->where('id !=', $exceptId);
        }

        return $builder->countAllResults() > 0;
    }

    private function countRows(string $table, array $where): int
    {
        return (int) $this->db->table($table)->where($where)->countAllResults();
    }

    private function snapshot(?object $row): ?array
    {
        if ($row === null) {
            return null;
        }
        $values = get_object_vars($row);
        foreach ($values as $key => $value) {
            if (str_ends_with((string) $key, '_id') || $key === 'id') {
                $values[$key] = (int) $value;
            }
        }

        return $values;
    }

    private function success(int $statusCode, string $message, mixed $data): array
    {
        return ['ok' => true, 'statusCode' => $statusCode, 'message' => $message, 'data' => $data];
    }

    private function error(int $statusCode, string $message, array $errors): array
    {
        return ['ok' => false, 'statusCode' => $statusCode, 'message' => $message, 'errors' => $errors];
    }

    private function notFound(string $message, string $field): array
    {
        return $this->error(404, $message, [$field => 'Bản ghi không tồn tại.']);
    }
}
