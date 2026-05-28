<?php

namespace App\Controllers;

use App\Libraries\PublicCatalogService;
use CodeIgniter\HTTP\ResponseInterface;

class PublicCatalogController extends BaseController
{
    private PublicCatalogService $catalog;

    public function __construct()
    {
        $this->catalog = new PublicCatalogService();
    }

    public function books(): ResponseInterface
    {
        $result = $this->catalog->listBooks($this->request->getGet());

        if (! $result['ok']) {
            return $this->apiResponse()->setStatusCode(422)->setJSON([
                'status' => 'error',
                'message' => 'Tham số tìm kiếm hoặc bộ lọc chưa hợp lệ.',
                'data' => null,
                'errors' => $result['errors'],
            ]);
        }

        return $this->apiResponse()->setJSON([
            'status' => 'success',
            'message' => 'Danh sách sách công khai.',
            'data' => $result['data'],
            'errors' => null,
        ]);
    }

    public function book($bookId = null): ResponseInterface
    {
        if (! ctype_digit((string) $bookId)) {
            return $this->notFound();
        }

        $detail = $this->catalog->bookDetail((int) $bookId);
        if ($detail === null) {
            return $this->notFound();
        }

        return $this->apiResponse()->setJSON([
            'status' => 'success',
            'message' => 'Chi tiết sách công khai.',
            'data' => $detail,
            'errors' => null,
        ]);
    }

    public function discovery(): ResponseInterface
    {
        return $this->apiResponse()->setJSON([
            'status' => 'success',
            'message' => 'Dữ liệu khám phá công khai.',
            'data' => $this->catalog->discovery(),
            'errors' => null,
        ]);
    }

    public function filters(): ResponseInterface
    {
        return $this->apiResponse()->setJSON([
            'status' => 'success',
            'message' => 'Bộ lọc công khai.',
            'data' => $this->catalog->filters(),
            'errors' => null,
        ]);
    }

    public function suggestions(): ResponseInterface
    {
        $query = trim((string) $this->request->getGet('q'));
        $limit = (int) ($this->request->getGet('limit') ?? 6);

        return $this->apiResponse()->setJSON([
            'status' => 'success',
            'message' => 'Gợi ý tìm kiếm công khai.',
            'data' => [
                'query' => $query,
                'items' => $this->catalog->searchSuggestions($query, $limit),
                'limit' => max(1, min($limit, 6)),
            ],
            'errors' => null,
        ]);
    }

    private function notFound(): ResponseInterface
    {
        return $this->apiResponse()->setStatusCode(404)->setJSON([
            'status' => 'error',
            'message' => 'Không tìm thấy sách công khai phù hợp.',
            'data' => null,
            'errors' => ['book' => 'Sách không tồn tại hoặc không còn hiển thị công khai.'],
        ]);
    }

    private function apiResponse(): ResponseInterface
    {
        return $this->response;
    }
}
