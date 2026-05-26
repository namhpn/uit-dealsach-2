<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateBuyFlowEventTables extends Migration
{
    public function up(): void
    {
        $this->createBuyAttemptsTable();
        $this->createAffiliateRedirectsTable();
        $this->createRedirectFailuresTable();
        $this->addMariaDbCheckConstraints();
    }

    public function down(): void
    {
        $this->forge->dropTable('redirect_failures', true);
        $this->forge->dropTable('affiliate_redirects', true);
        $this->forge->dropTable('buy_attempts', true);
    }

    private function createBuyAttemptsTable(): void
    {
        $this->forge->addField($this->baseEventFields() + [
            'attempt_status' => ['type' => 'VARCHAR', 'constraint' => 30, 'default' => 'recorded'],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->addEventKeys('buy_attempts');
        $this->forge->addKey('attempt_status');
        $this->forge->createTable('buy_attempts', true);
    }

    private function createAffiliateRedirectsTable(): void
    {
        $this->forge->addField($this->baseEventFields() + [
            'redirect_status' => ['type' => 'VARCHAR', 'constraint' => 30, 'default' => 'redirected'],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->addEventKeys('affiliate_redirects');
        $this->forge->addKey('redirect_status');
        $this->forge->createTable('affiliate_redirects', true);
    }

    private function createRedirectFailuresTable(): void
    {
        $this->forge->addField($this->baseEventFields() + [
            'failure_reason' => ['type' => 'VARCHAR', 'constraint' => 80],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->addEventKeys('redirect_failures');
        $this->forge->addKey('failure_reason');
        $this->forge->createTable('redirect_failures', true);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function baseEventFields(): array
    {
        return [
            'id'                       => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'offer_id'                 => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'book_id'                  => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'retailer_platform_id'     => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'merchant_id'              => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'event_at'                 => ['type' => 'DATETIME'],
            'event_type'               => ['type' => 'VARCHAR', 'constraint' => 40],
            'destination_domain'       => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'destination_path_summary' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'created_at'               => ['type' => 'DATETIME', 'null' => true],
            'updated_at'               => ['type' => 'DATETIME', 'null' => true],
        ];
    }

    private function addEventKeys(string $table): void
    {
        $this->forge->addKey('offer_id');
        $this->forge->addKey('book_id');
        $this->forge->addKey('retailer_platform_id');
        $this->forge->addKey('merchant_id');
        $this->forge->addKey('event_at');
        $this->forge->addKey('event_type');
        $this->addForeignKey($table, 'offer_id', 'offers', 'id');
        $this->addForeignKey($table, 'book_id', 'books', 'id');
        $this->addForeignKey($table, 'retailer_platform_id', 'retailer_platforms', 'id');
        $this->addForeignKey($table, 'merchant_id', 'merchants', 'id');
    }

    private function addMariaDbCheckConstraints(): void
    {
        if ($this->db->DBDriver !== 'MySQLi') {
            return;
        }

        $this->addCheck('buy_attempts', 'chk_buy_attempts_event_type', "event_type = 'buy_attempt'");
        $this->addCheck('buy_attempts', 'chk_buy_attempts_status', "attempt_status IN ('recorded')");
        $this->addCheck('affiliate_redirects', 'chk_affiliate_redirects_event_type', "event_type = 'affiliate_redirect'");
        $this->addCheck('affiliate_redirects', 'chk_affiliate_redirects_status', "redirect_status IN ('redirected')");
        $this->addCheck('redirect_failures', 'chk_redirect_failures_event_type', "event_type = 'redirect_failure'");
    }

    private function addCheck(string $table, string $name, string $condition): void
    {
        $this->db->query(sprintf('ALTER TABLE `%s` ADD CONSTRAINT `%s` CHECK (%s)', $table, $name, $condition));
    }

    private function addForeignKey(string $localTable, string $fieldName, string $tableName, string $tableField): void
    {
        if ($this->db->DBDriver === 'MySQLi') {
            $this->forge->addForeignKey($fieldName, $tableName, $tableField, 'RESTRICT', 'RESTRICT', sprintf('fk_%s_%s', $localTable, $fieldName));

            return;
        }

        $this->forge->addForeignKey($fieldName, $tableName, $tableField);
    }
}
