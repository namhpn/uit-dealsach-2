<?php

namespace App\Controllers;

use App\Libraries\AuthService;
use App\Libraries\PriceAlertService;
use CodeIgniter\HTTP\ResponseInterface;

class PriceAlertController extends BaseController
{
    private AuthService $auth;
    private PriceAlertService $alerts;

    public function __construct()
    {
        $this->auth = new AuthService();
        $this->alerts = new PriceAlertService();
    }

    public function index(): ResponseInterface
    {
        $current = $this->requireUser();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        return $this->jsonEnvelope(200, 'Danh sách cảnh báo giá hiện tại.', [
            'items' => $this->alerts->listForUser((int) $current['user']->id),
        ], null);
    }

    public function show($alertId = null): ResponseInterface
    {
        $current = $this->requireUser();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        $id = $this->positiveId($alertId, 'alert_id');
        if ($id instanceof ResponseInterface) {
            return $id;
        }

        $alert = $this->alerts->detailForUser((int) $current['user']->id, $id);
        if ($alert === null) {
            return $this->jsonEnvelope(404, 'Không tìm thấy cảnh báo phù hợp.', null, [
                'alert' => 'Cảnh báo không tồn tại hoặc bạn không có quyền truy cập.',
            ]);
        }

        return $this->jsonEnvelope(200, 'Chi tiết cảnh báo giá.', $alert, null);
    }

    public function create(): ResponseInterface
    {
        $current = $this->requireUser();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        return $this->result($this->alerts->create((int) $current['user']->id, $this->payload()));
    }

    public function update($alertId = null): ResponseInterface
    {
        $current = $this->requireUser();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        $id = $this->positiveId($alertId, 'alert_id');
        if ($id instanceof ResponseInterface) {
            return $id;
        }

        return $this->result($this->alerts->updateTargetPrice((int) $current['user']->id, $id, $this->payload()));
    }

    public function pause($alertId = null): ResponseInterface
    {
        return $this->action($alertId, 'pause');
    }

    public function reactivate($alertId = null): ResponseInterface
    {
        return $this->action($alertId, 'reactivate');
    }

    public function renew($alertId = null): ResponseInterface
    {
        return $this->action($alertId, 'renew');
    }

    public function restartTracking($alertId = null): ResponseInterface
    {
        return $this->action($alertId, 'restartTracking');
    }

    public function disable($alertId = null): ResponseInterface
    {
        return $this->action($alertId, 'disable');
    }

    private function action(mixed $alertId, string $method): ResponseInterface
    {
        $current = $this->requireUser();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        $id = $this->positiveId($alertId, 'alert_id');
        if ($id instanceof ResponseInterface) {
            return $id;
        }

        return $this->result($this->alerts->{$method}((int) $current['user']->id, $id));
    }

    /**
     * @return array<string, mixed>|ResponseInterface
     */
    private function requireUser(): array|ResponseInterface
    {
        $current = $this->auth->currentUserFromRequest($this->request);
        if (! $current['authenticated']) {
            return $this->jsonEnvelope(401, 'Vui lòng đăng nhập để quản lý cảnh báo giá.', null, [
                'auth' => 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
            ]);
        }

        return $current;
    }

    private function positiveId(mixed $value, string $field): int|ResponseInterface
    {
        if (! is_numeric($value) || (int) $value < 1) {
            return $this->jsonEnvelope(422, 'Mã cảnh báo chưa hợp lệ.', null, [$field => 'Mã cảnh báo phải là số nguyên dương.']);
        }

        return (int) $value;
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(): array
    {
        $json = $this->request->getJSON(true);

        return is_array($json) ? $json : $this->request->getPost();
    }

    private function result(array $result): ResponseInterface
    {
        return $this->jsonEnvelope($result['statusCode'], $result['message'], $result['data'] ?? null, $result['errors'] ?? null);
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
