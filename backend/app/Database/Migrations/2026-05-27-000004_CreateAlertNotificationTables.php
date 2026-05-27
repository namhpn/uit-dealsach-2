<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAlertNotificationTables extends Migration
{
    public function up(): void
    {
        $this->createEmailDealLinksTable();
        $this->createEmailDealLinkClicksTable();
        $this->createAlertDisableTokensTable();
    }

    public function down(): void
    {
        $this->forge->dropTable('alert_disable_tokens', true);
        $this->forge->dropTable('email_deal_link_clicks', true);
        $this->forge->dropTable('email_deal_links', true);
    }

    private function createEmailDealLinksTable(): void
    {
        $this->forge->addField([
            'id'                => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'price_alert_id'    => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'outbound_email_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'null' => true],
            'book_id'           => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'token_hash'        => ['type' => 'CHAR', 'constraint' => 64],
            'landing_path'      => ['type' => 'VARCHAR', 'constraint' => 255],
            'created_at'        => ['type' => 'DATETIME', 'null' => true],
            'updated_at'        => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addUniqueKey('token_hash');
        $this->forge->addKey(['price_alert_id', 'created_at']);
        $this->forge->addKey('outbound_email_id');
        $this->forge->addKey('book_id');
        $this->addForeignKey('price_alert_id', 'price_alerts', 'id', 'RESTRICT', 'RESTRICT', 'fk_email_deal_links_alert');
        $this->addForeignKey('outbound_email_id', 'outbound_emails', 'id', 'SET NULL', 'RESTRICT', 'fk_email_deal_links_email');
        $this->addForeignKey('book_id', 'books', 'id', 'RESTRICT', 'RESTRICT', 'fk_email_deal_links_book');
        $this->forge->createTable('email_deal_links', true);
    }

    private function createEmailDealLinkClicksTable(): void
    {
        $this->forge->addField([
            'id'                 => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'email_deal_link_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'price_alert_id'     => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'book_id'            => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'clicked_at'         => ['type' => 'DATETIME'],
            'ip_address'         => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true],
            'user_agent'         => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'created_at'         => ['type' => 'DATETIME', 'null' => true],
            'updated_at'         => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addKey(['email_deal_link_id', 'clicked_at']);
        $this->forge->addKey(['price_alert_id', 'clicked_at']);
        $this->addForeignKey('email_deal_link_id', 'email_deal_links', 'id', 'RESTRICT', 'RESTRICT', 'fk_email_deal_clicks_link');
        $this->addForeignKey('price_alert_id', 'price_alerts', 'id', 'RESTRICT', 'RESTRICT', 'fk_email_deal_clicks_alert');
        $this->addForeignKey('book_id', 'books', 'id', 'RESTRICT', 'RESTRICT', 'fk_email_deal_clicks_book');
        $this->forge->createTable('email_deal_link_clicks', true);
    }

    private function createAlertDisableTokensTable(): void
    {
        $this->forge->addField([
            'id'             => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'price_alert_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'token_hash'     => ['type' => 'CHAR', 'constraint' => 64],
            'expires_at'     => ['type' => 'DATETIME'],
            'used_at'        => ['type' => 'DATETIME', 'null' => true],
            'created_at'     => ['type' => 'DATETIME', 'null' => true],
            'updated_at'     => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addUniqueKey('token_hash');
        $this->forge->addKey(['price_alert_id', 'expires_at']);
        $this->addForeignKey('price_alert_id', 'price_alerts', 'id', 'RESTRICT', 'RESTRICT', 'fk_alert_disable_tokens_alert');
        $this->forge->createTable('alert_disable_tokens', true);
    }

    private function addForeignKey(
        string $fieldName,
        string $tableName,
        string $tableField,
        string $onUpdate,
        string $onDelete,
        string $fkName,
    ): void {
        if ($this->db->DBDriver === 'MySQLi') {
            $this->forge->addForeignKey($fieldName, $tableName, $tableField, $onUpdate, $onDelete, $fkName);

            return;
        }

        $this->forge->addForeignKey($fieldName, $tableName, $tableField, $onUpdate, $onDelete);
    }
}
