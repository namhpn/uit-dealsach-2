<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddCategoryDisplayMetadataToCategories extends Migration
{
    public function up(): void
    {
        if (! $this->db->fieldExists('display_label', 'categories')) {
            $this->forge->addColumn('categories', [
                'display_label' => [
                    'type' => 'VARCHAR',
                    'constraint' => 150,
                    'null' => true,
                ],
            ]);
        }

        if (! $this->db->fieldExists('display_description', 'categories')) {
            $this->forge->addColumn('categories', [
                'display_description' => [
                    'type' => 'TEXT',
                    'null' => true,
                ],
            ]);
        }

        if (! $this->db->fieldExists('display_order', 'categories')) {
            $this->forge->addColumn('categories', [
                'display_order' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'default' => 0,
                ],
            ]);
        }
    }

    public function down(): void
    {
        if ($this->db->fieldExists('display_order', 'categories')) {
            $this->forge->dropColumn('categories', 'display_order');
        }
        if ($this->db->fieldExists('display_description', 'categories')) {
            $this->forge->dropColumn('categories', 'display_description');
        }
        if ($this->db->fieldExists('display_label', 'categories')) {
            $this->forge->dropColumn('categories', 'display_label');
        }
    }
}
