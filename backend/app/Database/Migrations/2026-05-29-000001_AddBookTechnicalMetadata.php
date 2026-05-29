<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddBookTechnicalMetadata extends Migration
{
    public function up(): void
    {
        $fields = [
            'release_date' => ['type' => 'DATE', 'null' => true, 'after' => 'cover_image'],
            'page_count' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'null' => true, 'after' => 'release_date'],
            'dimensions' => ['type' => 'VARCHAR', 'constraint' => 120, 'null' => true, 'after' => 'page_count'],
            'format' => ['type' => 'VARCHAR', 'constraint' => 100, 'null' => true, 'after' => 'dimensions'],
        ];

        $this->forge->addColumn('books', $fields);
    }

    public function down(): void
    {
        foreach (['format', 'dimensions', 'page_count', 'release_date'] as $field) {
            if ($this->db->fieldExists($field, 'books')) {
                $this->forge->dropColumn('books', $field);
            }
        }
    }
}
