<?php

namespace App\Controllers;

use App\Libraries\AuthService;
use App\Libraries\WishlistService;
use CodeIgniter\HTTP\ResponseInterface;

class WishlistController extends BaseController
{
    private AuthService $auth;
    private WishlistService $wishlist;

    public function __construct()
    {
        $this->auth = new AuthService();
        $this->wishlist = new WishlistService();
    }

    public function index(): ResponseInterface
    {
        $current = $this->requireUser();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        return $this->jsonEnvelope(200, 'Danh sách yêu thích hiện tại.', [
            'items' => $this->wishlist->listForUser((int) $current['user']->id),
        ], null);
    }

    public function status($bookId = null): ResponseInterface
    {
        $current = $this->requireUser();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        $id = $this->bookId($bookId);
        if ($id === null) {
            return $this->jsonEnvelope(422, 'Mã sách chưa hợp lệ.', null, ['book_id' => 'Mã sách phải là số nguyên dương.']);
        }

        return $this->jsonEnvelope(200, 'Trạng thái yêu thích của sách.', $this->wishlist->statusForUser((int) $current['user']->id, $id), null);
    }

    public function add($bookId = null): ResponseInterface
    {
        $current = $this->requireUser();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        $id = $this->bookId($bookId);
        if ($id === null) {
            return $this->jsonEnvelope(422, 'Mã sách chưa hợp lệ.', null, ['book_id' => 'Mã sách phải là số nguyên dương.']);
        }

        $result = $this->wishlist->addBook((int) $current['user']->id, $id);
        if (! $result['ok']) {
            return $this->jsonEnvelope($result['statusCode'], $result['message'], null, $result['errors']);
        }

        return $this->jsonEnvelope($result['statusCode'], $result['message'], $result['data'], null);
    }

    public function remove($bookId = null): ResponseInterface
    {
        $current = $this->requireUser();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        $id = $this->bookId($bookId);
        if ($id === null) {
            return $this->jsonEnvelope(422, 'Mã sách chưa hợp lệ.', null, ['book_id' => 'Mã sách phải là số nguyên dương.']);
        }

        return $this->jsonEnvelope(200, 'Đã bỏ sách khỏi danh sách yêu thích.', $this->wishlist->removeBook((int) $current['user']->id, $id), null);
    }

    /**
     * @return array<string, mixed>|ResponseInterface
     */
    private function requireUser(): array|ResponseInterface
    {
        $current = $this->auth->currentUserFromRequest($this->request);
        if (! $current['authenticated']) {
            return $this->jsonEnvelope(401, 'Vui lòng đăng nhập để dùng danh sách yêu thích.', null, [
                'auth' => 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
            ]);
        }

        return $current;
    }

    private function bookId(mixed $bookId): ?int
    {
        if (! is_numeric($bookId) || (int) $bookId < 1) {
            return null;
        }

        return (int) $bookId;
    }

    private function jsonEnvelope(int $statusCode, string $message, mixed $data, ?array $errors): ResponseInterface
    {
        return $this->response
            ->setStatusCode($statusCode)
            ->setHeader('Access-Control-Allow-Origin', '*')
            ->setJSON([
                'status' => $statusCode >= 200 && $statusCode < 300 ? 'success' : 'error',
                'message' => $message,
                'data' => $data,
                'errors' => $errors,
            ]);
    }
}
