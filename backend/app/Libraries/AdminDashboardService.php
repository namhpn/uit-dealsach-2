<?php

namespace App\Libraries;

use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Database\ConnectionInterface;
use CodeIgniter\I18n\Time;
use Config\Database;
use DateTimeImmutable;
use DateTimeZone;

class AdminDashboardService
{
    private const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

    private BaseConnection $db;
    private PublicCatalogService $catalog;
    private DateTimeImmutable $now;

    /**
     * @param ConnectionInterface&BaseConnection|null $db
     */
    public function __construct(?ConnectionInterface $db = null, ?DateTimeImmutable $now = null)
    {
        $this->db = $db ?? Database::connect();
        $this->now = $now ?? new DateTimeImmutable(Time::now(self::VIETNAM_TIMEZONE)->toDateTimeString(), new DateTimeZone(self::VIETNAM_TIMEZONE));
        $this->catalog = new PublicCatalogService($this->db, $this->now);
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboard(): array
    {
        $window = $this->window();
        $summary = $this->summary($window);

        return [
            'window' => $window,
            'summary_cards' => [
                ['key' => 'affiliate_redirects', 'label' => 'Lượt chuyển tiếp Affiliate', 'value' => $summary['affiliate_redirects']],
                ['key' => 'email_deal_link_clicks', 'label' => 'Lượt mở liên kết email', 'value' => $summary['email_deal_link_clicks']],
                ['key' => 'redirect_failures', 'label' => 'Lỗi liên kết mua', 'value' => $summary['redirect_failures']],
                ['key' => 'active_alerts', 'label' => 'Cảnh báo Active', 'value' => $summary['active_alerts']],
                ['key' => 'evaluable_alerts', 'label' => 'Cảnh báo có thể đánh giá', 'value' => $summary['evaluable_alerts']],
                ['key' => 'email_suppressed_active_alerts', 'label' => 'Active bị tắt email', 'value' => $summary['email_suppressed_active_alerts']],
                ['key' => 'auto_paused_alerts', 'label' => 'Cảnh báo Auto-paused', 'value' => $summary['auto_paused_alerts']],
                ['key' => 'expired_alerts', 'label' => 'Cảnh báo Expired', 'value' => $summary['expired_alerts']],
                ['key' => 'alert_email_sent', 'label' => 'Email cảnh báo đã gửi', 'value' => $summary['alert_email_sent']],
                ['key' => 'alert_email_failed', 'label' => 'Email cảnh báo lỗi', 'value' => $summary['alert_email_failed']],
                ['key' => 'admin_mutations', 'label' => 'Thao tác Admin', 'value' => $summary['admin_mutations']],
            ],
            'affiliate_redirects' => [
                'total' => $summary['affiliate_redirects'],
                'by_book' => $this->affiliateRedirectsByBook($window),
                'by_retailer' => $this->affiliateRedirectsByRetailer($window),
            ],
            'email_engagement' => [
                'total' => $summary['email_deal_link_clicks'],
                'by_book_and_alert_type' => $this->emailClicksByBookAndAlertType($window),
            ],
            'redirect_failures' => [
                'total' => $summary['redirect_failures'],
                'by_reason' => $this->redirectFailuresByReason($window),
                'by_offer' => $this->redirectFailuresByOffer($window),
            ],
            'alerts' => [
                'status_counts' => $this->alertStatusCounts(),
                'evaluable_count' => $summary['evaluable_alerts'],
                'email_suppressed_active_count' => $summary['email_suppressed_active_alerts'],
                'email_sent_count' => $summary['alert_email_sent'],
                'email_failed_count' => $summary['alert_email_failed'],
            ],
            'price_changes' => [
                'items' => $this->priceChangeSummary(),
            ],
            'audit' => [
                'mutation_count' => $summary['admin_mutations'],
                'recent_entries' => $this->recentAuditEntries(),
            ],
        ];
    }

    /**
     * @return array{label: string, timezone: string, days: int, start: string, end: string}
     */
    private function window(): array
    {
        $start = $this->now->modify('-7 days')->setTime(0, 0, 0);

        return [
            'label' => '7 ngày gần đây',
            'timezone' => self::VIETNAM_TIMEZONE,
            'days' => 7,
            'start' => $start->format('Y-m-d H:i:s'),
            'end' => $this->now->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * @param array{start: string, end: string} $window
     *
     * @return array<string, int>
     */
    private function summary(array $window): array
    {
        return [
            'affiliate_redirects' => $this->countBetween('affiliate_redirects', 'event_at', $window),
            'email_deal_link_clicks' => $this->countBetween('email_deal_link_clicks', 'clicked_at', $window),
            'redirect_failures' => $this->countBetween('redirect_failures', 'event_at', $window),
            'active_alerts' => $this->countWhere('price_alerts', ['status' => 'Active']),
            'evaluable_alerts' => $this->evaluableAlertCount(),
            'email_suppressed_active_alerts' => $this->emailSuppressedActiveAlertCount(),
            'auto_paused_alerts' => $this->countWhere('price_alerts', ['status' => 'Auto-paused']),
            'expired_alerts' => $this->countWhere('price_alerts', ['status' => 'Expired']),
            'alert_email_sent' => $this->countAlertEmails(['queued', 'sent'], $window),
            'alert_email_failed' => $this->countAlertEmails(['failed'], $window),
            'admin_mutations' => $this->countBetween('admin_audit_logs', 'created_at', $window),
        ];
    }

    /**
     * @param array{start: string, end: string} $window
     */
    private function countBetween(string $table, string $field, array $window): int
    {
        return (int) $this->db->table($table)
            ->where($field . ' >=', $window['start'])
            ->where($field . ' <=', $window['end'])
            ->countAllResults();
    }

    private function countWhere(string $table, array $where): int
    {
        return (int) $this->db->table($table)->where($where)->countAllResults();
    }

    /**
     * @param array{start: string, end: string} $window
     */
    private function countAlertEmails(array $statuses, array $window): int
    {
        return (int) $this->db->table('outbound_emails')
            ->whereIn('email_type', ['price_alert_target_price', 'price_alert_new_lowest'])
            ->whereIn('status', $statuses)
            ->where('created_at >=', $window['start'])
            ->where('created_at <=', $window['end'])
            ->countAllResults();
    }

    private function evaluableAlertCount(): int
    {
        return (int) $this->db->table('price_alerts pa')
            ->join('users u', 'u.id = pa.user_id')
            ->join('books b', 'b.id = pa.book_id')
            ->where('pa.status', 'Active')
            ->where('u.status', 'active')
            ->where('b.status', 'active')
            ->where('pa.expires_at >', $this->now->format('Y-m-d H:i:s'))
            ->countAllResults();
    }

    private function emailSuppressedActiveAlertCount(): int
    {
        return (int) $this->db->table('price_alerts pa')
            ->join('users u', 'u.id = pa.user_id')
            ->where('pa.status', 'Active')
            ->where('u.alert_email_enabled', 0)
            ->countAllResults();
    }

    /**
     * @param array{start: string, end: string} $window
     *
     * @return list<array<string, mixed>>
     */
    private function affiliateRedirectsByBook(array $window): array
    {
        $rows = $this->db->table('affiliate_redirects ar')
            ->select('ar.book_id, b.title AS book_title, b.status AS book_status, COUNT(*) AS redirect_count')
            ->join('books b', 'b.id = ar.book_id')
            ->where('ar.event_at >=', $window['start'])
            ->where('ar.event_at <=', $window['end'])
            ->groupBy('ar.book_id, b.title, b.status')
            ->orderBy('redirect_count', 'DESC')
            ->orderBy('b.title', 'ASC')
            ->get()
            ->getResult();

        return array_map(static fn (object $row): array => [
            'book_id' => (int) $row->book_id,
            'book_title' => (string) $row->book_title,
            'archived' => $row->book_status === 'archived',
            'redirect_count' => (int) $row->redirect_count,
        ], $rows);
    }

    /**
     * @param array{start: string, end: string} $window
     *
     * @return list<array<string, mixed>>
     */
    private function affiliateRedirectsByRetailer(array $window): array
    {
        $rows = $this->db->table('affiliate_redirects ar')
            ->select('ar.retailer_platform_id, r.name AS retailer_name, r.status AS retailer_status, COUNT(*) AS redirect_count')
            ->join('retailer_platforms r', 'r.id = ar.retailer_platform_id')
            ->where('ar.event_at >=', $window['start'])
            ->where('ar.event_at <=', $window['end'])
            ->groupBy('ar.retailer_platform_id, r.name, r.status')
            ->orderBy('redirect_count', 'DESC')
            ->orderBy('r.name', 'ASC')
            ->get()
            ->getResult();

        return array_map(static fn (object $row): array => [
            'retailer_platform_id' => (int) $row->retailer_platform_id,
            'retailer_name' => (string) $row->retailer_name,
            'archived' => $row->retailer_status === 'archived',
            'redirect_count' => (int) $row->redirect_count,
        ], $rows);
    }

    /**
     * @param array{start: string, end: string} $window
     *
     * @return list<array<string, mixed>>
     */
    private function emailClicksByBookAndAlertType(array $window): array
    {
        $rows = $this->db->table('email_deal_link_clicks edlc')
            ->select('edlc.book_id, b.title AS book_title, b.status AS book_status, pa.alert_type, COUNT(*) AS click_count')
            ->join('books b', 'b.id = edlc.book_id')
            ->join('price_alerts pa', 'pa.id = edlc.price_alert_id')
            ->where('edlc.clicked_at >=', $window['start'])
            ->where('edlc.clicked_at <=', $window['end'])
            ->groupBy('edlc.book_id, b.title, b.status, pa.alert_type')
            ->orderBy('click_count', 'DESC')
            ->orderBy('b.title', 'ASC')
            ->get()
            ->getResult();

        return array_map(static fn (object $row): array => [
            'book_id' => (int) $row->book_id,
            'book_title' => (string) $row->book_title,
            'archived' => $row->book_status === 'archived',
            'alert_type' => (string) $row->alert_type,
            'click_count' => (int) $row->click_count,
        ], $rows);
    }

    /**
     * @param array{start: string, end: string} $window
     *
     * @return list<array<string, mixed>>
     */
    private function redirectFailuresByReason(array $window): array
    {
        $rows = $this->db->table('redirect_failures rf')
            ->select('rf.failure_reason, COUNT(*) AS failure_count')
            ->where('rf.event_at >=', $window['start'])
            ->where('rf.event_at <=', $window['end'])
            ->groupBy('rf.failure_reason')
            ->orderBy('failure_count', 'DESC')
            ->orderBy('rf.failure_reason', 'ASC')
            ->get()
            ->getResult();

        return array_map(static fn (object $row): array => [
            'failure_reason' => (string) $row->failure_reason,
            'failure_count' => (int) $row->failure_count,
        ], $rows);
    }

    /**
     * @param array{start: string, end: string} $window
     *
     * @return list<array<string, mixed>>
     */
    private function redirectFailuresByOffer(array $window): array
    {
        $rows = $this->db->table('redirect_failures rf')
            ->select('rf.offer_id, rf.book_id, b.title AS book_title, b.status AS book_status, o.external_offer_title, o.status AS offer_status, COUNT(*) AS failure_count')
            ->join('books b', 'b.id = rf.book_id')
            ->join('offers o', 'o.id = rf.offer_id')
            ->where('rf.event_at >=', $window['start'])
            ->where('rf.event_at <=', $window['end'])
            ->groupBy('rf.offer_id, rf.book_id, b.title, b.status, o.external_offer_title, o.status')
            ->orderBy('failure_count', 'DESC')
            ->orderBy('b.title', 'ASC')
            ->get()
            ->getResult();

        return array_map(static fn (object $row): array => [
            'offer_id' => (int) $row->offer_id,
            'book_id' => (int) $row->book_id,
            'book_title' => (string) $row->book_title,
            'book_archived' => $row->book_status === 'archived',
            'offer_title' => (string) $row->external_offer_title,
            'offer_status' => (string) $row->offer_status,
            'failure_count' => (int) $row->failure_count,
        ], $rows);
    }

    /**
     * @return list<array{status: string, count: int}>
     */
    private function alertStatusCounts(): array
    {
        $rows = $this->db->table('price_alerts')
            ->select('status, COUNT(*) AS status_count')
            ->groupBy('status')
            ->orderBy('status', 'ASC')
            ->get()
            ->getResult();

        return array_map(static fn (object $row): array => [
            'status' => (string) $row->status,
            'count' => (int) $row->status_count,
        ], $rows);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function priceChangeSummary(): array
    {
        $rows = $this->db->table('books b')
            ->select('b.id AS book_id, b.title AS book_title, b.status AS book_status')
            ->orderBy('b.title', 'ASC')
            ->get()
            ->getResult();

        $items = [];
        foreach ($rows as $book) {
            $series = $this->currentEligibleBookPriceSeries((int) $book->book_id);
            $latest = $series[count($series) - 1] ?? null;
            $previous = $series[count($series) - 2] ?? null;

            $items[] = [
                'book_id' => (int) $book->book_id,
                'book_title' => (string) $book->book_title,
                'archived' => $book->book_status === 'archived',
                'latest_price' => $latest['lowest_price'] ?? null,
                'previous_price' => $previous['lowest_price'] ?? null,
                'change_amount' => $latest !== null && $previous !== null ? (int) $latest['lowest_price'] - (int) $previous['lowest_price'] : null,
                'latest_observed_at' => $latest['observed_at'] ?? null,
                'previous_observed_at' => $previous['observed_at'] ?? null,
                'status' => $latest !== null && $previous !== null ? 'comparable' : 'not_enough_data',
            ];
        }

        usort($items, static function (array $a, array $b): int {
            if ($a['status'] !== $b['status']) {
                return $a['status'] === 'comparable' ? -1 : 1;
            }

            return strcmp($a['book_title'], $b['book_title']);
        });

        return $items;
    }

    /**
     * @return list<array{observed_at: string, lowest_price: int}>
     */
    private function currentEligibleBookPriceSeries(int $bookId): array
    {
        $offerIds = $this->currentEligibleOfferIds($bookId);
        if ($offerIds === []) {
            return [];
        }

        $rows = $this->db->table('price_observations po')
            ->select('po.observed_at, MIN(po.listed_item_price) AS lowest_price')
            ->whereIn('po.offer_id', $offerIds)
            ->where('po.availability_status', 'available')
            ->where('po.listed_item_price IS NOT NULL')
            ->groupBy('po.observed_at')
            ->orderBy('po.observed_at', 'ASC')
            ->get()
            ->getResult();

        return array_map(static fn (object $row): array => [
            'observed_at' => (string) $row->observed_at,
            'lowest_price' => (int) $row->lowest_price,
        ], $rows);
    }

    /**
     * @return list<int>
     */
    private function currentEligibleOfferIds(int $bookId): array
    {
        return array_map(static fn (array $offer): int => (int) $offer['offer_id'], $this->catalog->currentEligibleOffersForBook($bookId));
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function recentAuditEntries(): array
    {
        $rows = $this->db->table('admin_audit_logs')
            ->select('id, admin_user_id, actor_email, action_type, entity_type, entity_id, summary, created_at')
            ->orderBy('created_at', 'DESC')
            ->orderBy('id', 'DESC')
            ->limit(8)
            ->get()
            ->getResult();

        return array_map(static fn (object $row): array => [
            'id' => (int) $row->id,
            'admin_user_id' => $row->admin_user_id === null ? null : (int) $row->admin_user_id,
            'actor_email' => (string) $row->actor_email,
            'action_type' => (string) $row->action_type,
            'entity_type' => (string) $row->entity_type,
            'entity_id' => (string) $row->entity_id,
            'summary' => (string) $row->summary,
            'created_at' => (string) $row->created_at,
        ], $rows);
    }
}
