<?php

namespace App\Libraries;

use App\Models\BookModel;
use App\Models\WishlistItemModel;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Database\ConnectionInterface;
use Config\Database;
use Throwable;

class WishlistService
{
    private BaseConnection $db;
    private WishlistItemModel $wishlistItems;
    private BookModel $books;
    private PublicCatalogService $catalog;

    /**
     * @param ConnectionInterface&BaseConnection|null $db
     */
    public function __construct(?ConnectionInterface $db = null, ?PublicCatalogService $catalog = null)
    {
        $this->db = $db ?? Database::connect();
        $this->wishlistItems = new WishlistItemModel();
        $this->books = new BookModel();
        $this->catalog = $catalog ?? new PublicCatalogService($this->db);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listForUser(int $userId): array
    {
        $cards = $this->catalog->bookCards();
        $rows = $this->db->table('wishlist_items wi')
            ->select('wi.id AS wishlist_item_id, wi.created_at AS added_at')
            ->select('b.id AS book_id, b.title, b.author, b.publisher, b.isbn, b.cover_image, b.status AS book_status')
            ->select('c.name AS category, c.slug AS category_slug')
            ->join('books b', 'b.id = wi.book_id')
            ->join('categories c', 'c.id = b.primary_category_id')
            ->where('wi.user_id', $userId)
            ->orderBy('wi.created_at', 'DESC')
            ->orderBy('wi.id', 'DESC')
            ->get()
            ->getResult();

        return array_map(function (object $row) use ($cards): array {
            $bookId = (int) $row->book_id;
            $archived = $row->book_status !== 'active';
            $card = $cards[$bookId] ?? [
                'id' => $bookId,
                'title' => $row->title,
                'author' => $row->author,
                'publisher' => $row->publisher,
                'category' => $row->category,
                'category_slug' => $row->category_slug,
                'isbn' => $row->isbn,
                'cover_image' => $row->cover_image,
                'is_featured' => false,
                'offer_count' => 0,
                'lowest_eligible_price' => null,
                'status' => [
                    'value' => $archived ? 'archived' : 'no_tracked_offer',
                    'label' => $archived ? 'Sách đã lưu trữ' : 'Chưa có ưu đãi',
                ],
                'price_disclaimer' => PublicCatalogService::PRICE_DISCLAIMER,
            ];

            unset($card['_created_at'], $card['_search']);

            return $card + [
                'wishlist_item_id' => (int) $row->wishlist_item_id,
                'wishlisted' => true,
                'archived' => $archived,
                'added_at' => $row->added_at,
            ];
        }, $rows);
    }

    public function statusForUser(int $userId, int $bookId): array
    {
        return [
            'book_id' => $bookId,
            'wishlisted' => $this->isWishlisted($userId, $bookId),
        ];
    }

    public function addBook(int $userId, int $bookId): array
    {
        $book = $this->books->find($bookId);
        if ($book === null || $book->status !== 'active') {
            return [
                'ok' => false,
                'statusCode' => 404,
                'message' => 'Sách không tồn tại hoặc đã được lưu trữ nên không thể thêm vào danh sách yêu thích.',
                'errors' => ['book_id' => 'Chỉ có thể lưu sách đang công khai.'],
            ];
        }

        if (! $this->isWishlisted($userId, $bookId)) {
            try {
                $this->wishlistItems->insert([
                    'user_id' => $userId,
                    'book_id' => $bookId,
                ]);
            } catch (Throwable) {
                // Unique constraint makes concurrent duplicate adds a no-op.
            }
        }

        return [
            'ok' => true,
            'statusCode' => 200,
            'message' => 'Đã lưu sách vào danh sách yêu thích.',
            'data' => $this->statusForUser($userId, $bookId),
        ];
    }

    public function removeBook(int $userId, int $bookId): array
    {
        $this->wishlistItems
            ->where('user_id', $userId)
            ->where('book_id', $bookId)
            ->delete();

        return [
            'book_id' => $bookId,
            'wishlisted' => false,
        ];
    }

    private function isWishlisted(int $userId, int $bookId): bool
    {
        return $this->wishlistItems
            ->where('user_id', $userId)
            ->where('book_id', $bookId)
            ->countAllResults() > 0;
    }
}
