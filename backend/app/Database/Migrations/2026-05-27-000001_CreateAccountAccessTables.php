<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAccountAccessTables extends Migration
{
    public function up(): void
    {
        $this->createUsersTable();
        $this->createEmailVerificationCodesTable();
        $this->createOutboundEmailsTable();
        $this->createUserSessionsTable();
        $this->addMariaDbCheckConstraints();
    }

    public function down(): void
    {
        $this->forge->dropTable('user_sessions', true);
        $this->forge->dropTable('outbound_emails', true);
        $this->forge->dropTable('email_verification_codes', true);
        $this->forge->dropTable('users', true);
    }

    private function createUsersTable(): void
    {
        $this->forge->addField([
            'id'                  => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'normalized_email'    => ['type' => 'VARCHAR', 'constraint' => 254],
            'display_email'       => ['type' => 'VARCHAR', 'constraint' => 254],
            'role'                => ['type' => 'VARCHAR', 'constraint' => 30, 'default' => 'registered'],
            'status'              => ['type' => 'VARCHAR', 'constraint' => 30, 'default' => 'active'],
            'alert_email_enabled' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
            'created_at'          => ['type' => 'DATETIME', 'null' => true],
            'updated_at'          => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addUniqueKey('normalized_email');
        $this->forge->addKey('role');
        $this->forge->addKey('status');
        $this->forge->createTable('users', true);
    }

    private function createEmailVerificationCodesTable(): void
    {
        $this->forge->addField([
            'id'               => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'normalized_email' => ['type' => 'VARCHAR', 'constraint' => 254],
            'display_email'    => ['type' => 'VARCHAR', 'constraint' => 254],
            'code_hash'        => ['type' => 'CHAR', 'constraint' => 64],
            'status'           => ['type' => 'VARCHAR', 'constraint' => 30, 'default' => 'active'],
            'failed_attempts'  => ['type' => 'TINYINT', 'constraint' => 2, 'unsigned' => true, 'default' => 0],
            'requested_at'     => ['type' => 'DATETIME'],
            'expires_at'       => ['type' => 'DATETIME'],
            'used_at'          => ['type' => 'DATETIME', 'null' => true],
            'invalidated_at'   => ['type' => 'DATETIME', 'null' => true],
            'created_at'       => ['type' => 'DATETIME', 'null' => true],
            'updated_at'       => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addKey(['normalized_email', 'status']);
        $this->forge->addKey('requested_at');
        $this->forge->addKey('expires_at');
        $this->forge->createTable('email_verification_codes', true);
    }

    private function createOutboundEmailsTable(): void
    {
        $this->forge->addField([
            'id'                         => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'normalized_recipient_email' => ['type' => 'VARCHAR', 'constraint' => 254],
            'display_recipient_email'    => ['type' => 'VARCHAR', 'constraint' => 254],
            'email_type'                 => ['type' => 'VARCHAR', 'constraint' => 60],
            'subject'                    => ['type' => 'VARCHAR', 'constraint' => 255],
            'body_text'                  => ['type' => 'TEXT'],
            'metadata_json'              => ['type' => 'TEXT', 'null' => true],
            'status'                     => ['type' => 'VARCHAR', 'constraint' => 30, 'default' => 'queued'],
            'created_at'                 => ['type' => 'DATETIME', 'null' => true],
            'updated_at'                 => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addKey(['normalized_recipient_email', 'email_type']);
        $this->forge->addKey('status');
        $this->forge->createTable('outbound_emails', true);
    }

    private function createUserSessionsTable(): void
    {
        $this->forge->addField([
            'id'             => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'user_id'        => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'token_hash'     => ['type' => 'CHAR', 'constraint' => 64],
            'status'         => ['type' => 'VARCHAR', 'constraint' => 30, 'default' => 'active'],
            'issued_at'      => ['type' => 'DATETIME'],
            'expires_at'     => ['type' => 'DATETIME'],
            'last_seen_at'   => ['type' => 'DATETIME', 'null' => true],
            'invalidated_at' => ['type' => 'DATETIME', 'null' => true],
            'created_at'     => ['type' => 'DATETIME', 'null' => true],
            'updated_at'     => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addUniqueKey('token_hash');
        $this->forge->addKey(['user_id', 'status']);
        $this->forge->addKey('expires_at');
        if ($this->db->DBDriver === 'MySQLi') {
            $this->forge->addForeignKey('user_id', 'users', 'id', 'RESTRICT', 'RESTRICT', 'fk_user_sessions_user');
        } else {
            $this->forge->addForeignKey('user_id', 'users', 'id', 'RESTRICT', 'RESTRICT');
        }
        $this->forge->createTable('user_sessions', true);
    }

    private function addMariaDbCheckConstraints(): void
    {
        if ($this->db->DBDriver !== 'MySQLi') {
            return;
        }

        $this->addCheck('users', 'chk_users_role', "role IN ('registered', 'admin')");
        $this->addCheck('users', 'chk_users_status', "status IN ('active', 'deactivated')");
        $this->addCheck('email_verification_codes', 'chk_email_codes_status', "status IN ('active', 'used', 'invalidated', 'expired', 'over_attempted')");
        $this->addCheck('email_verification_codes', 'chk_email_codes_failed_attempts', 'failed_attempts <= 5');
        $this->addCheck('outbound_emails', 'chk_outbound_emails_status', "status IN ('queued', 'sent', 'failed')");
        $this->addCheck('user_sessions', 'chk_user_sessions_status', "status IN ('active', 'logged_out', 'expired', 'invalidated')");
    }

    private function addCheck(string $table, string $name, string $condition): void
    {
        $this->db->query(sprintf('ALTER TABLE `%s` ADD CONSTRAINT `%s` CHECK (%s)', $table, $name, $condition));
    }
}
