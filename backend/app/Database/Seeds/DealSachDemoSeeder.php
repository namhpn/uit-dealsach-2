<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;
use DateTimeImmutable;
use DateTimeZone;

class DealSachDemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->clearTables();

        $clock = $this->nowInVietnam()->modify('-1 hour');
        $now = $this->formatDateTime($clock);
        $categoryIds = $this->seedCategories($now);
        $bookIds = $this->seedBooks($categoryIds, $now);
        $retailerIds = $this->seedRetailerPlatforms($now);
        $merchantIds = $this->seedMerchants($retailerIds, $now);
        $offerIds = $this->seedOffers($bookIds, $retailerIds, $merchantIds, $now);
        $cycleIds = $this->seedObservationCycles($clock, $now);
        $this->seedPriceObservations($offerIds, $cycleIds, $clock, $now);
        $this->seedBuyFlowEvents($offerIds, $clock, $now);
        $userIds = $this->seedUsers($now);
        $this->seedDashboardDemoScenarios($userIds, $bookIds, $offerIds, $clock);
    }

    private function clearTables(): void
    {
        $tables = [
            'admin_audit_logs',
            'alert_disable_tokens',
            'email_deal_link_clicks',
            'email_deal_links',
            'price_alert_events',
            'user_alert_preferences',
            'price_alerts',
            'wishlist_items',
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
    private function seedUsers(string $now): array
    {
        $rows = [
            ['key' => 'admin', 'normalized_email' => '24521102@gm.uit.edu.vn', 'display_email' => '24521102@gm.uit.edu.vn', 'role' => 'admin', 'status' => 'active', 'alert_email_enabled' => 1],
            ['key' => 'active_reader', 'normalized_email' => 'active-reader@dealsach.test', 'display_email' => 'active-reader@dealsach.test', 'role' => 'registered', 'status' => 'active', 'alert_email_enabled' => 1],
            ['key' => 'suppressed_reader', 'normalized_email' => 'suppressed-reader@dealsach.test', 'display_email' => 'suppressed-reader@dealsach.test', 'role' => 'registered', 'status' => 'active', 'alert_email_enabled' => 0],
        ];
        $map = [];
        foreach ($rows as $row) {
            $key = $row['key'];
            unset($row['key']);
            $row['created_at'] = $now;
            $row['updated_at'] = $now;
            $this->db->table('users')->insert($row);
            $map[$key] = (int) $this->db->insertID();
        }

        return $map;
    }

    /**
     * @param array<string, int> $userIds
     * @param array<string, int> $bookIds
     * @param array<string, int> $offerIds
     */
    private function seedDashboardDemoScenarios(array $userIds, array $bookIds, array $offerIds, DateTimeImmutable $clock): void
    {
        $alerts = [
            [
                'key' => 'active_target',
                'user_id' => $userIds['active_reader'],
                'book_id' => $bookIds['clean-code'],
                'alert_type' => 'target_price',
                'status' => 'Active',
                'target_price' => 198000,
                'baseline_price' => null,
                'baseline_pending' => 0,
                'comparison_price' => 207000,
                'last_notified_price' => null,
                'notification_count' => 1,
                'expires_at' => $this->formatDateTime($clock->modify('+90 days')),
                'created_at' => $this->formatDateTime($clock->modify('-2 days')),
                'updated_at' => $this->formatDateTime($clock->modify('-1 day')),
            ],
            [
                'key' => 'suppressed_target',
                'user_id' => $userIds['suppressed_reader'],
                'book_id' => $bookIds['nha-gia-kim'],
                'alert_type' => 'target_price',
                'status' => 'Active',
                'target_price' => 140000,
                'baseline_price' => null,
                'baseline_pending' => 0,
                'comparison_price' => 145000,
                'last_notified_price' => null,
                'notification_count' => 0,
                'expires_at' => $this->formatDateTime($clock->modify('+90 days')),
                'created_at' => $this->formatDateTime($clock->modify('-2 days +30 minutes')),
                'updated_at' => $this->formatDateTime($clock->modify('-1 day')),
            ],
            [
                'key' => 'auto_paused_lowest',
                'user_id' => $userIds['active_reader'],
                'book_id' => $bookIds['tuoi-tre-dang-gia-bao-nhieu'],
                'alert_type' => 'new_lowest_price',
                'status' => 'Auto-paused',
                'target_price' => null,
                'baseline_price' => 90000,
                'baseline_pending' => 0,
                'comparison_price' => null,
                'last_notified_price' => 86000,
                'notification_count' => 3,
                'expires_at' => $this->formatDateTime($clock->modify('+90 days')),
                'created_at' => $this->formatDateTime($clock->modify('-2 days +1 hour')),
                'updated_at' => $this->formatDateTime($clock->modify('-1 day')),
            ],
            [
                'key' => 'expired_target',
                'user_id' => $userIds['active_reader'],
                'book_id' => $bookIds['de-men-phieu-luu-ky'],
                'alert_type' => 'target_price',
                'status' => 'Expired',
                'target_price' => 70000,
                'baseline_price' => null,
                'baseline_pending' => 0,
                'comparison_price' => 76000,
                'last_notified_price' => 70000,
                'notification_count' => 1,
                'expires_at' => $this->formatDateTime($clock->modify('-6 days')),
                'created_at' => $this->formatDateTime($clock->modify('-8 days')),
                'updated_at' => $this->formatDateTime($clock->modify('-5 days')),
            ],
        ];

        $alertIds = [];
        foreach ($alerts as $alert) {
            $key = $alert['key'];
            unset($alert['key']);
            $this->db->table('price_alerts')->insert($alert);
            $alertIds[$key] = (int) $this->db->insertID();
        }

        $this->db->table('price_alert_events')->insertBatch([
            [
                'price_alert_id' => $alertIds['active_target'],
                'event_type' => 'notification_sent',
                'previous_status' => 'Active',
                'new_status' => 'Active',
                'summary_json' => json_encode(['price' => 199000], JSON_UNESCAPED_UNICODE),
                'created_at' => $this->formatDateTime($clock->modify('-1 day +1 hour')),
            ],
            [
                'price_alert_id' => $alertIds['auto_paused_lowest'],
                'event_type' => 'auto_paused',
                'previous_status' => 'Active',
                'new_status' => 'Auto-paused',
                'summary_json' => json_encode(['notification_count' => 3], JSON_UNESCAPED_UNICODE),
                'created_at' => $this->formatDateTime($clock->modify('-1 day +1 hour 15 minutes')),
            ],
            [
                'price_alert_id' => $alertIds['expired_target'],
                'event_type' => 'expired',
                'previous_status' => 'Active',
                'new_status' => 'Expired',
                'summary_json' => json_encode(['expired_at' => $this->formatDateTime($clock->modify('-6 days'))], JSON_UNESCAPED_UNICODE),
                'created_at' => $this->formatDateTime($clock->modify('-5 days')),
            ],
        ]);

        $this->db->table('user_alert_preferences')->insert([
            'user_id' => $userIds['suppressed_reader'],
            'alert_emails_enabled' => 0,
            'created_at' => $this->formatDateTime($clock->modify('-2 days +35 minutes')),
            'updated_at' => $this->formatDateTime($clock->modify('-2 days +35 minutes')),
        ]);

        $this->db->table('outbound_emails')->insertBatch([
            [
                'normalized_recipient_email' => 'active-reader@dealsach.test',
                'display_recipient_email' => 'active-reader@dealsach.test',
                'email_type' => 'price_alert_target_price',
                'subject' => 'DealSach: giá mục tiêu đã chạm',
                'body_text' => 'Ưu đãi hiện tại đã đạt mức giá mục tiêu.',
                'metadata_json' => json_encode(['alert_id' => $alertIds['active_target']], JSON_UNESCAPED_UNICODE),
                'status' => 'sent',
                'created_at' => $this->formatDateTime($clock->modify('-1 day +1 hour')),
                'updated_at' => $this->formatDateTime($clock->modify('-1 day +1 hour')),
            ],
            [
                'normalized_recipient_email' => 'active-reader@dealsach.test',
                'display_recipient_email' => 'active-reader@dealsach.test',
                'email_type' => 'price_alert_new_lowest',
                'subject' => 'DealSach: phát hiện giá thấp mới',
                'body_text' => 'Đã ghi nhận giá thấp mới cho sách bạn theo dõi.',
                'metadata_json' => json_encode(['alert_id' => $alertIds['auto_paused_lowest']], JSON_UNESCAPED_UNICODE),
                'status' => 'failed',
                'created_at' => $this->formatDateTime($clock->modify('-1 day +1 hour 10 minutes')),
                'updated_at' => $this->formatDateTime($clock->modify('-1 day +1 hour 10 minutes')),
            ],
        ]);
        $sentEmailId = (int) $this->db->table('outbound_emails')
            ->select('id')
            ->where('email_type', 'price_alert_target_price')
            ->orderBy('id', 'DESC')
            ->get()
            ->getFirstRow()
            ->id;

        $this->db->table('email_deal_links')->insert([
            'price_alert_id' => $alertIds['active_target'],
            'outbound_email_id' => $sentEmailId,
            'book_id' => $bookIds['clean-code'],
            'token_hash' => hash('sha256', 'seed-email-link-clean-code'),
            'landing_path' => '/book/' . $bookIds['clean-code'],
            'created_at' => $this->formatDateTime($clock->modify('-1 day +1 hour')),
            'updated_at' => $this->formatDateTime($clock->modify('-1 day +1 hour')),
        ]);
        $emailLinkId = (int) $this->db->insertID();

        $this->db->table('email_deal_link_clicks')->insert([
            'email_deal_link_id' => $emailLinkId,
            'price_alert_id' => $alertIds['active_target'],
            'book_id' => $bookIds['clean-code'],
            'clicked_at' => $this->formatDateTime($clock->modify('-1 day +1 hour 5 minutes')),
            'ip_address' => '127.0.0.1',
            'user_agent' => 'DealSach Seeder',
            'created_at' => $this->formatDateTime($clock->modify('-1 day +1 hour 5 minutes')),
            'updated_at' => $this->formatDateTime($clock->modify('-1 day +1 hour 5 minutes')),
        ]);

        $this->db->table('admin_audit_logs')->insertBatch([
            [
                'admin_user_id' => $userIds['admin'],
                'actor_email' => '24521102@gm.uit.edu.vn',
                'action_type' => 'book_updated',
                'entity_type' => 'book',
                'entity_id' => (string) $bookIds['clean-code'],
                'summary' => 'Cập nhật metadata hiển thị sách demo.',
                'before_json' => null,
                'after_json' => json_encode(['display_label' => 'Công nghệ'], JSON_UNESCAPED_UNICODE),
                'created_at' => $this->formatDateTime($clock->modify('-1 day -15 minutes')),
            ],
            [
                'admin_user_id' => $userIds['admin'],
                'actor_email' => '24521102@gm.uit.edu.vn',
                'action_type' => 'offer_updated',
                'entity_type' => 'offer',
                'entity_id' => (string) $offerIds['b3_tiki'],
                'summary' => 'Rà soát lại trạng thái ưu đãi dashboard demo.',
                'before_json' => null,
                'after_json' => json_encode(['status' => 'active'], JSON_UNESCAPED_UNICODE),
                'created_at' => $this->formatDateTime($clock->modify('-1 day +2 hours 20 minutes')),
            ],
        ]);
    }

    /**
     * @return array<string, int>
     */
    private function seedCategories(string $now): array
    {
        $rows = [
            ['name' => 'Kinh tế', 'slug' => 'kinh-te', 'display_label' => 'Kinh tế & tài chính', 'display_description' => 'Sách về kinh tế, đầu tư và quản trị tài chính cá nhân.', 'display_order' => 20, 'status' => 'active'],
            ['name' => 'Văn học Việt Nam', 'slug' => 'van-hoc-viet-nam', 'display_label' => 'Văn học Việt Nam', 'display_description' => 'Tác phẩm văn học Việt Nam được theo dõi giá tham khảo.', 'display_order' => 30, 'status' => 'active'],
            ['name' => 'Kỹ năng sống', 'slug' => 'ky-nang-song', 'display_label' => 'Kỹ năng sống', 'display_description' => 'Sách phát triển bản thân và kỹ năng ứng dụng hằng ngày.', 'display_order' => 10, 'status' => 'active'],
            ['name' => 'Thiếu nhi', 'slug' => 'thieu-nhi', 'display_label' => 'Sách thiếu nhi', 'display_description' => 'Sách dành cho thiếu nhi và gia đình.', 'display_order' => 40, 'status' => 'active'],
            ['name' => 'Công nghệ', 'slug' => 'cong-nghe', 'display_label' => 'Công nghệ & lập trình', 'display_description' => 'Sách công nghệ, lập trình và kỹ thuật phần mềm.', 'display_order' => 50, 'status' => 'active'],
            ['name' => 'Lịch sử', 'slug' => 'lich-su', 'display_label' => 'Lịch sử', 'display_description' => 'Sách lịch sử Việt Nam và thế giới.', 'display_order' => 60, 'status' => 'active'],
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
                'release_date' => '2018-05-01',
                'page_count' => 268,
                'dimensions' => '13x20.5 cm',
                'format' => 'Bìa mềm',
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
                'release_date' => '2019-06-10',
                'page_count' => 285,
                'dimensions' => '14x20.5 cm',
                'format' => 'Bìa mềm',
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
                'release_date' => '2020-04-20',
                'page_count' => 228,
                'dimensions' => '13x20 cm',
                'format' => 'Bìa mềm',
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
                'release_date' => '2017-08-15',
                'page_count' => 320,
                'dimensions' => '14x20.5 cm',
                'format' => 'Bìa mềm',
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
                'release_date' => '2021-11-03',
                'page_count' => 378,
                'dimensions' => '14.5x20.5 cm',
                'format' => 'Bìa mềm',
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
                'release_date' => '2020-12-01',
                'page_count' => 300,
                'dimensions' => '13x20.5 cm',
                'format' => 'Bìa mềm',
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
                'release_date' => null,
                'page_count' => null,
                'dimensions' => null,
                'format' => null,
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
                'release_date' => '2022-03-08',
                'page_count' => 336,
                'dimensions' => '14x20.5 cm',
                'format' => 'Bìa mềm',
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
                'release_date' => '2023-01-12',
                'page_count' => 464,
                'dimensions' => '16x24 cm',
                'format' => 'Bìa mềm',
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
                'release_date' => '2021-09-15',
                'page_count' => 352,
                'dimensions' => '16x24 cm',
                'format' => 'Bìa cứng',
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
                'release_date' => '2016-05-20',
                'page_count' => 192,
                'dimensions' => '13x19 cm',
                'format' => 'Bìa mềm',
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
                'release_date' => '2018-10-10',
                'page_count' => 420,
                'dimensions' => '16x24 cm',
                'format' => 'Bìa cứng',
                'primary_category_id' => $categoryIds['lich-su'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b13',
                'title' => 'Kỹ năng giao tiếp thông minh',
                'author' => 'Lê Minh Anh',
                'publisher' => 'NXB Thanh Niên',
                'isbn' => '9786041000013',
                'description' => 'Phương pháp giao tiếp rõ ràng và hiệu quả trong công việc.',
                'cover_image' => '/demo/covers/ky-nang-giao-tiep-thong-minh.jpg',
                'release_date' => '2021-03-14',
                'page_count' => 264,
                'dimensions' => '14x20.5 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['ky-nang-song'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b14',
                'title' => 'Quản lý thời gian cho người bận rộn',
                'author' => 'Phạm Quốc Bảo',
                'publisher' => 'NXB Lao Động',
                'isbn' => '9786041000014',
                'description' => 'Cách lập kế hoạch và ưu tiên công việc theo mục tiêu.',
                'cover_image' => '/demo/covers/quan-ly-thoi-gian-nguoi-ban-ron.jpg',
                'release_date' => '2020-07-05',
                'page_count' => 240,
                'dimensions' => '13x20.5 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['ky-nang-song'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b15',
                'title' => 'Làm chủ cảm xúc trong 30 ngày',
                'author' => 'Nguyễn Thu Hà',
                'publisher' => 'NXB Trẻ',
                'isbn' => '9786041000015',
                'description' => 'Bài tập thực hành giúp duy trì sự bình tĩnh và tập trung.',
                'cover_image' => '/demo/covers/lam-chu-cam-xuc-30-ngay.jpg',
                'release_date' => '2022-11-20',
                'page_count' => 288,
                'dimensions' => '14x20 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['ky-nang-song'],
                'is_featured' => 0,
                'status' => 'active',
            ],
            [
                'key' => 'b16',
                'title' => 'Cho tôi xin một vé đi tuổi thơ',
                'author' => 'Nguyễn Nhật Ánh',
                'publisher' => 'NXB Trẻ',
                'isbn' => '9786041000016',
                'description' => 'Tản văn nhẹ nhàng về ký ức tuổi thơ và gia đình.',
                'cover_image' => '/demo/covers/cho-toi-xin-ve-di-tuoi-tho.jpg',
                'release_date' => '2019-09-10',
                'page_count' => 220,
                'dimensions' => '13x20.5 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['van-hoc-viet-nam'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b17',
                'title' => 'Tắt đèn',
                'author' => 'Ngô Tất Tố',
                'publisher' => 'NXB Văn Học',
                'isbn' => '9786041000017',
                'description' => 'Tác phẩm hiện thực phản ánh đời sống nông thôn Việt Nam.',
                'cover_image' => '/demo/covers/tat-den.jpg',
                'release_date' => '2018-01-22',
                'page_count' => 312,
                'dimensions' => '14x20.5 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['van-hoc-viet-nam'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b18',
                'title' => 'Số đỏ',
                'author' => 'Vũ Trọng Phụng',
                'publisher' => 'NXB Hội Nhà Văn',
                'isbn' => '9786041000018',
                'description' => 'Tiểu thuyết châm biếm nổi bật của văn học Việt Nam hiện đại.',
                'cover_image' => '/demo/covers/so-do.jpg',
                'release_date' => '2020-06-30',
                'page_count' => 336,
                'dimensions' => '14x20 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['van-hoc-viet-nam'],
                'is_featured' => 0,
                'status' => 'active',
            ],
            [
                'key' => 'b19',
                'title' => 'Người giàu có nhất thành Babylon',
                'author' => 'George S. Clason',
                'publisher' => 'NXB Lao Động',
                'isbn' => '9786041000019',
                'description' => 'Nguyên tắc tài chính cá nhân được kể qua những câu chuyện ngắn.',
                'cover_image' => '/demo/covers/nguoi-giau-co-nhat-thanh-babylon.jpg',
                'release_date' => '2021-04-18',
                'page_count' => 232,
                'dimensions' => '13.5x20.5 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['kinh-te'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b20',
                'title' => 'Dạy con làm giàu tập 2',
                'author' => 'Robert T. Kiyosaki',
                'publisher' => 'NXB Trẻ',
                'isbn' => '9786041000020',
                'description' => 'Bổ sung tư duy quản trị tiền bạc và đầu tư dài hạn.',
                'cover_image' => '/demo/covers/day-con-lam-giau-tap-2.jpg',
                'release_date' => '2022-02-12',
                'page_count' => 280,
                'dimensions' => '14x20.5 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['kinh-te'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b21',
                'title' => 'Tư duy nhanh và chậm',
                'author' => 'Daniel Kahneman',
                'publisher' => 'NXB Thế Giới',
                'isbn' => '9786041000021',
                'description' => 'Góc nhìn hành vi tài chính và ra quyết định của con người.',
                'cover_image' => '/demo/covers/tu-duy-nhanh-va-cham.jpg',
                'release_date' => '2023-03-03',
                'page_count' => 512,
                'dimensions' => '16x24 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['kinh-te'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b22',
                'title' => 'Kinh tế học hài hước',
                'author' => 'Steven D. Levitt',
                'publisher' => 'NXB Trẻ',
                'isbn' => '9786041000022',
                'description' => 'Các tình huống đời sống được phân tích qua lăng kính kinh tế học.',
                'cover_image' => '/demo/covers/kinh-te-hoc-hai-huoc.jpg',
                'release_date' => '2019-12-20',
                'page_count' => 296,
                'dimensions' => '14x20.5 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['kinh-te'],
                'is_featured' => 0,
                'status' => 'active',
            ],
            [
                'key' => 'b23',
                'title' => 'Design Patterns trong thực chiến',
                'author' => 'Trần Minh Phúc',
                'publisher' => 'NXB Công Thương',
                'isbn' => '9786041000023',
                'description' => 'Ứng dụng các mẫu thiết kế phổ biến vào dự án thực tế.',
                'cover_image' => '/demo/covers/design-patterns-thuc-chien.jpg',
                'release_date' => '2021-08-08',
                'page_count' => 420,
                'dimensions' => '16x24 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['cong-nghe'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b24',
                'title' => 'Refactoring hiện đại',
                'author' => 'Nguyễn Hoàng Long',
                'publisher' => 'NXB Dân Trí',
                'isbn' => '9786041000024',
                'description' => 'Kỹ thuật cải tiến mã nguồn an toàn và có kiểm thử.',
                'cover_image' => '/demo/covers/refactoring-hien-dai.jpg',
                'release_date' => '2022-05-17',
                'page_count' => 388,
                'dimensions' => '16x24 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['cong-nghe'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b25',
                'title' => 'System Design căn bản',
                'author' => 'Lê Việt Dũng',
                'publisher' => 'NXB Thông Tin',
                'isbn' => '9786041000025',
                'description' => 'Nền tảng thiết kế hệ thống cho web và dịch vụ phân tán.',
                'cover_image' => '/demo/covers/system-design-can-ban.jpg',
                'release_date' => '2023-10-01',
                'page_count' => 360,
                'dimensions' => '16x24 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['cong-nghe'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b26',
                'title' => 'You Don\'t Know JS bản dịch',
                'author' => 'Kyle Simpson',
                'publisher' => 'NXB Công Thương',
                'isbn' => '9786041000026',
                'description' => 'Giải thích sâu về cơ chế JavaScript cho lập trình viên web.',
                'cover_image' => '/demo/covers/you-dont-know-js-ban-dich.jpg',
                'release_date' => '2020-10-25',
                'page_count' => 344,
                'dimensions' => '16x24 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['cong-nghe'],
                'is_featured' => 0,
                'status' => 'active',
            ],
            [
                'key' => 'b27',
                'title' => 'Những tấm lòng cao cả',
                'author' => 'Edmondo De Amicis',
                'publisher' => 'NXB Kim Đồng',
                'isbn' => '9786041000027',
                'description' => 'Những bài học tử tế và lòng nhân ái dành cho thiếu nhi.',
                'cover_image' => '/demo/covers/nhung-tam-long-cao-ca.jpg',
                'release_date' => '2017-09-09',
                'page_count' => 280,
                'dimensions' => '13x19 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['thieu-nhi'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b28',
                'title' => 'Hoàng tử bé',
                'author' => 'Antoine de Saint-Exupéry',
                'publisher' => 'NXB Trẻ',
                'isbn' => '9786041000028',
                'description' => 'Tác phẩm giàu tưởng tượng dành cho cả thiếu nhi và người lớn.',
                'cover_image' => '/demo/covers/hoang-tu-be.jpg',
                'release_date' => '2018-12-11',
                'page_count' => 168,
                'dimensions' => '13x19 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['thieu-nhi'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b29',
                'title' => 'Không gia đình',
                'author' => 'Hector Malot',
                'publisher' => 'NXB Kim Đồng',
                'isbn' => '9786041000029',
                'description' => 'Hành trình trưởng thành và nghị lực sống của cậu bé Rémi.',
                'cover_image' => '/demo/covers/khong-gia-dinh.jpg',
                'release_date' => '2019-04-01',
                'page_count' => 456,
                'dimensions' => '14x20.5 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['thieu-nhi'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b30',
                'title' => 'Chuyện con mèo dạy hải âu bay',
                'author' => 'Luis Sepúlveda',
                'publisher' => 'NXB Trẻ',
                'isbn' => '9786041000030',
                'description' => 'Câu chuyện ngắn về tình bạn và lòng dũng cảm.',
                'cover_image' => '/demo/covers/chuyen-con-meo-day-hai-au-bay.jpg',
                'release_date' => '2020-01-20',
                'page_count' => 152,
                'dimensions' => '13x20 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['thieu-nhi'],
                'is_featured' => 0,
                'status' => 'active',
            ],
            [
                'key' => 'b31',
                'title' => 'Totto-chan bên cửa sổ',
                'author' => 'Tetsuko Kuroyanagi',
                'publisher' => 'NXB Kim Đồng',
                'isbn' => '9786041000031',
                'description' => 'Góc nhìn hồn nhiên về giáo dục và tuổi thơ.',
                'cover_image' => '/demo/covers/totto-chan-ben-cua-so.jpg',
                'release_date' => '2016-11-11',
                'page_count' => 256,
                'dimensions' => '13x19 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['thieu-nhi'],
                'is_featured' => 0,
                'status' => 'active',
            ],
            [
                'key' => 'b32',
                'title' => 'Lịch sử thế giới cận đại',
                'author' => 'Nguyễn Quốc Hưng',
                'publisher' => 'NXB Giáo Dục',
                'isbn' => '9786041000032',
                'description' => 'Tổng quan các biến động lớn của thế giới cận đại.',
                'cover_image' => '/demo/covers/lich-su-the-gioi-can-dai.jpg',
                'release_date' => '2021-06-06',
                'page_count' => 392,
                'dimensions' => '16x24 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['lich-su'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b33',
                'title' => 'Việt sử bằng tranh',
                'author' => 'Nhiều tác giả',
                'publisher' => 'NXB Trẻ',
                'isbn' => '9786041000033',
                'description' => 'Lịch sử Việt Nam trình bày ngắn gọn với minh họa trực quan.',
                'cover_image' => '/demo/covers/viet-su-bang-tranh.jpg',
                'release_date' => '2019-05-15',
                'page_count' => 240,
                'dimensions' => '16x24 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['lich-su'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b34',
                'title' => 'Sapiens lược sử loài người',
                'author' => 'Yuval Noah Harari',
                'publisher' => 'NXB Thế Giới',
                'isbn' => '9786041000034',
                'description' => 'Lược sử phát triển của loài người từ góc nhìn liên ngành.',
                'cover_image' => '/demo/covers/sapiens-luoc-su-loai-nguoi.jpg',
                'release_date' => '2023-02-02',
                'page_count' => 540,
                'dimensions' => '16x24 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['lich-su'],
                'is_featured' => 1,
                'status' => 'active',
            ],
            [
                'key' => 'b35',
                'title' => 'Đại Việt sử ký toàn thư tuyển chọn',
                'author' => 'Ngô Sĩ Liên',
                'publisher' => 'NXB Văn Học',
                'isbn' => '9786041000035',
                'description' => 'Trích tuyển các giai đoạn quan trọng của sử Việt.',
                'cover_image' => '/demo/covers/dai-viet-su-ky-toan-thu-tuyen-chon.jpg',
                'release_date' => '2018-08-18',
                'page_count' => 468,
                'dimensions' => '16x24 cm',
                'format' => 'Bìa cứng',
                'primary_category_id' => $categoryIds['lich-su'],
                'is_featured' => 0,
                'status' => 'active',
            ],
            [
                'key' => 'b36',
                'title' => 'Lịch sử văn minh nhân loại',
                'author' => 'Will Durant',
                'publisher' => 'NXB Tổng Hợp TP.HCM',
                'isbn' => '9786041000036',
                'description' => 'Khái quát các nền văn minh lớn qua từng thời kỳ.',
                'cover_image' => '/demo/covers/lich-su-van-minh-nhan-loai.jpg',
                'release_date' => '2020-03-28',
                'page_count' => 520,
                'dimensions' => '16x24 cm',
                'format' => 'Bìa mềm',
                'primary_category_id' => $categoryIds['lich-su'],
                'is_featured' => 0,
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

        $bookTitleMap = [
            'b13' => 'Kỹ năng giao tiếp thông minh',
            'b14' => 'Quản lý thời gian cho người bận rộn',
            'b15' => 'Làm chủ cảm xúc trong 30 ngày',
            'b16' => 'Cho tôi xin một vé đi tuổi thơ',
            'b17' => 'Tắt đèn',
            'b18' => 'Số đỏ',
            'b19' => 'Người giàu có nhất thành Babylon',
            'b20' => 'Dạy con làm giàu tập 2',
            'b21' => 'Tư duy nhanh và chậm',
            'b22' => 'Kinh tế học hài hước',
            'b23' => 'Design Patterns trong thực chiến',
            'b24' => 'Refactoring hiện đại',
            'b25' => 'System Design căn bản',
            'b26' => 'You Don\'t Know JS bản dịch',
            'b27' => 'Những tấm lòng cao cả',
            'b28' => 'Hoàng tử bé',
            'b29' => 'Không gia đình',
            'b30' => 'Chuyện con mèo dạy hải âu bay',
            'b31' => 'Totto-chan bên cửa sổ',
            'b32' => 'Lịch sử thế giới cận đại',
            'b33' => 'Việt sử bằng tranh',
            'b34' => 'Sapiens lược sử loài người',
            'b35' => 'Đại Việt sử ký toàn thư tuyển chọn',
            'b36' => 'Lịch sử văn minh nhân loại',
        ];

        $offerTemplates = [
            ['suffix' => 'tiki', 'retailer' => 'tiki', 'merchant' => 'tiki-trading', 'domain' => 'tiki.vn'],
            ['suffix' => 'fahasa', 'retailer' => 'fahasa', 'merchant' => 'fahasa-official', 'domain' => 'fahasa.com'],
            ['suffix' => 'shopee', 'retailer' => 'shopee', 'merchant' => 'shop-sach-viet', 'domain' => 'shopee.vn'],
            ['suffix' => 'lazada', 'retailer' => 'lazada', 'merchant' => 'lazada-books', 'domain' => 'lazada.vn'],
        ];

        $fourOfferBooks = ['b13', 'b14', 'b15', 'b16', 'b17', 'b18', 'b19', 'b20', 'b21', 'b23', 'b24', 'b25', 'b27', 'b28', 'b29', 'b32', 'b33', 'b34'];
        $twoOfferBooks = ['b22', 'b26', 'b30', 'b31', 'b35', 'b36'];

        foreach ($fourOfferBooks as $bookKey) {
            foreach ($offerTemplates as $template) {
                $rows[] = [
                    'key' => $bookKey . '_' . $template['suffix'],
                    'book' => $bookKey,
                    'retailer' => $template['retailer'],
                    'merchant' => $template['merchant'],
                    'title' => $bookTitleMap[$bookKey] . ' - ' . strtoupper($template['suffix']),
                    'url' => 'https://' . $template['domain'] . '/' . $bookKey . '-demo',
                    'destination' => 'valid',
                    'status' => 'active',
                ];
            }
        }

        foreach ($twoOfferBooks as $bookKey) {
            foreach (array_slice($offerTemplates, 0, 2) as $template) {
                $rows[] = [
                    'key' => $bookKey . '_' . $template['suffix'],
                    'book' => $bookKey,
                    'retailer' => $template['retailer'],
                    'merchant' => $template['merchant'],
                    'title' => $bookTitleMap[$bookKey] . ' - ' . strtoupper($template['suffix']),
                    'url' => 'https://' . $template['domain'] . '/' . $bookKey . '-demo',
                    'destination' => 'valid',
                    'status' => 'active',
                ];
            }
        }

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
    private function seedObservationCycles(DateTimeImmutable $clock, string $now): array
    {
        $start = $clock->setTime(0, 0, 0)->modify('-13 days');
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
    private function seedPriceObservations(array $offerIds, array $cycleIds, DateTimeImmutable $clock, string $now): void
    {
        $observedTime = $clock->format('H:i:s');
        $series = [
            'b1_tiki' => [132000, 132000, 129000, 129000, 125000, 125000, 122000, 119000, 119000, 116000, 112000, 112000, 109000, 109000],
            'b1_fahasa' => [128000, 128000, 126000, 126000, 124000, 121000, 121000, 119000, 117000, 115000, 113000, 111000, 111000, 107000],
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
            'b9_tiki' => [214000, 214000, 211000, 211000, 209000, 207000, 206000, 204000, 202000, 199000, 197000, 196000, 195000, 193000],
            'b11_tiki' => [76000, 76000, 75000, 75000, 74000, 74000, 73000, 73000, 72000, 71000, 70000, 70000, 69000, 69000],
            'b11_fahasa' => [79000, 78000, 77000, 77000, 76000, 75000, 74000, 74000, 73000, 72000, 71000, 70000, 69000, 69000],
            'b12_shopee' => [168000, 168000, 166000, 165000, 164000, 162000, 161000, 159000, 158000, 156000, 154000, 153000, 152000, 150000],
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
                    array_keys($cycleIds)[$index] . ' ' . $observedTime,
                    $price === null ? 'unavailable' : 'available',
                    $price,
                    $snapshot[$offerKey]['destination'] ?? 'valid',
                    $now,
                );
            }
        }

        $staleRows = [
            [
                'offer' => 'b7_tiki_stale',
                'cycle' => $clock->modify('-8 days')->format('Y-m-d'),
                'observed' => $clock->modify('-8 days')->format('Y-m-d H:i:s'),
                'price' => 126000,
            ],
            [
                'offer' => 'b8_fahasa_stale',
                'cycle' => $clock->modify('-7 days')->format('Y-m-d'),
                'observed' => $clock->modify('-7 days')->format('Y-m-d H:i:s'),
                'price' => 98000,
            ],
        ];

        foreach ($staleRows as $row) {
            $this->insertObservation($offerIds[$row['offer']], $cycleIds[$row['cycle']], $row['observed'], 'available', $row['price'], 'valid', $now);
        }

        $observedOfferKeys = array_fill_keys(array_keys($series), true);
        foreach ($staleRows as $row) {
            $observedOfferKeys[$row['offer']] = true;
        }

        $latestCycleDate = array_key_last($cycleIds);
        $latestCycleId = $cycleIds[$latestCycleDate];
        foreach ($offerIds as $offerKey => $offerId) {
            if (isset($observedOfferKeys[$offerKey])) {
                continue;
            }

            if (! preg_match('/^b(1[3-9]|2[0-9]|3[0-6])_/', $offerKey)) {
                continue;
            }

            $seed = crc32($offerKey);
            $price = 78000 + (($seed % 120) * 1000);
            $this->insertObservation($offerId, $latestCycleId, $latestCycleDate . ' ' . $observedTime, 'available', $price, 'valid', $now);
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
    private function seedBuyFlowEvents(array $offerIds, DateTimeImmutable $clock, string $now): void
    {
        $events = [
            ['offer' => 'b1_fahasa', 'at' => $clock->modify('-1 day')->setTime(10, 15, 0)->format('Y-m-d H:i:s')],
            ['offer' => 'b1_fahasa', 'at' => $clock->modify('-1 day')->setTime(11, 20, 0)->format('Y-m-d H:i:s')],
            ['offer' => 'b1_tiki', 'at' => $clock->modify('-2 days')->setTime(14, 10, 0)->format('Y-m-d H:i:s')],
            ['offer' => 'b2_lazada', 'at' => $clock->modify('-1 day')->setTime(9, 0, 0)->format('Y-m-d H:i:s')],
            ['offer' => 'b2_lazada', 'at' => $clock->modify('-2 days')->setTime(9, 0, 0)->format('Y-m-d H:i:s')],
            ['offer' => 'b3_tiki', 'at' => $clock->modify('-1 day')->setTime(16, 30, 0)->format('Y-m-d H:i:s')],
            ['offer' => 'b3_tiki', 'at' => $clock->modify('-10 days')->setTime(8, 0, 0)->format('Y-m-d H:i:s')],
            ['offer' => 'b5_tiki', 'at' => $clock->modify('-1 day')->setTime(13, 45, 0)->format('Y-m-d H:i:s')],
            ['offer' => 'b8_shopee', 'at' => $clock->modify('-2 days')->setTime(18, 5, 0)->format('Y-m-d H:i:s')],
            ['offer' => 'b11_tiki', 'at' => $clock->modify('-1 day')->setTime(19, 15, 0)->format('Y-m-d H:i:s')],
            ['offer' => 'b12_shopee', 'at' => $clock->modify('-3 days')->setTime(20, 30, 0)->format('Y-m-d H:i:s')],
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
        $invalidEventAt = $clock->modify('-1 day')->setTime(17, 0, 0)->format('Y-m-d H:i:s');
        $this->db->table('buy_attempts')->insert($this->eventPayload($invalidOffer, $invalidEventAt, $now) + [
            'event_type' => 'buy_attempt',
            'attempt_status' => 'recorded',
        ]);
        $this->db->table('redirect_failures')->insert($this->eventPayload($invalidOffer, $invalidEventAt, $now) + [
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

    private function nowInVietnam(): DateTimeImmutable
    {
        return new DateTimeImmutable('now', new DateTimeZone('Asia/Ho_Chi_Minh'));
    }

    private function formatDateTime(DateTimeImmutable $time): string
    {
        return $time->format('Y-m-d H:i:s');
    }
}
