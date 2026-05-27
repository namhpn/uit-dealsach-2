<?php

namespace App\Controllers;

use App\Libraries\AdminAuditService;
use App\Libraries\AdminService;
use App\Libraries\AuthService;
use CodeIgniter\HTTP\ResponseInterface;

class AdminController extends BaseController
{
    private AuthService $auth;
    private AdminService $admin;
    private AdminAuditService $audit;

    public function __construct()
    {
        $this->auth = new AuthService();
        $this->admin = new AdminService();
        $this->audit = new AdminAuditService();
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
