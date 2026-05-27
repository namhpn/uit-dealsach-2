<?php

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class AccountAccessDatabaseTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $namespace = 'App';

    public function testAccountAccessMigrationCreatesRequiredTables(): void
    {
        foreach (['users', 'email_verification_codes', 'outbound_emails', 'user_sessions'] as $table) {
            $this->assertTrue($this->db->tableExists($table), sprintf('Missing table: %s', $table));
        }
    }

    public function testUsersRequireUniqueNormalizedEmail(): void
    {
        $row = [
            'normalized_email' => 'tester@example.com',
            'display_email' => 'tester@example.com',
            'role' => 'registered',
            'status' => 'active',
            'alert_email_enabled' => 1,
            'created_at' => '2026-05-27 09:00:00',
            'updated_at' => '2026-05-27 09:00:00',
        ];

        $this->db->table('users')->insert($row);

        $this->expectException(Throwable::class);
        $this->db->table('users')->insert($row);
    }
}
