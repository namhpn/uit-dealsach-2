<?php

namespace App\Controllers;

use App\Libraries\AdminAuditService;
use App\Libraries\AdminCatalogService;
use App\Libraries\AdminService;
use App\Libraries\AuthService;
use CodeIgniter\HTTP\ResponseInterface;

class AdminController extends BaseController
{
    private AuthService $auth;
    private AdminService $admin;
    private AdminAuditService $audit;
    private AdminCatalogService $catalog;

    public function __construct()
    {
        $this->auth = new AuthService();
        $this->admin = new AdminService();
        $this->audit = new AdminAuditService();
        $this->catalog = new AdminCatalogService();
    }

    public function me(): ResponseInterface
    {
        $current = $this->requireAdmin();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        return $this->jsonEnvelope(200, 'Phiên quản trị hợp lệ.', [
            'authenticated' => true,
            'admin' => $this->publicUser($current['user']),
        ], null);
    }

    public function users(): ResponseInterface
    {
        $current = $this->requireAdmin();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        return $this->jsonEnvelope(200, 'Danh sách người dùng.', ['items' => $this->admin->listUsers($this->request->getGet())], null);
    }

    public function user($userId = null): ResponseInterface
    {
        $current = $this->requireAdmin();
        if ($current instanceof ResponseInterface) {
            return $current;
        }
        $id = $this->positiveId($userId, 'user_id');
        if ($id instanceof ResponseInterface) {
            return $id;
        }
        $user = $this->admin->userDetail($id);
        if ($user === null) {
            return $this->jsonEnvelope(404, 'Không tìm thấy người dùng.', null, ['user' => 'Người dùng không tồn tại.']);
        }

        return $this->jsonEnvelope(200, 'Chi tiết người dùng.', $user, null);
    }

    public function deactivateUser($userId = null): ResponseInterface
    {
        return $this->userAction($userId, 'deactivateUser');
    }

    public function reactivateUser($userId = null): ResponseInterface
    {
        return $this->userAction($userId, 'reactivateUser');
    }

    public function alerts(): ResponseInterface
    {
        $current = $this->requireAdmin();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        return $this->jsonEnvelope(200, 'Danh sách hoạt động cảnh báo.', ['items' => $this->admin->listAlerts()], null);
    }

    public function alert($alertId = null): ResponseInterface
    {
        $current = $this->requireAdmin();
        if ($current instanceof ResponseInterface) {
            return $current;
        }
        $id = $this->positiveId($alertId, 'alert_id');
        if ($id instanceof ResponseInterface) {
            return $id;
        }
        $alert = $this->admin->alertDetail($id);
        if ($alert === null) {
            return $this->jsonEnvelope(404, 'Không tìm thấy cảnh báo.', null, ['alert' => 'Cảnh báo không tồn tại.']);
        }

        return $this->jsonEnvelope(200, 'Chi tiết cảnh báo.', $alert, null);
    }

    public function disableAlert($alertId = null): ResponseInterface
    {
        $current = $this->requireAdmin();
        if ($current instanceof ResponseInterface) {
            return $current;
        }
        $id = $this->positiveId($alertId, 'alert_id');
        if ($id instanceof ResponseInterface) {
            return $id;
        }

        return $this->result($this->admin->disableAlert($current['user'], $id));
    }

    public function audit(): ResponseInterface
    {
        $current = $this->requireAdmin();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        return $this->jsonEnvelope(200, 'Nhật ký kiểm toán Admin.', ['items' => $this->audit->list()], null);
    }

    public function categories(): ResponseInterface
    {
        return $this->catalogRead('listCategories');
    }

    public function createCategory(): ResponseInterface
    {
        return $this->catalogMutation('createCategory');
    }

    public function updateCategory($categoryId = null): ResponseInterface
    {
        return $this->catalogMutationById($categoryId, 'category_id', 'updateCategory');
    }

    public function archiveCategory($categoryId = null): ResponseInterface
    {
        return $this->catalogStatus($categoryId, 'category_id', 'setCategoryStatus', 'archived');
    }

    public function restoreCategory($categoryId = null): ResponseInterface
    {
        return $this->catalogStatus($categoryId, 'category_id', 'setCategoryStatus', 'active');
    }

    public function books(): ResponseInterface
    {
        return $this->catalogRead('listBooks');
    }

    public function book($bookId = null): ResponseInterface
    {
        return $this->catalogShow($bookId, 'book_id', 'bookDetail', 'Không tìm thấy sách.');
    }

    public function createBook(): ResponseInterface
    {
        return $this->catalogMutation('createBook');
    }

    public function updateBook($bookId = null): ResponseInterface
    {
        return $this->catalogMutationById($bookId, 'book_id', 'updateBook');
    }

    public function archiveBook($bookId = null): ResponseInterface
    {
        return $this->catalogActorId($bookId, 'book_id', 'archiveBook');
    }

    public function restoreBook($bookId = null): ResponseInterface
    {
        return $this->catalogActorId($bookId, 'book_id', 'restoreBook');
    }

    public function retailers(): ResponseInterface
    {
        return $this->catalogRead('listRetailers');
    }

    public function createRetailer(): ResponseInterface
    {
        return $this->catalogMutation('createRetailer');
    }

    public function updateRetailer($retailerId = null): ResponseInterface
    {
        return $this->catalogMutationById($retailerId, 'retailer_id', 'updateRetailer');
    }

    public function archiveRetailer($retailerId = null): ResponseInterface
    {
        return $this->catalogStatus($retailerId, 'retailer_id', 'setRetailerStatus', 'archived');
    }

    public function restoreRetailer($retailerId = null): ResponseInterface
    {
        return $this->catalogStatus($retailerId, 'retailer_id', 'setRetailerStatus', 'active');
    }

    public function merchants(): ResponseInterface
    {
        return $this->catalogRead('listMerchants');
    }

    public function createMerchant(): ResponseInterface
    {
        return $this->catalogMutation('createMerchant');
    }

    public function updateMerchant($merchantId = null): ResponseInterface
    {
        return $this->catalogMutationById($merchantId, 'merchant_id', 'updateMerchant');
    }

    public function archiveMerchant($merchantId = null): ResponseInterface
    {
        return $this->catalogStatus($merchantId, 'merchant_id', 'setMerchantStatus', 'archived');
    }

    public function restoreMerchant($merchantId = null): ResponseInterface
    {
        return $this->catalogStatus($merchantId, 'merchant_id', 'setMerchantStatus', 'active');
    }

    public function offers(): ResponseInterface
    {
        return $this->catalogRead('listOffers');
    }

    public function offer($offerId = null): ResponseInterface
    {
        return $this->catalogShow($offerId, 'offer_id', 'offerDetail', 'Không tìm thấy ưu đãi.');
    }

    public function createOffer(): ResponseInterface
    {
        return $this->catalogMutation('createOffer');
    }

    public function updateOffer($offerId = null): ResponseInterface
    {
        return $this->catalogMutationById($offerId, 'offer_id', 'updateOffer');
    }

    public function offerObservations($offerId = null): ResponseInterface
    {
        return $this->catalogShow($offerId, 'offer_id', 'offerObservations', 'Không tìm thấy ưu đãi.');
    }

    public function addOfferObservation($offerId = null): ResponseInterface
    {
        return $this->catalogActorId($offerId, 'offer_id', 'addObservation', $this->body());
    }

    private function userAction(mixed $userId, string $method): ResponseInterface
    {
        $current = $this->requireAdmin();
        if ($current instanceof ResponseInterface) {
            return $current;
        }
        $id = $this->positiveId($userId, 'user_id');
        if ($id instanceof ResponseInterface) {
            return $id;
        }

        return $this->result($this->admin->{$method}($current['user'], $id));
    }

    private function catalogRead(string $method): ResponseInterface
    {
        $current = $this->requireAdmin();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        return $this->jsonEnvelope(200, 'Dữ liệu quản trị catalog.', $this->catalog->{$method}($this->request->getGet()), null);
    }

    private function catalogShow(mixed $idValue, string $field, string $method, string $notFound): ResponseInterface
    {
        $current = $this->requireAdmin();
        if ($current instanceof ResponseInterface) {
            return $current;
        }
        $id = $this->positiveId($idValue, $field);
        if ($id instanceof ResponseInterface) {
            return $id;
        }
        $data = $this->catalog->{$method}($id);
        if ($data === null) {
            return $this->jsonEnvelope(404, $notFound, null, [$field => 'Bản ghi không tồn tại.']);
        }

        return $this->jsonEnvelope(200, 'Chi tiết quản trị catalog.', $data, null);
    }

    private function catalogMutation(string $method): ResponseInterface
    {
        $current = $this->requireAdmin();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        return $this->result($this->catalog->{$method}($current['user'], $this->body()));
    }

    private function catalogMutationById(mixed $idValue, string $field, string $method): ResponseInterface
    {
        return $this->catalogActorId($idValue, $field, $method, $this->body());
    }

    private function catalogStatus(mixed $idValue, string $field, string $method, string $status): ResponseInterface
    {
        return $this->catalogActorId($idValue, $field, $method, $status);
    }

    private function catalogActorId(mixed $idValue, string $field, string $method, mixed $extra = null): ResponseInterface
    {
        $current = $this->requireAdmin();
        if ($current instanceof ResponseInterface) {
            return $current;
        }
        $id = $this->positiveId($idValue, $field);
        if ($id instanceof ResponseInterface) {
            return $id;
        }
        $result = $extra === null
            ? $this->catalog->{$method}($current['user'], $id)
            : $this->catalog->{$method}($current['user'], $id, $extra);

        return $this->result($result);
    }

    private function body(): array
    {
        $body = $this->request->getJSON(true);

        return is_array($body) ? $body : $this->request->getPost();
    }

    private function requireAdmin(): array|ResponseInterface
    {
        $current = $this->auth->currentUserFromRequest($this->request);
        if (! $current['authenticated']) {
            return $this->jsonEnvelope(401, 'Vui lòng đăng nhập bằng tài khoản Admin.', null, ['auth' => 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.']);
        }
        if ((string) $current['user']->role !== 'admin') {
            return $this->jsonEnvelope(403, 'Tài khoản này không có quyền quản trị.', null, ['auth' => 'Chỉ Admin mới được truy cập khu vực này.']);
        }

        return $current;
    }

    private function positiveId(mixed $value, string $field): int|ResponseInterface
    {
        if (! is_numeric($value) || (int) $value < 1) {
            return $this->jsonEnvelope(422, 'Mã định danh chưa hợp lệ.', null, [$field => 'Mã phải là số nguyên dương.']);
        }

        return (int) $value;
    }

    private function result(array $result): ResponseInterface
    {
        return $this->jsonEnvelope($result['statusCode'], $result['message'], $result['data'] ?? null, $result['errors'] ?? null);
    }

    private function publicUser(object $user): array
    {
        return [
            'id' => (int) $user->id,
            'email' => (string) $user->display_email,
            'role' => (string) $user->role,
            'status' => (string) $user->status,
            'alert_email_enabled' => (bool) $user->alert_email_enabled,
        ];
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
