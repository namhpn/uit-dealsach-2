<?php

use App\Database\Seeds\DealSachDemoSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class BuyFlowFeatureTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $seed = DealSachDemoSeeder::class;
    protected $namespace = 'App';

    public function testValidEligibleOfferRecordsAttemptAndAffiliateRedirect(): void
    {
        $offerId = $this->offerIdByTitle('Nhà giả kim - tái bản');
        $beforeAttempts = $this->countTable('buy_attempts');
        $beforeRedirects = $this->countTable('affiliate_redirects');

        $result = $this->get('/go/offers/' . $offerId);

        $result->assertStatus(302);
        $this->assertSame('https://tiki.vn/nha-gia-kim-demo', $result->response()->getHeaderLine('Location'));
        $this->assertSame($beforeAttempts + 1, $this->countTable('buy_attempts'));
        $this->assertSame($beforeRedirects + 1, $this->countTable('affiliate_redirects'));
        $this->assertSame(0, $this->db->table('redirect_failures')->where('offer_id', $offerId)->where('failure_reason !=', 'destination_invalid')->countAllResults());
    }

    public function testInvalidDestinationRecordsFailureAndDoesNotRedirectExternally(): void
    {
        $offerId = $this->offerIdByTitle('Nhà giả kim');
        $beforeRedirects = $this->countTable('affiliate_redirects');
        $beforeAttempts = $this->db->table('buy_attempts')->where('offer_id', $offerId)->countAllResults();
        $beforeFailures = $this->db->table('redirect_failures')->where('offer_id', $offerId)->where('failure_reason', 'destination_invalid')->countAllResults();

        $result = $this->get('/go/offers/' . $offerId);

        $result->assertStatus(409);
        $this->assertStringContainsString('Kh&ocirc;ng th&#7875; m&#7903; li&ecirc;n k&#7871;t mua', $result->getBody());
        $this->assertSame($beforeRedirects, $this->countTable('affiliate_redirects'));
        $this->assertSame($beforeAttempts + 1, $this->db->table('buy_attempts')->where('offer_id', $offerId)->countAllResults());
        $this->assertSame($beforeFailures + 1, $this->db->table('redirect_failures')->where('offer_id', $offerId)->where('failure_reason', 'destination_invalid')->countAllResults());
    }

    public function testUnavailableAndStaleOffersDoNotRecordAffiliateRedirect(): void
    {
        $unavailableOfferId = $this->offerIdByTitle('Đắc nhân tâm');
        $staleOfferId = $this->offerIdByTitle('Nghĩ giàu làm giàu');
        $beforeRedirects = $this->countTable('affiliate_redirects');

        $this->get('/go/offers/' . $unavailableOfferId)->assertStatus(409);
        $this->get('/go/offers/' . $staleOfferId)->assertStatus(409);

        $this->assertSame($beforeRedirects, $this->countTable('affiliate_redirects'));
        $this->assertSame(1, $this->db->table('redirect_failures')->where('offer_id', $unavailableOfferId)->where('failure_reason', 'offer_unavailable')->countAllResults());
        $this->assertSame(1, $this->db->table('redirect_failures')->where('offer_id', $staleOfferId)->where('failure_reason', 'offer_stale')->countAllResults());
    }

    public function testRedirectFailuresDoNotCountAsPopularClickedDeals(): void
    {
        $offerId = $this->offerIdByTitle('Nhà giả kim');
        $this->get('/go/offers/' . $offerId)->assertStatus(409);

        $body = $this->json($this->get('/api/public/discovery'));
        $nhaGiaKim = null;
        foreach ($body['data']['popular_clicked_deals']['items'] as $item) {
            if ($item['title'] === 'Nhà giả kim') {
                $nhaGiaKim = $item;
                break;
            }
        }

        $this->assertNotNull($nhaGiaKim);
        $this->assertSame(1, $nhaGiaKim['popular_clicked_deal']['redirect_count_7d']);
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

    private function countTable(string $table): int
    {
        return (int) $this->db->table($table)->countAllResults();
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
