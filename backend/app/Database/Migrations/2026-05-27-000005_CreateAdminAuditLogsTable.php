<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAdminAuditLogsTable extends Migration
{
    public function up(): void
    {
        $this->forge->addField([
            'id'              => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'admin_user_id'   => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'null' => true],
            'actor_email'     => ['type' => 'VARCHAR', 'constraint' => 254],
            'action_type'     => ['type' => 'VARCHAR', 'constraint' => 80],
            'entity_type'     => ['type' => 'VARCHAR', 'constraint' => 80],
            'entity_id'       => ['type' => 'VARCHAR', 'constraint' => 80],
            'summary'         => ['type' => 'VARCHAR', 'constraint' => 255],
            'before_json'     => ['type' => 'TEXT', 'null' => true],
            'after_json'      => ['type' => 'TEXT', 'null' => true],
            'created_at'      => ['type' => 'DATETIME'],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addKey(['action_type', 'created_at']);
        $this->forge->addKey(['entity_type', 'entity_id']);
        $this->forge->addKey('admin_user_id');

        if ($this->db->DBDriver === 'MySQLi') {
            $this->forge->addForeignKey('admin_user_id', 'users', 'id', 'SET NULL', 'RESTRICT', 'fk_admin_audit_logs_admin_user');
        } else {
            $this->forge->addForeignKey('admin_user_id', 'users', 'id', 'SET NULL', 'RESTRICT');
        }

        $this->forge->createTable('admin_audit_logs', true);
    }

    public function down(): void
    {
        $this->forge->dropTable('admin_audit_logs', true);
    }
}
