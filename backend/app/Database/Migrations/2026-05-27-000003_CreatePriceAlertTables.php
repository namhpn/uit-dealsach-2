<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePriceAlertTables extends Migration
{
    public function up(): void
    {
        $this->createPriceAlertsTable();
        $this->createPriceAlertEventsTable();
        $this->createUserAlertPreferencesTable();
        $this->addMariaDbCheckConstraints();
    }

    public function down(): void
    {
        $this->forge->dropTable('price_alert_events', true);
        $this->forge->dropTable('user_alert_preferences', true);
        $this->forge->dropTable('price_alerts', true);
    }

    private function createPriceAlertsTable(): void
    {
        $this->forge->addField([
            'id'                 => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'user_id'            => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'book_id'            => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'alert_type'         => ['type' => 'VARCHAR', 'constraint' => 40],
            'status'             => ['type' => 'VARCHAR', 'constraint' => 30, 'default' => 'Active'],
            'target_price'       => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'null' => true],
            'baseline_price'     => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'null' => true],
            'baseline_pending'   => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0],
            'comparison_price'   => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'null' => true],
            'last_notified_price' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'null' => true],
            'notification_count' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'default' => 0],
            'expires_at'         => ['type' => 'DATETIME'],
            'created_at'         => ['type' => 'DATETIME', 'null' => true],
            'updated_at'         => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addKey(['user_id', 'status']);
        $this->forge->addKey(['book_id', 'alert_type']);
        $this->forge->addKey('expires_at');

        if ($this->db->DBDriver === 'MySQLi') {
            $this->forge->addForeignKey('user_id', 'users', 'id', 'RESTRICT', 'RESTRICT', 'fk_price_alerts_user');
            $this->forge->addForeignKey('book_id', 'books', 'id', 'RESTRICT', 'RESTRICT', 'fk_price_alerts_book');
        } else {
            $this->forge->addForeignKey('user_id', 'users', 'id', 'RESTRICT', 'RESTRICT');
            $this->forge->addForeignKey('book_id', 'books', 'id', 'RESTRICT', 'RESTRICT');
        }

        $this->forge->createTable('price_alerts', true);
    }

    private function createPriceAlertEventsTable(): void
    {
        $this->forge->addField([
            'id'               => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'price_alert_id'   => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'event_type'       => ['type' => 'VARCHAR', 'constraint' => 60],
            'previous_status'  => ['type' => 'VARCHAR', 'constraint' => 30, 'null' => true],
            'new_status'       => ['type' => 'VARCHAR', 'constraint' => 30, 'null' => true],
            'summary_json'     => ['type' => 'TEXT', 'null' => true],
            'created_at'       => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addKey(['price_alert_id', 'created_at']);

        if ($this->db->DBDriver === 'MySQLi') {
            $this->forge->addForeignKey('price_alert_id', 'price_alerts', 'id', 'RESTRICT', 'RESTRICT', 'fk_price_alert_events_alert');
        } else {
            $this->forge->addForeignKey('price_alert_id', 'price_alerts', 'id', 'RESTRICT', 'RESTRICT');
        }

        $this->forge->createTable('price_alert_events', true);
    }

    private function createUserAlertPreferencesTable(): void
    {
        $this->forge->addField([
            'user_id'              => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'alert_emails_enabled' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
            'created_at'           => ['type' => 'DATETIME', 'null' => true],
            'updated_at'           => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('user_id');

        if ($this->db->DBDriver === 'MySQLi') {
            $this->forge->addForeignKey('user_id', 'users', 'id', 'RESTRICT', 'RESTRICT', 'fk_user_alert_preferences_user');
        } else {
            $this->forge->addForeignKey('user_id', 'users', 'id', 'RESTRICT', 'RESTRICT');
        }

        $this->forge->createTable('user_alert_preferences', true);
    }

    private function addMariaDbCheckConstraints(): void
    {
        if ($this->db->DBDriver !== 'MySQLi') {
            return;
        }

        $this->addCheck('price_alerts', 'chk_price_alerts_type', "alert_type IN ('target_price', 'new_lowest_price')");
        $this->addCheck('price_alerts', 'chk_price_alerts_status', "status IN ('Active', 'Paused', 'Auto-paused', 'Expired', 'Disabled')");
        $this->addCheck('price_alerts', 'chk_price_alerts_notification_count', 'notification_count >= 0');
        $this->addCheck('price_alerts', 'chk_price_alerts_target_price', 'target_price IS NULL OR target_price > 0');
        $this->addCheck('price_alerts', 'chk_price_alerts_baseline_price', 'baseline_price IS NULL OR baseline_price > 0');
        $this->addCheck('price_alerts', 'chk_price_alerts_comparison_price', 'comparison_price IS NULL OR comparison_price > 0');
        $this->addCheck('price_alerts', 'chk_price_alerts_last_notified_price', 'last_notified_price IS NULL OR last_notified_price > 0');
        $this->addCheck('user_alert_preferences', 'chk_user_alert_preferences_email_enabled', 'alert_emails_enabled IN (0, 1)');
    }

    private function addCheck(string $table, string $name, string $condition): void
    {
        $this->db->query(sprintf('ALTER TABLE `%s` ADD CONSTRAINT `%s` CHECK (%s)', $table, $name, $condition));
    }
}
