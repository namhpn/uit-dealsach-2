<?php

namespace App\Libraries;

use App\Models\AlertDisableTokenModel;
use App\Models\EmailDealLinkClickModel;
use App\Models\EmailDealLinkModel;
use App\Models\OutboundEmailModel;
use App\Models\PriceAlertEventModel;
use App\Models\PriceAlertModel;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Database\ConnectionInterface;
use CodeIgniter\I18n\Time;
use Config\Database;
use DateTimeImmutable;
use DateTimeZone;

class AlertNotificationService
{
    private const TARGET_PRICE = 'target_price';
    private const NEW_LOWEST = 'new_lowest_price';
    private const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

    private BaseConnection $db;
    private PublicCatalogService $catalog;
    private AlertPreferenceService $preferences;
    private PriceAlertModel $alerts;
    private PriceAlertEventModel $events;
    private OutboundEmailModel $emails;
    private EmailDealLinkModel $dealLinks;
    private EmailDealLinkClickModel $dealClicks;
    private AlertDisableTokenModel $disableTokens;
    private DateTimeImmutable $now;

    /**
     * @param ConnectionInterface&BaseConnection|null $db
     */
    public function __construct(?ConnectionInterface $db = null, ?DateTimeImmutable $now = null)
    {
        $this->db = $db ?? Database::connect();
        $this->now = $now ?? new DateTimeImmutable(Time::now(self::VIETNAM_TIMEZONE)->toDateTimeString(), new DateTimeZone(self::VIETNAM_TIMEZONE));
        $this->catalog = new PublicCatalogService($this->db, $this->now);
        $this->preferences = new AlertPreferenceService();
        $this->alerts = new PriceAlertModel();
        $this->events = new PriceAlertEventModel();
        $this->emails = new OutboundEmailModel();
        $this->dealLinks = new EmailDealLinkModel();
        $this->dealClicks = new EmailDealLinkClickModel();
        $this->disableTokens = new AlertDisableTokenModel();
    }

    /**
     * @return array<string, int>
     */
    public function evaluate(): array
    {
        $summary = [
            'evaluated' => 0,
            'triggered' => 0,
            'emailed' => 0,
            'suppressed' => 0,
            'failed' => 0,
            'baseline_set' => 0,
            'expired' => 0,
            'auto_paused' => 0,
        ];

        $this->expireAlerts($summary);

        $rows = $this->db->table('price_alerts pa')
            ->select('pa.*, u.normalized_email, u.display_email, u.status AS user_status, b.title AS book_title, b.status AS book_status')
            ->join('users u', 'u.id = pa.user_id')
            ->join('books b', 'b.id = pa.book_id')
            ->where('pa.status', 'Active')
            ->orderBy('pa.id', 'ASC')
            ->get()
            ->getResult();

        foreach ($rows as $alert) {
            if ($alert->user_status !== 'active' || $alert->book_status !== 'active') {
                continue;
            }

            $offers = $this->catalog->currentEligibleOffersForBook((int) $alert->book_id);
            if ($offers === []) {
                continue;
            }

            $currentPrice = (int) $offers[0]['price'];
            $tiedOffers = array_values(array_filter($offers, static fn (array $offer): bool => (int) $offer['price'] === $currentPrice));
            $preferenceEnabled = $this->preferences->getForUser((int) $alert->user_id)['alert_emails_enabled'];
            $decision = $this->decision($alert, $currentPrice);

            if ($decision['baseline_set']) {
                $this->alerts->update((int) $alert->id, [
                    'baseline_price' => $currentPrice,
                    'baseline_pending' => 0,
                ]);
                $this->recordEvent((int) $alert->id, 'baseline_set', 'Active', 'Active', ['baseline_price' => $currentPrice]);
                $summary['baseline_set']++;
                continue;
            }

            if (! $decision['trigger']) {
                if (array_key_exists('comparison_price', $decision) && $decision['comparison_price'] !== null && $decision['comparison_price'] !== $this->nullableInt($alert->comparison_price)) {
                    $this->alerts->update((int) $alert->id, ['comparison_price' => $decision['comparison_price']]);
                }
                continue;
            }

            if (! $preferenceEnabled) {
                $updates = [];
                if ($alert->alert_type === self::TARGET_PRICE) {
                    $updates['comparison_price'] = $currentPrice;
                } else {
                    $updates['baseline_price'] = $currentPrice;
                    $updates['baseline_pending'] = 0;
                }
                $this->alerts->update((int) $alert->id, $updates);
                $summary['suppressed']++;
                continue;
            }

            $summary['evaluated']++;
            $summary['triggered']++;
            $this->recordEvent((int) $alert->id, 'triggered', 'Active', 'Active', [
                'price' => $currentPrice,
                'alert_type' => $alert->alert_type,
            ]);

            $sent = $this->attemptEmailWithRetry($alert, $currentPrice, $tiedOffers, $summary);
            if (! $sent) {
                continue;
            }

            $nextCount = (int) $alert->notification_count + 1;
            $updates = [
                'last_notified_price' => $currentPrice,
                'notification_count' => $nextCount,
            ];
            if ($alert->alert_type === self::TARGET_PRICE) {
                $updates['comparison_price'] = $currentPrice;
            } else {
                $updates['baseline_price'] = $currentPrice;
                $updates['baseline_pending'] = 0;
            }
            if ($nextCount >= 3) {
                $updates['status'] = 'Auto-paused';
            }

            $this->alerts->update((int) $alert->id, $updates);
            $this->recordEvent((int) $alert->id, 'email_sent', 'Active', $updates['status'] ?? 'Active', [
                'price' => $currentPrice,
                'notification_count' => $nextCount,
            ]);
            if (($updates['status'] ?? null) === 'Auto-paused') {
                $this->recordEvent((int) $alert->id, 'auto_paused', 'Active', 'Auto-paused', ['notification_count' => $nextCount]);
                $summary['auto_paused']++;
            }
        }

        return $summary;
    }

    /**
     * @return array{statusCode: int, message: string, redirect?: string}
     */
    public function recordDealLinkClick(string $token, ?string $ipAddress, ?string $userAgent): array
    {
        $link = $this->dealLinks->where('token_hash', $this->hash($token))->first();
        if ($link === null) {
            return ['statusCode' => 404, 'message' => 'Liên kết email không hợp lệ hoặc đã hết hiệu lực.'];
        }

        $this->dealClicks->insert([
            'email_deal_link_id' => (int) $link->id,
            'price_alert_id' => (int) $link->price_alert_id,
            'book_id' => (int) $link->book_id,
            'clicked_at' => $this->now->format('Y-m-d H:i:s'),
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent === null ? null : mb_substr($userAgent, 0, 255),
        ]);

        return ['statusCode' => 302, 'message' => 'Đã ghi nhận lượt mở liên kết email.', 'redirect' => (string) $link->landing_path];
    }

    /**
     * @return array{statusCode: int, message: string}
     */
    public function disableByToken(string $token): array
    {
        $row = $this->disableTokens->where('token_hash', $this->hash($token))->first();
        if ($row === null) {
            return ['statusCode' => 404, 'message' => 'Liên kết tắt cảnh báo không hợp lệ.'];
        }

        $alert = $this->alerts->find((int) $row->price_alert_id);
        if ($alert === null) {
            return ['statusCode' => 404, 'message' => 'Không tìm thấy cảnh báo phù hợp.'];
        }

        if ($alert->status === 'Disabled') {
            return ['statusCode' => 200, 'message' => 'Cảnh báo này đã được tắt trước đó.'];
        }

        if ($row->used_at !== null) {
            return ['statusCode' => 410, 'message' => 'Liên kết tắt cảnh báo đã được sử dụng.'];
        }

        if ((string) $row->expires_at <= $this->now->format('Y-m-d H:i:s')) {
            return ['statusCode' => 410, 'message' => 'Liên kết tắt cảnh báo đã hết hạn.'];
        }

        $this->db->transStart();
        $this->alerts->update((int) $alert->id, ['status' => 'Disabled']);
        $this->disableTokens->update((int) $row->id, ['used_at' => $this->now->format('Y-m-d H:i:s')]);
        $this->recordEvent((int) $alert->id, 'disabled_by_email_link', $alert->status, 'Disabled', ['disable_token_id' => (int) $row->id]);
        $this->db->transComplete();

        return ['statusCode' => 200, 'message' => 'Đã tắt cảnh báo giá này. Bạn có thể tạo cảnh báo mới từ trang chi tiết sách nếu cần.'];
    }

    /**
     * @return array{trigger: bool, baseline_set: bool, comparison_price?: int|null}
     */
    private function decision(object $alert, int $currentPrice): array
    {
        if ($alert->alert_type === self::TARGET_PRICE) {
            $target = $this->nullableInt($alert->target_price);
            if ($target === null) {
                return ['trigger' => false, 'baseline_set' => false];
            }

            $comparison = $this->nullableInt($alert->comparison_price);
            $lastNotified = $this->nullableInt($alert->last_notified_price);
            if ($comparison === null) {
                return ['trigger' => false, 'baseline_set' => false, 'comparison_price' => $currentPrice];
            }
            if ($currentPrice > $target) {
                return ['trigger' => false, 'baseline_set' => false, 'comparison_price' => $currentPrice];
            }
            if ($lastNotified !== null) {
                return ['trigger' => $currentPrice < $lastNotified, 'baseline_set' => false];
            }

            return ['trigger' => $currentPrice < $comparison, 'baseline_set' => false];
        }

        $baseline = $this->nullableInt($alert->baseline_price);
        $lastNotified = $this->nullableInt($alert->last_notified_price);
        if ((int) $alert->baseline_pending === 1 || $baseline === null) {
            return ['trigger' => false, 'baseline_set' => true];
        }

        $threshold = $lastNotified ?? $baseline;

        return ['trigger' => $currentPrice < $threshold, 'baseline_set' => false];
    }

    /**
     * @param list<array<string, mixed>> $tiedOffers
     * @param array<string, int>         $summary
     */
    private function attemptEmailWithRetry(object $alert, int $price, array $tiedOffers, array &$summary): bool
    {
        for ($attempt = 1; $attempt <= 2; $attempt++) {
            if ($attempt === 2) {
                $fresh = $this->alerts->find((int) $alert->id);
                if ($fresh === null || $fresh->status !== 'Active') {
                    return false;
                }
            }

            $emailId = $this->writeEmail($alert, $price, $tiedOffers, $attempt);
            $email = $this->emails->find($emailId);
            if ($email !== null && $email->status === 'queued') {
                $summary['emailed']++;

                return true;
            }

            $summary['failed']++;
            $this->recordEvent((int) $alert->id, 'email_failed', 'Active', 'Active', ['attempt' => $attempt, 'price' => $price]);
        }

        return false;
    }

    /**
     * @param list<array<string, mixed>> $tiedOffers
     */
    private function writeEmail(object $alert, int $price, array $tiedOffers, int $attempt): int
    {
        $dealToken = bin2hex(random_bytes(24));
        $disableToken = bin2hex(random_bytes(24));
        $landingPath = '/book/' . (int) $alert->book_id . '#offers';
        $dealLinkPath = '/email/deals/' . $dealToken;
        $disablePath = '/alerts/disable/' . $disableToken;
        $emailType = $alert->alert_type === self::TARGET_PRICE ? 'price_alert_target_price' : 'price_alert_new_lowest';
        $subject = $alert->alert_type === self::TARGET_PRICE
            ? 'DealSach: Sách đã xuống dưới giá bạn đặt'
            : 'DealSach: Sách vừa có giá thấp mới';
        $status = $this->shouldFailMockEmail($alert) ? 'failed' : 'queued';

        $this->db->transStart();
        $emailId = (int) $this->emails->insert([
            'normalized_recipient_email' => (string) $alert->normalized_email,
            'display_recipient_email' => (string) $alert->display_email,
            'email_type' => $emailType,
            'subject' => $subject,
            'body_text' => $this->emailBody($alert, $price, $tiedOffers, $dealLinkPath, $disablePath),
            'metadata_json' => json_encode([
                'price_alert_id' => (int) $alert->id,
                'book_id' => (int) $alert->book_id,
                'observed_price' => $price,
                'target_price' => $this->nullableInt($alert->target_price),
                'baseline_price' => $this->nullableInt($alert->baseline_price),
                'attempt' => $attempt,
                'deal_link_path' => $dealLinkPath,
                'disable_link_path' => $disablePath,
            ], JSON_UNESCAPED_UNICODE),
            'status' => $status,
        ]);
        $this->dealLinks->insert([
            'price_alert_id' => (int) $alert->id,
            'outbound_email_id' => $emailId,
            'book_id' => (int) $alert->book_id,
            'token_hash' => $this->hash($dealToken),
            'landing_path' => $landingPath,
        ]);
        $this->disableTokens->insert([
            'price_alert_id' => (int) $alert->id,
            'token_hash' => $this->hash($disableToken),
            'expires_at' => $this->now->modify('+30 days')->format('Y-m-d H:i:s'),
        ]);
        $this->db->transComplete();

        return $emailId;
    }

    /**
     * @param list<array<string, mixed>> $tiedOffers
     */
    private function emailBody(object $alert, int $price, array $tiedOffers, string $dealLinkPath, string $disablePath): string
    {
        $lines = [
            'Xin chào,',
            'Sách "' . $alert->book_title . '" vừa có giá tham khảo ' . $this->formatVnd($price) . '.',
        ];

        if ($alert->alert_type === self::TARGET_PRICE) {
            $lines[] = 'Giá mục tiêu của bạn: ' . $this->formatVnd((int) $alert->target_price) . '.';
            if ($alert->last_notified_price !== null) {
                $lines[] = 'Giá đã thông báo gần nhất: ' . $this->formatVnd((int) $alert->last_notified_price) . '.';
            }
            if ($alert->comparison_price !== null) {
                $lines[] = 'Giá so sánh trước đó: ' . $this->formatVnd((int) $alert->comparison_price) . '.';
            }
        } else {
            $baseline = (int) $alert->baseline_price;
            $drop = max(0, $baseline - $price);
            $percent = $baseline > 0 ? round(($drop / $baseline) * 100, 1) : 0;
            $lines[] = 'Mốc giá trước đó: ' . $this->formatVnd($baseline) . '. Mức giảm: ' . $this->formatVnd($drop) . ' (' . $percent . '%).';
        }

        $options = array_slice($tiedOffers, 0, 3);
        if (count($options) > 1) {
            $lines[] = 'Các nơi bán cùng mức giá: ' . implode('; ', array_map(static fn (array $offer): string => $offer['retailer_name'] . ' - ' . $offer['merchant_name'], $options)) . '.';
        }

        $lines[] = 'Xem chi tiết tại DealSach: ' . $dealLinkPath;
        $lines[] = 'Tắt riêng cảnh báo này: ' . $disablePath;
        $lines[] = PublicCatalogService::PRICE_DISCLAIMER;
        $lines[] = PublicCatalogService::AFFILIATE_DISCLOSURE;
        $lines[] = 'DealSach không bán sách trực tiếp. Bạn cần bấm Mua tại DealSach nếu muốn sang nơi bán bên ngoài.';

        return implode("\n", $lines);
    }

    /**
     * @param array<string, int> $summary
     */
    private function expireAlerts(array &$summary): void
    {
        $rows = $this->alerts
            ->whereIn('status', ['Active', 'Paused', 'Auto-paused'])
            ->where('expires_at <=', $this->now->format('Y-m-d H:i:s'))
            ->findAll();

        foreach ($rows as $alert) {
            $this->alerts->update((int) $alert->id, ['status' => 'Expired']);
            $this->recordEvent((int) $alert->id, 'expired', $alert->status, 'Expired', ['expires_at' => $alert->expires_at]);
            $summary['expired']++;
        }
    }

    private function recordEvent(int $alertId, string $eventType, ?string $previousStatus, ?string $newStatus, array $summary): void
    {
        $this->events->insert([
            'price_alert_id' => $alertId,
            'event_type' => $eventType,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'summary_json' => json_encode($summary, JSON_UNESCAPED_UNICODE),
            'created_at' => $this->now->format('Y-m-d H:i:s'),
        ]);
    }

    private function shouldFailMockEmail(object $alert): bool
    {
        return str_contains((string) $alert->normalized_email, 'fail-alert');
    }

    private function nullableInt(mixed $value): ?int
    {
        return $value === null ? null : (int) $value;
    }

    private function hash(string $token): string
    {
        return hash('sha256', $token);
    }

    private function formatVnd(int $value): string
    {
        return number_format($value, 0, ',', '.') . ' ₫';
    }
}
