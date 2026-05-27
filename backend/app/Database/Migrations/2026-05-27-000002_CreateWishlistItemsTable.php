<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateWishlistItemsTable extends Migration
{
    public function up(): void
    {
        $this->forge->addField([
            'id'         => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'user_id'    => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'book_id'    => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addUniqueKey(['user_id', 'book_id'], 'uq_wishlist_items_user_book');
        $this->forge->addKey('book_id');

        if ($this->db->DBDriver === 'MySQLi') {
            $this->forge->addForeignKey('user_id', 'users', 'id', 'RESTRICT', 'RESTRICT', 'fk_wishlist_items_user');
            $this->forge->addForeignKey('book_id', 'books', 'id', 'RESTRICT', 'RESTRICT', 'fk_wishlist_items_book');
        } else {
            $this->forge->addForeignKey('user_id', 'users', 'id', 'RESTRICT', 'RESTRICT');
            $this->forge->addForeignKey('book_id', 'books', 'id', 'RESTRICT', 'RESTRICT');
        }

        $this->forge->createTable('wishlist_items', true);
    }

    public function down(): void
    {
        $this->forge->dropTable('wishlist_items', true);
    }
}
