<?php

use App\Database\Seeds\DealSachDemoSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class DealSachDomainDatabaseTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $seed = DealSachDemoSeeder::class;
    protected $namespace = 'App';

    public function testCoreDomainMigrationsCreateRequiredTables(): void
    {
        foreach ($this->coreTables() as $table) {
            $this->assertTrue($this->db->tableExists($table), sprintf('Missing table: %s', $table));
        }
    }

    public function testSeedCreatesMinimumDomainCounts(): void
    {
        $bookCount = $this->countTable('books');
        $offerCount = $this->countTable('offers');

        $this->assertGreaterThanOrEqual(12, $bookCount);
        $this->assertGreaterThanOrEqual(4, $this->countTable('retailer_platforms'));
        $this->assertGreaterThanOrEqual(8, $this->countTable('merchants'));
        $this->assertGreaterThanOrEqual(2, $offerCount / $bookCount);
    }

    public function testSeedRelationshipsAreCompleteAndConsistent(): void
    {
        $booksWithoutCategory = $this->db->table('books b')
            ->join('categories c', 'c.id = b.primary_category_id', 'left')
            ->where('c.id', null)
            ->countAllResults();

        $merchantsWithoutRetailer = $this->db->table('merchants m')
            ->join('retailer_platforms r', 'r.id = m.retailer_platform_id', 'left')
            ->where('r.id', null)
            ->countAllResults();

        $offersWithoutRequiredParent = $this->db->table('offers o')
            ->join('books b', 'b.id = o.book_id', 'left')
            ->join('retailer_platforms r', 'r.id = o.retailer_platform_id', 'left')
            ->join('merchants m', 'm.id = o.merchant_id', 'left')
            ->groupStart()
            ->where('b.id', null)
            ->orWhere('r.id', null)
            ->orWhere('m.id', null)
            ->groupEnd()
            ->countAllResults();

        $offerMerchantRetailerMismatch = $this->db->table('offers o')
            ->join('merchants m', 'm.id = o.merchant_id')
            ->where('o.retailer_platform_id != m.retailer_platform_id')
            ->countAllResults();

        $this->assertSame(0, $booksWithoutCategory);
        $this->assertSame(0, $merchantsWithoutRetailer);
        $this->assertSame(0, $offersWithoutRequiredParent);
        $this->assertSame(0, $offerMerchantRetailerMismatch);
    }

    public function testCategoryDisplayMetadataColumnsAndSeedValuesExist(): void
    {
        foreach (['display_label', 'display_description', 'display_order'] as $field) {
            $this->assertTrue($this->db->fieldExists($field, 'categories'), sprintf('Missing categories.%s', $field));
        }

        $row = $this->db->table('categories')
            ->select('display_label, display_description, display_order')
            ->where('slug', 'ky-nang-song')
            ->get()
            ->getFirstRow();

        $this->assertNotNull($row);
        $this->assertSame('Kỹ năng sống', $row->display_label);
        $this->assertNotEmpty((string) $row->display_description);
        $this->assertSame(10, (int) $row->display_order);
    }

    public function testBookTechnicalMetadataColumnsAndSeedValuesExist(): void
    {
        foreach (['release_date', 'page_count', 'dimensions', 'format'] as $field) {
            $this->assertTrue($this->db->fieldExists($field, 'books'), sprintf('Missing books.%s', $field));
        }

        $row = $this->db->table('books')
            ->select('release_date, page_count, dimensions, format')
            ->where('isbn', '9786041000001')
            ->get()
            ->getFirstRow();

        $this->assertNotNull($row);
        $this->assertNotNull($row->release_date);
        $this->assertGreaterThan(0, (int) $row->page_count);
        $this->assertNotEmpty((string) $row->dimensions);
        $this->assertNotEmpty((string) $row->format);
    }

    public function testPriceObservationsStoreObservationTimeFacts(): void
    {
        $row = $this->db->table('price_observations')
            ->where('book_status_at_observation IS NOT NULL')
            ->where('offer_status_at_observation IS NOT NULL')
            ->where('retailer_status_at_observation IS NOT NULL')
            ->where('merchant_status_at_observation IS NOT NULL')
            ->where('merchant_retailer_consistent_at_observation IS NOT NULL')
            ->where('destination_status_at_observation IS NOT NULL')
            ->get()
            ->getFirstRow();

        $missingSnapshotRows = $this->db->table('price_observations')
            ->groupStart()
            ->where('book_status_at_observation', null)
            ->orWhere('offer_status_at_observation', null)
            ->orWhere('retailer_status_at_observation', null)
            ->orWhere('merchant_status_at_observation', null)
            ->orWhere('merchant_retailer_consistent_at_observation', null)
            ->orWhere('destination_status_at_observation', null)
            ->groupEnd()
            ->countAllResults();

        $this->assertNotNull($row);
        $this->assertSame(0, $missingSnapshotRows);
    }

    public function testSeedScenarioCoverage(): void
    {
        $this->assertGreaterThanOrEqual(6, $this->countBooksWithFourteenObservationDays());
        $this->assertGreaterThanOrEqual(3, $this->countBooksWithMultiRetailerHistory());
        $this->assertGreaterThanOrEqual(3, $this->countPriceDropOffers());
        $this->assertGreaterThanOrEqual(2, $this->countLatestUnavailableOffers());
        $this->assertGreaterThanOrEqual(2, $this->countLatestStaleOffers());
        $this->assertGreaterThanOrEqual(2, $this->countRedirectFailureOffers());
        $this->assertGreaterThanOrEqual(2, $this->countTiedLowestBooksOnLatestCycle());
    }

    public function testSeedIncludesDashboardAlertEmailClickAndAuditScenarios(): void
    {
        $this->assertGreaterThanOrEqual(2, $this->countWhere('price_alerts', ['status' => 'Active']));
        $this->assertGreaterThanOrEqual(1, $this->countWhere('price_alerts', ['status' => 'Auto-paused']));
        $this->assertGreaterThanOrEqual(1, $this->countWhere('price_alerts', ['status' => 'Expired']));
        $this->assertGreaterThanOrEqual(1, $this->countWhere('outbound_emails', ['email_type' => 'price_alert_target_price', 'status' => 'sent']));
        $this->assertGreaterThanOrEqual(1, $this->countWhere('outbound_emails', ['email_type' => 'price_alert_new_lowest', 'status' => 'failed']));
        $this->assertGreaterThanOrEqual(1, $this->countTable('email_deal_links'));
        $this->assertGreaterThanOrEqual(1, $this->countTable('email_deal_link_clicks'));
        $this->assertGreaterThanOrEqual(1, $this->countTable('admin_audit_logs'));
    }

    /**
     * @return list<string>
     */
    private function coreTables(): array
    {
        return [
            'categories',
            'books',
            'retailer_platforms',
            'merchants',
            'offers',
            'observation_cycles',
            'price_observations',
            'buy_attempts',
            'affiliate_redirects',
            'redirect_failures',
        ];
    }

    private function countTable(string $table): int
    {
        return (int) $this->db->table($table)->countAllResults();
    }

    private function countWhere(string $table, array $where): int
    {
        return (int) $this->db->table($table)->where($where)->countAllResults();
    }

    private function countBooksWithFourteenObservationDays(): int
    {
        $rows = $this->db->table('books b')
            ->select('b.id, COUNT(DISTINCT DATE(po.observed_at)) AS observed_days')
            ->join('offers o', 'o.book_id = b.id')
            ->join('price_observations po', 'po.offer_id = o.id')
            ->groupBy('b.id')
            ->having('observed_days >=', 14)
            ->get()
            ->getResult();

        return count($rows);
    }

    private function countBooksWithMultiRetailerHistory(): int
    {
        $rows = $this->db->table('books b')
            ->select('b.id, COUNT(DISTINCT o.retailer_platform_id) AS retailer_count')
            ->join('offers o', 'o.book_id = b.id')
            ->join('price_observations po', 'po.offer_id = o.id')
            ->groupBy('b.id')
            ->having('retailer_count >=', 2)
            ->get()
            ->getResult();

        return count($rows);
    }

    private function countPriceDropOffers(): int
    {
        $dropCount = 0;

        foreach ($this->db->table('offers')->select('id')->get()->getResult() as $offer) {
            $prices = $this->db->table('price_observations')
                ->select('listed_item_price')
                ->where('offer_id', $offer->id)
                ->where('availability_status', 'available')
                ->orderBy('observed_at', 'ASC')
                ->get()
                ->getResult();

            if (count($prices) < 2) {
                continue;
            }

            $first = (int) $prices[0]->listed_item_price;
            $last = (int) $prices[count($prices) - 1]->listed_item_price;

            if ($last < $first) {
                $dropCount++;
            }
        }

        return $dropCount;
    }

    private function countLatestUnavailableOffers(): int
    {
        $count = 0;

        foreach ($this->latestObservationsByOffer() as $observation) {
            if ($observation->availability_status === 'unavailable') {
                $count++;
            }
        }

        return $count;
    }

    private function countLatestStaleOffers(): int
    {
        $count = 0;

        foreach ($this->latestObservationsByOffer() as $observation) {
            if ($observation->observed_at < '2026-05-24 00:00:00') {
                $count++;
            }
        }

        return $count;
    }

    private function countRedirectFailureOffers(): int
    {
        return (int) $this->db->table('offers')
            ->whereIn('destination_status', ['missing', 'invalid'])
            ->countAllResults();
    }

    private function countTiedLowestBooksOnLatestCycle(): int
    {
        $latestCycleId = (int) $this->db->table('observation_cycles')
            ->select('id')
            ->orderBy('cycle_date', 'DESC')
            ->get()
            ->getFirstRow()
            ->id;

        $tiedBooks = 0;
        $books = $this->db->table('books')->select('id')->get()->getResult();

        foreach ($books as $book) {
            $observations = $this->db->table('price_observations po')
                ->select('po.listed_item_price')
                ->join('offers o', 'o.id = po.offer_id')
                ->where('o.book_id', $book->id)
                ->where('po.observation_cycle_id', $latestCycleId)
                ->where('po.availability_status', 'available')
                ->where('po.listed_item_price IS NOT NULL')
                ->get()
                ->getResult();

            if (count($observations) < 2) {
                continue;
            }

            $prices = array_map(static fn ($row): int => (int) $row->listed_item_price, $observations);
            $minimum = min($prices);
            $minimumCount = count(array_filter($prices, static fn (int $price): bool => $price === $minimum));

            if ($minimumCount >= 2) {
                $tiedBooks++;
            }
        }

        return $tiedBooks;
    }

    /**
     * @return list<object>
     */
    private function latestObservationsByOffer(): array
    {
        $latest = [];

        foreach ($this->db->table('price_observations')->orderBy('observed_at', 'ASC')->get()->getResult() as $observation) {
            $latest[(int) $observation->offer_id] = $observation;
        }

        return array_values($latest);
    }
}
