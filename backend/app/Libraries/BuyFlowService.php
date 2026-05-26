<?php

namespace App\Libraries;

use App\Models\AffiliateRedirectModel;
use App\Models\BuyAttemptModel;
use App\Models\RedirectFailureModel;
use CodeIgniter\I18n\Time;
use DateTimeImmutable;
use DateTimeZone;

class BuyFlowService
{
    private const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

    private PublicCatalogService $catalog;
    private BuyAttemptModel $buyAttempts;
    private AffiliateRedirectModel $affiliateRedirects;
    private RedirectFailureModel $redirectFailures;
    private DateTimeImmutable $now;

    public function __construct(?PublicCatalogService $catalog = null, ?DateTimeImmutable $now = null)
    {
        $this->now = $now ?? new DateTimeImmutable(Time::now(self::VIETNAM_TIMEZONE)->toDateTimeString(), new DateTimeZone(self::VIETNAM_TIMEZONE));
        $this->catalog = $catalog ?? new PublicCatalogService(null, $this->now);
        $this->buyAttempts = new BuyAttemptModel();
        $this->affiliateRedirects = new AffiliateRedirectModel();
        $this->redirectFailures = new RedirectFailureModel();
    }

    /**
     * @return array{status: 'not_found'|'failed'|'redirect', message: string, reason?: string, destination?: string}
     */
    public function handleOfferClick(int $offerId): array
    {
        $eligibility = $this->catalog->buyOfferEligibility($offerId);

        if ($eligibility === null) {
            return [
                'status' => 'not_found',
                'message' => 'Không tìm thấy ưu đãi phù hợp.',
                'reason' => 'offer_not_found',
            ];
        }

        $event = $this->eventPayload($eligibility);
        $this->buyAttempts->insert($event + [
            'event_type' => 'buy_attempt',
            'attempt_status' => 'recorded',
        ]);

        if (! $eligibility['eligible']) {
            $reason = $eligibility['reason'];
            $this->redirectFailures->insert($event + [
                'event_type' => 'redirect_failure',
                'failure_reason' => $reason,
            ]);

            return [
                'status' => 'failed',
                'message' => $this->failureMessage($reason),
                'reason' => $reason,
            ];
        }

        $this->affiliateRedirects->insert($event + [
            'event_type' => 'affiliate_redirect',
            'redirect_status' => 'redirected',
        ]);

        return [
            'status' => 'redirect',
            'message' => 'DealSach đang chuyển bạn đến nơi bán bên ngoài.',
            'destination' => $eligibility['destination'],
        ];
    }

    /**
     * @param array<string, mixed> $eligibility
     *
     * @return array<string, mixed>
     */
    private function eventPayload(array $eligibility): array
    {
        $destination = is_string($eligibility['destination'] ?? null) ? $eligibility['destination'] : null;
        $parts = $destination === null ? [] : (parse_url($destination) ?: []);
        $path = (string) ($parts['path'] ?? '');

        return [
            'offer_id' => $eligibility['offer_id'],
            'book_id' => $eligibility['book_id'],
            'retailer_platform_id' => $eligibility['retailer_platform_id'],
            'merchant_id' => $eligibility['merchant_id'],
            'event_at' => $this->now->format('Y-m-d H:i:s'),
            'destination_domain' => isset($parts['host']) ? strtolower((string) $parts['host']) : null,
            'destination_path_summary' => $path === '' ? null : mb_substr($path, 0, 255, 'UTF-8'),
        ];
    }

    private function failureMessage(string $reason): string
    {
        return match ($reason) {
            'destination_missing' => 'Ưu đãi này chưa có liên kết mua hợp lệ.',
            'destination_invalid', 'destination_unsafe' => 'Liên kết nơi bán chưa an toàn hoặc không thuộc miền được DealSach cho phép.',
            'offer_unavailable' => 'Ưu đãi này hiện tạm hết hàng.',
            'offer_stale' => 'Giá của ưu đãi này đã cũ, DealSach chưa thể chuyển bạn đến nơi bán.',
            'entity_inactive' => 'Ưu đãi này không còn hiển thị công khai.',
            'merchant_retailer_mismatch' => 'Thông tin nơi bán của ưu đãi chưa nhất quán.',
            default => 'DealSach chưa thể chuyển bạn đến nơi bán cho ưu đãi này.',
        };
    }
}
