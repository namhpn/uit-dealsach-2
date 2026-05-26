<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateCoreDomainTables extends Migration
{
    public function up(): void
    {
        $this->createCategoriesTable();
        $this->createBooksTable();
        $this->createRetailerPlatformsTable();
        $this->createMerchantsTable();
        $this->createOffersTable();
        $this->createObservationCyclesTable();
        $this->createPriceObservationsTable();
        $this->addMariaDbCheckConstraints();
    }

    public function down(): void
    {
        $this->forge->dropTable('price_observations', true);
        $this->forge->dropTable('observation_cycles', true);
        $this->forge->dropTable('offers', true);
        $this->forge->dropTable('merchants', true);
        $this->forge->dropTable('retailer_platforms', true);
        $this->forge->dropTable('books', true);
        $this->forge->dropTable('categories', true);
    }

    private function createCategoriesTable(): void
    {
        $this->forge->addField([
            'id'         => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'name'       => ['type' => 'VARCHAR', 'constraint' => 150],
            'slug'       => ['type' => 'VARCHAR', 'constraint' => 160],
            'status'     => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'active'],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addUniqueKey('slug');
        $this->forge->addKey('status');
        $this->forge->createTable('categories', true);
    }

    private function createBooksTable(): void
    {
        $this->forge->addField([
            'id'                => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'title'             => ['type' => 'VARCHAR', 'constraint' => 255],
            'author'            => ['type' => 'VARCHAR', 'constraint' => 180],
            'publisher'         => ['type' => 'VARCHAR', 'constraint' => 180],
            'isbn'              => ['type' => 'VARCHAR', 'constraint' => 32, 'null' => true],
            'description'       => ['type' => 'TEXT', 'null' => true],
            'cover_image'       => ['type' => 'VARCHAR', 'constraint' => 512, 'null' => true],
            'primary_category_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'is_featured'       => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0],
            'status'            => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'active'],
            'created_at'        => ['type' => 'DATETIME', 'null' => true],
            'updated_at'        => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addKey('primary_category_id');
        $this->forge->addKey('status');
        $this->addForeignKey('primary_category_id', 'categories', 'id', 'RESTRICT', 'RESTRICT', 'fk_books_primary_category');
        $this->forge->createTable('books', true);
    }

    private function createRetailerPlatformsTable(): void
    {
        $this->forge->addField([
            'id'               => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'name'             => ['type' => 'VARCHAR', 'constraint' => 150],
            'slug'             => ['type' => 'VARCHAR', 'constraint' => 160],
            'approved_domains' => ['type' => 'TEXT'],
            'status'           => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'active'],
            'created_at'       => ['type' => 'DATETIME', 'null' => true],
            'updated_at'       => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addUniqueKey('slug');
        $this->forge->addKey('status');
        $this->forge->createTable('retailer_platforms', true);
    }

    private function createMerchantsTable(): void
    {
        $this->forge->addField([
            'id'                   => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'retailer_platform_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'name'                 => ['type' => 'VARCHAR', 'constraint' => 150],
            'slug'                 => ['type' => 'VARCHAR', 'constraint' => 180],
            'status'               => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'active'],
            'created_at'           => ['type' => 'DATETIME', 'null' => true],
            'updated_at'           => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addUniqueKey(['retailer_platform_id', 'slug']);
        $this->forge->addKey('retailer_platform_id');
        $this->forge->addKey('status');
        $this->addForeignKey('retailer_platform_id', 'retailer_platforms', 'id', 'RESTRICT', 'RESTRICT', 'fk_merchants_retailer');
        $this->forge->createTable('merchants', true);
    }

    private function createOffersTable(): void
    {
        $this->forge->addField([
            'id'                      => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'book_id'                 => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'retailer_platform_id'    => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'merchant_id'             => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'external_offer_title'    => ['type' => 'VARCHAR', 'constraint' => 255],
            'affiliate_destination_url' => ['type' => 'VARCHAR', 'constraint' => 1024, 'null' => true],
            'destination_status'      => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'valid'],
            'status'                  => ['type' => 'VARCHAR', 'constraint' => 30, 'default' => 'pending_review'],
            'created_at'              => ['type' => 'DATETIME', 'null' => true],
            'updated_at'              => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addKey('book_id');
        $this->forge->addKey('retailer_platform_id');
        $this->forge->addKey('merchant_id');
        $this->forge->addKey('status');
        $this->forge->addKey('destination_status');
        $this->addForeignKey('book_id', 'books', 'id', 'RESTRICT', 'RESTRICT', 'fk_offers_book');
        $this->addForeignKey('retailer_platform_id', 'retailer_platforms', 'id', 'RESTRICT', 'RESTRICT', 'fk_offers_retailer');
        $this->addForeignKey('merchant_id', 'merchants', 'id', 'RESTRICT', 'RESTRICT', 'fk_offers_merchant');
        $this->forge->createTable('offers', true);
    }

    private function createObservationCyclesTable(): void
    {
        $this->forge->addField([
            'id'           => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'cycle_date'   => ['type' => 'DATE'],
            'processed_at' => ['type' => 'DATETIME'],
            'notes'        => ['type' => 'TEXT', 'null' => true],
            'created_at'   => ['type' => 'DATETIME', 'null' => true],
            'updated_at'   => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addUniqueKey('cycle_date');
        $this->forge->addKey('processed_at');
        $this->forge->createTable('observation_cycles', true);
    }

    private function createPriceObservationsTable(): void
    {
        $this->forge->addField([
            'id'                                          => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'offer_id'                                    => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'observation_cycle_id'                        => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'observed_at'                                 => ['type' => 'DATETIME'],
            'availability_status'                         => ['type' => 'VARCHAR', 'constraint' => 30],
            'listed_item_price'                           => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'null' => true],
            'book_status_at_observation'                  => ['type' => 'VARCHAR', 'constraint' => 20],
            'offer_status_at_observation'                 => ['type' => 'VARCHAR', 'constraint' => 30],
            'retailer_status_at_observation'              => ['type' => 'VARCHAR', 'constraint' => 20],
            'merchant_status_at_observation'              => ['type' => 'VARCHAR', 'constraint' => 20],
            'merchant_retailer_consistent_at_observation' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
            'destination_status_at_observation'           => ['type' => 'VARCHAR', 'constraint' => 20],
            'created_at'                                  => ['type' => 'DATETIME', 'null' => true],
            'updated_at'                                  => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addKey('offer_id');
        $this->forge->addKey('observation_cycle_id');
        $this->forge->addKey('observed_at');
        $this->forge->addKey('availability_status');
        $this->addForeignKey('offer_id', 'offers', 'id', 'RESTRICT', 'RESTRICT', 'fk_price_observations_offer');
        $this->addForeignKey('observation_cycle_id', 'observation_cycles', 'id', 'RESTRICT', 'RESTRICT', 'fk_price_observations_cycle');
        $this->forge->createTable('price_observations', true);
    }

    private function addMariaDbCheckConstraints(): void
    {
        if ($this->db->DBDriver !== 'MySQLi') {
            return;
        }

        $lifecycle = "status IN ('active', 'archived')";
        $this->addCheck('categories', 'chk_categories_status', $lifecycle);
        $this->addCheck('books', 'chk_books_status', $lifecycle);
        $this->addCheck('retailer_platforms', 'chk_retailer_platforms_status', $lifecycle);
        $this->addCheck('merchants', 'chk_merchants_status', $lifecycle);
        $this->addCheck('offers', 'chk_offers_status', "status IN ('pending_review', 'active', 'unavailable', 'inactive', 'removed_invalid')");
        $this->addCheck('offers', 'chk_offers_destination_status', "destination_status IN ('valid', 'missing', 'invalid')");
        $this->addCheck('price_observations', 'chk_price_observations_availability', "availability_status IN ('available', 'unavailable')");
        $this->addCheck('price_observations', 'chk_price_observations_price', "((availability_status = 'unavailable' AND listed_item_price IS NULL) OR (availability_status = 'available' AND listed_item_price > 0))");
        $this->addCheck('price_observations', 'chk_price_observations_book_status', "book_status_at_observation IN ('active', 'archived')");
        $this->addCheck('price_observations', 'chk_price_observations_offer_status', "offer_status_at_observation IN ('pending_review', 'active', 'unavailable', 'inactive', 'removed_invalid')");
        $this->addCheck('price_observations', 'chk_price_observations_retailer_status', "retailer_status_at_observation IN ('active', 'archived')");
        $this->addCheck('price_observations', 'chk_price_observations_merchant_status', "merchant_status_at_observation IN ('active', 'archived')");
        $this->addCheck('price_observations', 'chk_price_observations_destination_status', "destination_status_at_observation IN ('valid', 'missing', 'invalid')");
    }

    private function addCheck(string $table, string $name, string $condition): void
    {
        $this->db->query(sprintf('ALTER TABLE `%s` ADD CONSTRAINT `%s` CHECK (%s)', $table, $name, $condition));
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
