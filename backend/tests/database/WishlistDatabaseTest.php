<?php

use App\Database\Seeds\DealSachDemoSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class WishlistDatabaseTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $seed = DealSachDemoSeeder::class;
    protected $namespace = 'App';

    public function testWishlistMigrationCreatesRequiredTableAndColumns(): void
    {
        $this->assertTrue($this->db->tableExists('wishlist_items'));

        foreach (['id', 'user_id', 'book_id', 'created_at', 'updated_at'] as $field) {
            $this->assertTrue($this->db->fieldExists($field, 'wishlist_items'), sprintf('Missing wishlist_items.%s', $field));
        }
    }

    public function testWishlistRequiresUniqueUserBookPair(): void
    {
        $userId = $this->insertUser('schema@example.com');
        $bookId = $this->bookIdByIsbn('9786041000003');
        $row = [
            'user_id' => $userId,
            'book_id' => $bookId,
            'created_at' => '2026-05-27 09:00:00',
            'updated_at' => '2026-05-27 09:00:00',
        ];

        $this->db->table('wishlist_items')->insert($row);

        $this->expectException(Throwable::class);
        $this->db->table('wishlist_items')->insert($row);
    }

    private function insertUser(string $email): int
    {
        $this->db->table('users')->insert([
            'normalized_email' => $email,
            'display_email' => $email,
            'role' => 'registered',
            'status' => 'active',
            'alert_email_enabled' => 1,
            'created_at' => '2026-05-27 09:00:00',
            'updated_at' => '2026-05-27 09:00:00',
        ]);

        return (int) $this->db->insertID();
    }

    private function bookIdByIsbn(string $isbn): int
    {
        return (int) $this->db->table('books')
            ->select('id')
            ->where('isbn', $isbn)
            ->get()
            ->getFirstRow()
            ->id;
    }
}
