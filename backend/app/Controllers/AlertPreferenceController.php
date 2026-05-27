<?php

namespace App\Controllers;

use App\Libraries\AlertPreferenceService;
use App\Libraries\AuthService;
use CodeIgniter\HTTP\ResponseInterface;

class AlertPreferenceController extends BaseController
{
    private AuthService $auth;
    private AlertPreferenceService $preferences;

    public function __construct()
    {
        $this->auth = new AuthService();
        $this->preferences = new AlertPreferenceService();
    }

    public function show(): ResponseInterface
    {
        $current = $this->requireUser();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        return $this->jsonEnvelope(200, 'Tùy chọn email cảnh báo.', $this->preferences->getForUser((int) $current['user']->id), null);
    }

    public function update(): ResponseInterface
    {
        $current = $this->requireUser();
        if ($current instanceof ResponseInterface) {
            return $current;
        }

        $json = $this->request->getJSON(true);
        $result = $this->preferences->updateForUser((int) $current['user']->id, is_array($json) ? $json : $this->request->getPost());

        return $this->jsonEnvelope($result['statusCode'], $result['message'], $result['data'] ?? null, $result['errors'] ?? null);
    }

    /**
     * @return array<string, mixed>|ResponseInterface
     */
    private function requireUser(): array|ResponseInterface
    {
        $current = $this->auth->currentUserFromRequest($this->request);
        if (! $current['authenticated']) {
            return $this->jsonEnvelope(401, 'Vui lòng đăng nhập để quản lý tùy chọn cảnh báo.', null, [
                'auth' => 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
            ]);
        }

        return $current;
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
