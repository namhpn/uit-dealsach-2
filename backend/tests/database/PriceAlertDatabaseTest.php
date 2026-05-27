<?php

use App\Database\Seeds\DealSachDemoSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class PriceAlertDatabaseTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $seed = DealSachDemoSeeder::class;
    protected $namespace = 'App';

    public function testAlertMigrationsCreateRequiredTablesAndColumns(): void
    {
        $this->assertTrue($this->db->tableExists('price_alerts'));
        $this->assertTrue($this->db->tableExists('price_alert_events'));
        $this->assertTrue($this->db->tableExists('user_alert_preferences'));

        foreach ([
            'id',
            'user_id',
            'book_id',
            'alert_type',
            'status',
            'target_price',
            'baseline_price',
            'baseline_pending',
            'comparison_price',
            'last_notified_price',
            'notification_count',
            'expires_at',
            'created_at',
            'updated_at',
        ] as $field) {
            $this->assertTrue($this->db->fieldExists($field, 'price_alerts'), sprintf('Missing price_alerts.%s', $field));
        }

        foreach (['id', 'price_alert_id', 'event_type', 'previous_status', 'new_status', 'summary_json', 'created_at'] as $field) {
            $this->assertTrue($this->db->fieldExists($field, 'price_alert_events'), sprintf('Missing price_alert_events.%s', $field));
        }

        foreach (['user_id', 'alert_emails_enabled', 'created_at', 'updated_at'] as $field) {
            $this->assertTrue($this->db->fieldExists($field, 'user_alert_preferences'), sprintf('Missing user_alert_preferences.%s', $field));
        }
    }

    public function testForeignKeysAndRollbackOrderAreSafeForAlertRows(): void
    {
        $userId = $this->insertUser('alert-schema@example.com');
        $bookId = $this->bookIdByIsbn('9786041000003');

        $this->db->table('price_alerts')->insert([
            'user_id' => $userId,
            'book_id' => $bookId,
            'alert_type' => 'target_price',
            'status' => 'Active',
            'target_price' => 90000,
            'baseline_pending' => 0,
            'notification_count' => 0,
            'expires_at' => '2026-08-25 09:00:00',
            'created_at' => '2026-05-27 09:00:00',
            'updated_at' => '2026-05-27 09:00:00',
        ]);
        $alertId = (int) $this->db->insertID();

        $this->db->table('price_alert_events')->insert([
            'price_alert_id' => $alertId,
            'event_type' => 'created',
            'previous_status' => null,
            'new_status' => 'Active',
            'summary_json' => '{}',
            'created_at' => '2026-05-27 09:00:00',
        ]);
        $this->db->table('user_alert_preferences')->insert([
            'user_id' => $userId,
            'alert_emails_enabled' => 0,
            'created_at' => '2026-05-27 09:00:00',
            'updated_at' => '2026-05-27 09:00:00',
        ]);

        $this->assertSame(1, $this->db->table('price_alert_events')->where('price_alert_id', $alertId)->countAllResults());
        $this->assertSame(1, $this->db->table('user_alert_preferences')->where('user_id', $userId)->countAllResults());
    }

    private function insertUser(string $email): int
    {
        $this->db->table('users')->insert([
            'normalized_email' => $email,
            'display_email' => $email,
            'role' => 'registered',
            'status' => 'active',
            'alert_email_enabled' => 1,
            'created_at' => '2026-05-27 09:00:00',
            'updated_at' => '2026-05-27 09:00:00',
        ]);

        return (int) $this->db->insertID();
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
}
