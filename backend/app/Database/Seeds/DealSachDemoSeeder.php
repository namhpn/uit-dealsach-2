<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;
use DateTimeImmutable;
use DateTimeZone;

class DealSachDemoSeeder extends Seeder
{
    private const BASE_NOW = '2026-05-26 09:00:00';

    public function run(): void
    {
        $this->clearTables();

        $now = self::BASE_NOW;
        $categoryIds = $this->seedCategories($now);
        $bookIds = $this->seedBooks($categoryIds, $now);
        $retailerIds = $this->seedRetailerPlatforms($now);
        $merchantIds = $this->seedMerchants($retailerIds, $now);
        $offerIds = $this->seedOffers($bookIds, $retailerIds, $merchantIds, $now);
        $cycleIds = $this->seedObservationCycles($now);
        $this->seedPriceObservations($offerIds, $cycleIds, $now);
        $this->seedBuyFlowEvents($offerIds, $now);
    }

    private function clearTables(): void
    {
        $tables = [
            'user_sessions',
            'outbound_emails',
            'email_verification_codes',
            'users',
            'redirect_failures',
            'affiliate_redirects',
            'buy_attempts',
            'price_observations',
            'observation_cycles',
            'offers',
            'merchants',
            'retailer_platforms',
            'books',
            'categories',
        ];

        $this->db->disableForeignKeyChecks();

        foreach ($tables as $table) {
            $this->db->table($table)->truncate();
        }

        $this->db->enableForeignKeyChecks();
    }

    /**
     * @return array<string, int>
     */
    private function seedCategories(string $now): array
    {
        $rows = [
            ['name' => 'Kinh tế', 'slug' => 'kinh-te', 'status' => 'active'],
            ['name' => 'Văn học Việt Nam', 'slug' => 'van-hoc-viet-nam', 'status' => 'active'],
            ['name' => 'Kỹ năng sống', 'slug' => 'ky-nang-song', 'status' => 'active'],
            ['name' => 'Thiếu nhi', 'slug' => 'thieu-nhi', 'status' => 'active'],
            ['name' => 'Công nghệ', 'slug' => 'cong-nghe', 'status' => 'active'],
            ['name' => 'Lịch sử', 'slug' => 'lich-su', 'status' => 'active'],
        ];

        return $this->insertAndMap('categories', $rows, 'slug', $now);
    }

    /**
     * @param array<string, int> $categoryIds
     *
     * @return array<string, int>
     */
    private function seedBooks(array $categoryIds, string $now): array
    {
        $rows = [
            [
                'key' => 'ca-phe-cung-tony',
                'title' => 'Cà phê cùng Tony',
                'author' => 'Tony Buổi Sáng',
                'publisher' => 'NXB Trẻ',
                'isbn' => '9786041000001',
                'description' => 'Tản văn truyền cảm hứng về học tập, làm việc và sống chủ động.',
                'cover_image' => '/demo/covers/ca-phe-cung-tony.jpg',
                'primary_category_id' => $categoryIds['ky-nang-song'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'tuoi-tre-dang-gia-bao-nhieu',
                'title' => 'Tuổi trẻ đáng giá bao nhiêu',
                'author' => 'Rosie Nguyễn',
                'publisher' => 'NXB Hội Nhà Văn',
                'isbn' => '9786041000002',
                'description' => 'Gợi ý đọc, đi và trải nghiệm cho người trẻ Việt Nam.',
                'cover_image' => '/demo/covers/tuoi-tre-dang-gia-bao-nhieu.jpg',
                'primary_category_id' => $categoryIds['ky-nang-song'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'nha-gia-kim',
                'title' => 'Nhà giả kim',
                'author' => 'Paulo Coelho',
                'publisher' => 'NXB Văn Học',
                'isbn' => '9786041000003',
                'description' => 'Tiểu thuyết về hành trình theo đuổi kho báu và ước mơ.',
                'cover_image' => '/demo/covers/nha-gia-kim.jpg',
                'primary_category_id' => $categoryIds['van-hoc-viet-nam'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'dac-nhan-tam',
                'title' => 'Đắc nhân tâm',
                'author' => 'Dale Carnegie',
                'publisher' => 'NXB Tổng Hợp TP.HCM',
                'isbn' => '9786041000004',
                'description' => 'Sách kinh điển về giao tiếp và ứng xử.',
                'cover_image' => '/demo/covers/dac-nhan-tam.jpg',
                'primary_category_id' => $categoryIds['ky-nang-song'],
                'is_featured' => 0,
                'status' => 'active',
            ],
            [
                'key' => 'toi-thay-hoa-vang-tren-co-xanh',
                'title' => 'Tôi thấy hoa vàng trên cỏ xanh',
                'author' => 'Nguyễn Nhật Ánh',
                'publisher' => 'NXB Trẻ',
                'isbn' => '9786041000005',
                'description' => 'Câu chuyện tuổi thơ trong trẻo và giàu cảm xúc.',
                'cover_image' => '/demo/covers/toi-thay-hoa-vang-tren-co-xanh.jpg',
                'primary_category_id' => $categoryIds['van-hoc-viet-nam'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'mat-biec',
                'title' => 'Mắt biếc',
                'author' => 'Nguyễn Nhật Ánh',
                'publisher' => 'NXB Trẻ',
                'isbn' => '9786041000006',
                'description' => 'Một câu chuyện tình yêu nhiều tiếc nuối.',
                'cover_image' => '/demo/covers/mat-biec.jpg',
                'primary_category_id' => $categoryIds['van-hoc-viet-nam'],
                'is_featured' => 0,
                'status' => 'active',
            ],
            [
                'key' => 'nghi-giau-lam-giau',
                'title' => 'Nghĩ giàu làm giàu',
                'author' => 'Napoleon Hill',
                'publisher' => 'NXB Lao Động',
                'isbn' => '9786041000007',
                'description' => 'Những nguyên tắc tư duy tài chính cá nhân phổ biến.',
                'cover_image' => '/demo/covers/nghi-giau-lam-giau.jpg',
                'primary_category_id' => $categoryIds['kinh-te'],
                'is_featured' => 0,
                'status' => 'active',
            ],
            [
                'key' => 'cha-giau-cha-ngheo',
                'title' => 'Cha giàu cha nghèo',
                'author' => 'Robert T. Kiyosaki',
                'publisher' => 'NXB Trẻ',
                'isbn' => '9786041000008',
                'description' => 'Góc nhìn phổ thông về tài sản, nợ và thói quen tài chính.',
                'cover_image' => '/demo/covers/cha-giau-cha-ngheo.jpg',
                'primary_category_id' => $categoryIds['kinh-te'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'clean-code',
                'title' => 'Clean Code - Mã sạch và con đường trở thành lập trình viên giỏi',
                'author' => 'Robert C. Martin',
                'publisher' => 'NXB Công Thương',
                'isbn' => '9786041000009',
                'description' => 'Các nguyên tắc viết mã dễ đọc, dễ bảo trì.',
                'cover_image' => '/demo/covers/clean-code.jpg',
                'primary_category_id' => $categoryIds['cong-nghe'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'lap-trinh-vien-thuc-dung',
                'title' => 'Lập trình viên thực dụng',
                'author' => 'David Thomas, Andrew Hunt',
                'publisher' => 'NXB Dân Trí',
                'isbn' => '9786041000010',
                'description' => 'Các thói quen kỹ thuật giúp lập trình viên làm việc hiệu quả.',
                'cover_image' => '/demo/covers/lap-trinh-vien-thuc-dung.jpg',
                'primary_category_id' => $categoryIds['cong-nghe'],
                'is_featured' => 0,
                'status' => 'active',
            ],
            [
                'key' => 'de-men-phieu-luu-ky',
                'title' => 'Dế Mèn phiêu lưu ký',
                'author' => 'Tô Hoài',
                'publisher' => 'NXB Kim Đồng',
                'isbn' => '9786041000011',
                'description' => 'Tác phẩm thiếu nhi kinh điển của văn học Việt Nam.',
                'cover_image' => '/demo/covers/de-men-phieu-luu-ky.jpg',
                'primary_category_id' => $categoryIds['thieu-nhi'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'viet-nam-su-luoc',
                'title' => 'Việt Nam sử lược',
                'author' => 'Trần Trọng Kim',
                'publisher' => 'NXB Văn Học',
                'isbn' => '9786041000012',
                'description' => 'Một công trình phổ thông về lịch sử Việt Nam.',
                'cover_image' => '/demo/covers/viet-nam-su-luoc.jpg',
                'primary_category_id' => $categoryIds['lich-su'],
                'is_featured' => 1,
                'status' => 'active',
            ],
        ];

        $map = [];
        foreach ($rows as $row) {
            $key = $row['key'];
            unset($row['key']);
            $row['created_at'] = $now;
            $row['updated_at'] = $now;
            $this->db->table('books')->insert($row);
            $map[$key] = (int) $this->db->insertID();
        }

        return $map;
    }

    /**
     * @return array<string, int>
     */
    private function seedRetailerPlatforms(string $now): array
    {
        $rows = [
            ['name' => 'Tiki', 'slug' => 'tiki', 'approved_domains' => json_encode(['tiki.vn', 'seller.tiki.vn']), 'status' => 'active'],
            ['name' => 'Fahasa', 'slug' => 'fahasa', 'approved_domains' => json_encode(['fahasa.com']), 'status' => 'active'],
            ['name' => 'Shopee', 'slug' => 'shopee', 'approved_domains' => json_encode(['shopee.vn']), 'status' => 'active'],
            ['name' => 'Lazada', 'slug' => 'lazada', 'approved_domains' => json_encode(['lazada.vn']), 'status' => 'active'],
        ];

        return $this->insertAndMap('retailer_platforms', $rows, 'slug', $now);
    }

    /**
     * @param array<string, int> $retailerIds
     *
     * @return array<string, int>
     */
    private function seedMerchants(array $retailerIds, string $now): array
    {
        $rows = [
            ['retailer_platform_id' => $retailerIds['tiki'], 'name' => 'Tiki Trading', 'slug' => 'tiki-trading', 'status' => 'active'],
            ['retailer_platform_id' => $retailerIds['tiki'], 'name' => 'Nhà sách Minh Long', 'slug' => 'nha-sach-minh-long', 'status' => 'active'],
            ['retailer_platform_id' => $retailerIds['fahasa'], 'name' => 'Fahasa Official', 'slug' => 'fahasa-official', 'status' => 'active'],
            ['retailer_platform_id' => $retailerIds['fahasa'], 'name' => 'Alpha Books', 'slug' => 'alpha-books', 'status' => 'active'],
            ['retailer_platform_id' => $retailerIds['shopee'], 'name' => 'Shop Sách Việt', 'slug' => 'shop-sach-viet', 'status' => 'active'],
            ['retailer_platform_id' => $retailerIds['shopee'], 'name' => 'Sách Hay 24h', 'slug' => 'sach-hay-24h', 'status' => 'active'],
            ['retailer_platform_id' => $retailerIds['lazada'], 'name' => 'Lazada Books', 'slug' => 'lazada-books', 'status' => 'active'],
            ['retailer_platform_id' => $retailerIds['lazada'], 'name' => 'Nhà sách Trẻ', 'slug' => 'nha-sach-tre', 'status' => 'active'],
        ];

        return $this->insertAndMap('merchants', $rows, 'slug', $now);
    }

    /**
     * @param array<string, int> $bookIds
     * @param array<string, int> $retailerIds
     * @param array<string, int> $merchantIds
     *
     * @return array<string, int>
     */
    private function seedOffers(array $bookIds, array $retailerIds, array $merchantIds, string $now): array
    {
        $rows = [
            ['key' => 'b1_tiki', 'book' => 'ca-phe-cung-tony', 'retailer' => 'tiki', 'merchant' => 'tiki-trading', 'title' => 'Cà phê cùng Tony - bìa mềm', 'url' => 'https://tiki.vn/ca-phe-cung-tony-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b1_fahasa', 'book' => 'ca-phe-cung-tony', 'retailer' => 'fahasa', 'merchant' => 'fahasa-official', 'title' => 'Cà phê cùng Tony', 'url' => 'https://fahasa.com/ca-phe-cung-tony-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b2_shopee', 'book' => 'tuoi-tre-dang-gia-bao-nhieu', 'retailer' => 'shopee', 'merchant' => 'shop-sach-viet', 'title' => 'Tuổi trẻ đáng giá bao nhiêu', 'url' => 'https://shopee.vn/tuoi-tre-dang-gia-bao-nhieu-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b2_lazada', 'book' => 'tuoi-tre-dang-gia-bao-nhieu', 'retailer' => 'lazada', 'merchant' => 'lazada-books', 'title' => 'Tuổi trẻ đáng giá bao nhiêu - sách mới', 'url' => 'https://lazada.vn/tuoi-tre-dang-gia-bao-nhieu-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b3_tiki', 'book' => 'nha-gia-kim', 'retailer' => 'tiki', 'merchant' => 'nha-sach-minh-long', 'title' => 'Nhà giả kim - tái bản', 'url' => 'https://tiki.vn/nha-gia-kim-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b3_shopee_invalid', 'book' => 'nha-gia-kim', 'retailer' => 'shopee', 'merchant' => 'sach-hay-24h', 'title' => 'Nhà giả kim', 'url' => 'https://unsafe.example/nha-gia-kim-demo', 'destination' => 'invalid', 'status' => 'active'],
            ['key' => 'b4_fahasa_unavailable', 'book' => 'dac-nhan-tam', 'retailer' => 'fahasa', 'merchant' => 'alpha-books', 'title' => 'Đắc nhân tâm', 'url' => 'https://fahasa.com/dac-nhan-tam-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b4_lazada', 'book' => 'dac-nhan-tam', 'retailer' => 'lazada', 'merchant' => 'nha-sach-tre', 'title' => 'Đắc nhân tâm - bản phổ thông', 'url' => 'https://lazada.vn/dac-nhan-tam-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b5_tiki', 'book' => 'toi-thay-hoa-vang-tren-co-xanh', 'retailer' => 'tiki', 'merchant' => 'tiki-trading', 'title' => 'Tôi thấy hoa vàng trên cỏ xanh', 'url' => 'https://tiki.vn/toi-thay-hoa-vang-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b5_shopee_missing', 'book' => 'toi-thay-hoa-vang-tren-co-xanh', 'retailer' => 'shopee', 'merchant' => 'shop-sach-viet', 'title' => 'Tôi thấy hoa vàng trên cỏ xanh', 'url' => null, 'destination' => 'missing', 'status' => 'active'],
            ['key' => 'b6_fahasa', 'book' => 'mat-biec', 'retailer' => 'fahasa', 'merchant' => 'fahasa-official', 'title' => 'Mắt biếc', 'url' => 'https://fahasa.com/mat-biec-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b6_tiki_unavailable', 'book' => 'mat-biec', 'retailer' => 'tiki', 'merchant' => 'nha-sach-minh-long', 'title' => 'Mắt biếc - bìa mềm', 'url' => 'https://tiki.vn/mat-biec-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b7_tiki_stale', 'book' => 'nghi-giau-lam-giau', 'retailer' => 'tiki', 'merchant' => 'tiki-trading', 'title' => 'Nghĩ giàu làm giàu', 'url' => 'https://tiki.vn/nghi-giau-lam-giau-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b7_lazada', 'book' => 'nghi-giau-lam-giau', 'retailer' => 'lazada', 'merchant' => 'lazada-books', 'title' => 'Nghĩ giàu làm giàu - bìa mềm', 'url' => 'https://lazada.vn/nghi-giau-lam-giau-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b8_fahasa_stale', 'book' => 'cha-giau-cha-ngheo', 'retailer' => 'fahasa', 'merchant' => 'alpha-books', 'title' => 'Cha giàu cha nghèo', 'url' => 'https://fahasa.com/cha-giau-cha-ngheo-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b8_shopee', 'book' => 'cha-giau-cha-ngheo', 'retailer' => 'shopee', 'merchant' => 'sach-hay-24h', 'title' => 'Cha giàu cha nghèo', 'url' => 'https://shopee.vn/cha-giau-cha-ngheo-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b9_tiki', 'book' => 'clean-code', 'retailer' => 'tiki', 'merchant' => 'tiki-trading', 'title' => 'Clean Code - bản tiếng Việt', 'url' => 'https://tiki.vn/clean-code-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b9_shopee_missing', 'book' => 'clean-code', 'retailer' => 'shopee', 'merchant' => 'shop-sach-viet', 'title' => 'Clean Code - mã sạch', 'url' => null, 'destination' => 'missing', 'status' => 'pending_review'],
            ['key' => 'b10_fahasa', 'book' => 'lap-trinh-vien-thuc-dung', 'retailer' => 'fahasa', 'merchant' => 'fahasa-official', 'title' => 'Lập trình viên thực dụng', 'url' => 'https://fahasa.com/lap-trinh-vien-thuc-dung-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b10_lazada', 'book' => 'lap-trinh-vien-thuc-dung', 'retailer' => 'lazada', 'merchant' => 'nha-sach-tre', 'title' => 'Lập trình viên thực dụng - sách công nghệ', 'url' => 'https://lazada.vn/lap-trinh-vien-thuc-dung-demo', 'destination' => 'valid', 'status' => 'inactive'],
            ['key' => 'b11_tiki', 'book' => 'de-men-phieu-luu-ky', 'retailer' => 'tiki', 'merchant' => 'nha-sach-minh-long', 'title' => 'Dế Mèn phiêu lưu ký', 'url' => 'https://tiki.vn/de-men-phieu-luu-ky-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b11_fahasa', 'book' => 'de-men-phieu-luu-ky', 'retailer' => 'fahasa', 'merchant' => 'fahasa-official', 'title' => 'Dế Mèn phiêu lưu ký - Kim Đồng', 'url' => 'https://fahasa.com/de-men-phieu-luu-ky-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b12_shopee', 'book' => 'viet-nam-su-luoc', 'retailer' => 'shopee', 'merchant' => 'sach-hay-24h', 'title' => 'Việt Nam sử lược', 'url' => 'https://shopee.vn/viet-nam-su-luoc-demo', 'destination' => 'valid', 'status' => 'active'],
            ['key' => 'b12_lazada_invalid', 'book' => 'viet-nam-su-luoc', 'retailer' => 'lazada', 'merchant' => 'lazada-books', 'title' => 'Việt Nam sử lược - bản đầy đủ', 'url' => 'javascript:alert(1)', 'destination' => 'invalid', 'status' => 'removed_invalid'],
        ];

        $map = [];
        foreach ($rows as $row) {
            $key = $row['key'];
            $insert = [
                'book_id' => $bookIds[$row['book']],
                'retailer_platform_id' => $retailerIds[$row['retailer']],
                'merchant_id' => $merchantIds[$row['merchant']],
                'external_offer_title' => $row['title'],
                'affiliate_destination_url' => $row['url'],
                'destination_status' => $row['destination'],
                'status' => $row['status'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $this->db->table('offers')->insert($insert);
            $map[$key] = (int) $this->db->insertID();
        }

        return $map;
    }

    /**
     * @return array<string, int>
     */
    private function seedObservationCycles(string $now): array
    {
        $timezone = new DateTimeZone('Asia/Ho_Chi_Minh');
        $start = new DateTimeImmutable('2026-05-13', $timezone);
        $rows = [];

        for ($day = 0; $day < 14; $day++) {
            $cycleDate = $start->modify(sprintf('+%d days', $day))->format('Y-m-d');
            $rows[] = [
                'cycle_date' => $cycleDate,
                'processed_at' => $cycleDate . ' 08:30:00',
                'notes' => 'Chu kỳ quan sát demo ngày ' . $cycleDate,
            ];
        }

        return $this->insertAndMap('observation_cycles', $rows, 'cycle_date', $now);
    }

    /**
     * @param array<string, int> $offerIds
     * @param array<string, int> $cycleIds
     */
    private function seedPriceObservations(array $offerIds, array $cycleIds, string $now): void
    {
        $series = [
            'b1_tiki' => [132000, 132000, 129000, 129000, 125000, 125000, 122000, 119000, 119000, 116000, 112000, 112000, 109000, 109000],
            'b1_fahasa' => [128000, 128000, 126000, 126000, 124000, 121000, 121000, 119000, 117000, 115000, 113000, 111000, 109000, 109000],
            'b2_shopee' => [96000, 96000, 94000, 94000, 92000, 91000, 90000, 90000, 88000, 87000, 86000, 86000, 85000, 85000],
            'b2_lazada' => [101000, 99000, 98000, 96000, 94000, 93000, 91000, 90000, 89000, 88000, 87000, 86000, 85000, 85000],
            'b3_tiki' => [154000, 154000, 151000, 151000, 149000, 148000, 146000, 145000, 143000, 142000, 141000, 140000, 139000, 139000],
            'b3_shopee_invalid' => [149000, 149000, 147000, 147000, 145000, 145000, 144000, 143000, 143000, 142000, 142000, 141000, 141000, 141000],
            'b4_fahasa_unavailable' => [118000, 118000, 116000, 116000, 115000, 115000, 114000, 114000, 113000, 113000, 112000, 112000, null, null],
            'b4_lazada' => [121000, 121000, 119000, 119000, 118000, 118000, 117000, 117000, 116000, 116000, 115000, 115000, 114000, 114000],
            'b5_tiki' => [134000, 134000, 132000, 131000, 130000, 128000, 127000, 125000, 124000, 122000, 120000, 119000, 118000, 118000],
            'b5_shopee_missing' => [136000, 135000, 133000, 132000, 130000, 129000, 127000, 126000, 124000, 122000, 121000, 119000, 118000, 118000],
            'b6_fahasa' => [90000, 90000, 89000, 89000, 88000, 88000, 87000, 87000, 86000, 86000, 85000, 85000, 84000, 84000],
            'b6_tiki_unavailable' => [92000, 92000, 91000, 91000, 90000, 90000, 89000, 89000, 88000, 88000, 87000, 87000, null, null],
            'b8_shopee' => [142000, 141000, 140000, 138000, 137000, 136000, 134000, 132000, 130000, 129000, 127000, 126000, 125000, 125000],
            'b9_tiki' => [214000, 214000, 211000, 211000, 209000, 207000, 206000, 204000, 202000, 199000, 197000, 196000, 195000, 195000],
            'b11_tiki' => [76000, 76000, 75000, 75000, 74000, 74000, 73000, 73000, 72000, 71000, 70000, 70000, 69000, 69000],
            'b11_fahasa' => [79000, 78000, 77000, 77000, 76000, 75000, 74000, 74000, 73000, 72000, 71000, 70000, 69000, 69000],
            'b12_shopee' => [168000, 168000, 166000, 165000, 164000, 162000, 161000, 159000, 158000, 156000, 154000, 153000, 152000, 152000],
        ];

        $snapshot = [
            'b3_shopee_invalid' => ['destination' => 'invalid'],
            'b5_shopee_missing' => ['destination' => 'missing'],
        ];

        foreach ($series as $offerKey => $prices) {
            foreach (array_values($cycleIds) as $index => $cycleId) {
                $price = $prices[$index];
                $this->insertObservation(
                    $offerIds[$offerKey],
                    $cycleId,
                    array_keys($cycleIds)[$index] . ' 09:00:00',
                    $price === null ? 'unavailable' : 'available',
                    $price,
                    $snapshot[$offerKey]['destination'] ?? 'valid',
                    $now,
                );
            }
        }

        $staleRows = [
            ['offer' => 'b7_tiki_stale', 'cycle' => '2026-05-20', 'observed' => '2026-05-20 09:00:00', 'price' => 126000],
            ['offer' => 'b8_fahasa_stale', 'cycle' => '2026-05-21', 'observed' => '2026-05-21 09:00:00', 'price' => 98000],
        ];

        foreach ($staleRows as $row) {
            $this->insertObservation($offerIds[$row['offer']], $cycleIds[$row['cycle']], $row['observed'], 'available', $row['price'], 'valid', $now);
        }
    }

    private function insertObservation(
        int $offerId,
        int $cycleId,
        string $observedAt,
        string $availability,
        ?int $price,
        string $destinationStatus,
        string $now,
    ): void {
        $this->db->table('price_observations')->insert([
            'offer_id' => $offerId,
            'observation_cycle_id' => $cycleId,
            'observed_at' => $observedAt,
            'availability_status' => $availability,
            'listed_item_price' => $price,
            'book_status_at_observation' => 'active',
            'offer_status_at_observation' => 'active',
            'retailer_status_at_observation' => 'active',
            'merchant_status_at_observation' => 'active',
            'merchant_retailer_consistent_at_observation' => 1,
            'destination_status_at_observation' => $destinationStatus,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    /**
     * @param array<string, int> $offerIds
     */
    private function seedBuyFlowEvents(array $offerIds, string $now): void
    {
        $events = [
            ['offer' => 'b1_fahasa', 'at' => '2026-05-25 10:15:00'],
            ['offer' => 'b1_fahasa', 'at' => '2026-05-25 11:20:00'],
            ['offer' => 'b1_tiki', 'at' => '2026-05-24 14:10:00'],
            ['offer' => 'b2_lazada', 'at' => '2026-05-25 09:00:00'],
            ['offer' => 'b2_lazada', 'at' => '2026-05-24 09:00:00'],
            ['offer' => 'b3_tiki', 'at' => '2026-05-25 16:30:00'],
            ['offer' => 'b3_tiki', 'at' => '2026-05-18 08:00:00'],
            ['offer' => 'b5_tiki', 'at' => '2026-05-25 13:45:00'],
            ['offer' => 'b8_shopee', 'at' => '2026-05-24 18:05:00'],
            ['offer' => 'b11_tiki', 'at' => '2026-05-25 19:15:00'],
            ['offer' => 'b12_shopee', 'at' => '2026-05-23 20:30:00'],
        ];

        foreach ($events as $event) {
            $offer = $this->offerSnapshot($offerIds[$event['offer']]);
            $payload = $this->eventPayload($offer, $event['at'], $now);
            $this->db->table('buy_attempts')->insert($payload + [
                'event_type' => 'buy_attempt',
                'attempt_status' => 'recorded',
            ]);
            $this->db->table('affiliate_redirects')->insert($payload + [
                'event_type' => 'affiliate_redirect',
                'redirect_status' => 'redirected',
            ]);
        }

        $invalidOffer = $this->offerSnapshot($offerIds['b3_shopee_invalid']);
        $this->db->table('buy_attempts')->insert($this->eventPayload($invalidOffer, '2026-05-25 17:00:00', $now) + [
            'event_type' => 'buy_attempt',
            'attempt_status' => 'recorded',
        ]);
        $this->db->table('redirect_failures')->insert($this->eventPayload($invalidOffer, '2026-05-25 17:00:00', $now) + [
            'event_type' => 'redirect_failure',
            'failure_reason' => 'destination_invalid',
        ]);
    }

    private function offerSnapshot(int $offerId): object
    {
        return $this->db->table('offers')
            ->where('id', $offerId)
            ->get()
            ->getFirstRow();
    }

    /**
     * @return array<string, mixed>
     */
    private function eventPayload(object $offer, string $eventAt, string $now): array
    {
        $parts = is_string($offer->affiliate_destination_url) ? (parse_url($offer->affiliate_destination_url) ?: []) : [];

        return [
            'offer_id' => (int) $offer->id,
            'book_id' => (int) $offer->book_id,
            'retailer_platform_id' => (int) $offer->retailer_platform_id,
            'merchant_id' => (int) $offer->merchant_id,
            'event_at' => $eventAt,
            'destination_domain' => isset($parts['host']) ? strtolower((string) $parts['host']) : null,
            'destination_path_summary' => isset($parts['path']) ? mb_substr((string) $parts['path'], 0, 255, 'UTF-8') : null,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }

    /**
     * @param list<array<string, mixed>> $rows
     *
     * @return array<string, int>
     */
    private function insertAndMap(string $table, array $rows, string $keyField, string $now): array
    {
        $map = [];

        foreach ($rows as $row) {
            $key = (string) $row[$keyField];
            $row['created_at'] = $now;
            $row['updated_at'] = $now;
            $this->db->table($table)->insert($row);
            $map[$key] = (int) $this->db->insertID();
        }

        return $map;
    }
}
