<?php

namespace App\Controllers;

use App\Libraries\AlertNotificationService;
use CodeIgniter\HTTP\ResponseInterface;

class AlertEmailLinkController extends BaseController
{
    private AlertNotificationService $service;

    public function __construct()
    {
        $this->service = new AlertNotificationService();
    }

    public function deal($token = null): ResponseInterface
    {
        $token = is_string($token) ? $token : '';
        $result = $this->service->recordDealLinkClick(
            $token,
            $this->request->getIPAddress(),
            $this->request->getUserAgent()?->getAgentString(),
        );

        if (($result['statusCode'] ?? 500) === 302 && isset($result['redirect'])) {
            return redirect()->to($result['redirect']);
        }

        return $this->message((int) $result['statusCode'], $result['message']);
    }

    public function disable($token = null): ResponseInterface
    {
        $token = is_string($token) ? $token : '';
        $result = $this->service->disableByToken($token);

        return $this->message($result['statusCode'], $result['message']);
    }

    private function message(int $statusCode, string $message): ResponseInterface
    {
        return $this->response
            ->setStatusCode($statusCode)
            ->setBody('<!doctype html><html lang="vi"><meta charset="utf-8"><title>DealSach</title><body><main style="font-family:sans-serif;max-width:640px;margin:48px auto;line-height:1.6"><h1>DealSach</h1><p>' . esc($message) . '</p><p><a href="/">Về trang chủ DealSach</a></p></main></body></html>');
    }
}
