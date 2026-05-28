<?php

namespace App\Controllers;

use App\Libraries\AuthService;
use App\Libraries\EmailVerificationService;
use CodeIgniter\Cookie\Cookie;
use CodeIgniter\HTTP\ResponseInterface;

class AuthController extends BaseController
{
    private AuthService $auth;
    private EmailVerificationService $verification;

    public function __construct()
    {
        $this->auth = new AuthService();
        $this->verification = new EmailVerificationService(null, $this->auth);
    }

    public function requestEmailCode(): ResponseInterface
    {
        $body = $this->jsonBody();
        $email = (string) ($body['email'] ?? '');

        if (! filter_var(trim($email), FILTER_VALIDATE_EMAIL)) {
            return $this->jsonEnvelope(422, 'Email chưa hợp lệ.', null, [
                'email' => 'Vui lòng nhập địa chỉ email hợp lệ.',
            ]);
        }

        $result = $this->verification->requestCode($email);

        if (! $result['ok']) {
            return $this->jsonEnvelope($result['statusCode'], $result['message'], null, $result['errors']);
        }

        return $this->jsonEnvelope(200, $result['message'], $result['data'], null);
    }

    public function verifyEmailCode(): ResponseInterface
    {
        $body = $this->jsonBody();
        $email = (string) ($body['email'] ?? '');
        $code = trim((string) ($body['code'] ?? ''));
        $errors = [];

        if (! filter_var(trim($email), FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Vui lòng nhập địa chỉ email hợp lệ.';
        }

        if (! preg_match('/^\d{6}$/', $code)) {
            $errors['code'] = 'Vui lòng nhập mã xác minh gồm 6 chữ số.';
        }

        if ($errors !== []) {
            return $this->jsonEnvelope(422, 'Thông tin xác minh chưa hợp lệ.', null, $errors);
        }

        $result = $this->verification->verifyCode($email, $code);

        if (! $result['ok']) {
            return $this->jsonEnvelope($result['statusCode'], $result['message'], null, $result['errors']);
        }

        $response = $this->jsonEnvelope(200, $result['message'], [
            'user' => $result['data']['user'],
            'session_expires_at' => $result['data']['session']['expires_at']->format(DATE_ATOM),
        ], null);

        return $response->setCookie(
            AuthService::COOKIE_NAME,
            $result['data']['session']['token'],
            7 * 24 * 60 * 60,
            '',
            '/',
            '',
            false,
            true,
            'Lax',
        );
    }

    public function me(): ResponseInterface
    {
        $current = $this->auth->currentUserFromRequest($this->request);

        if (! $current['authenticated']) {
            return $this->jsonEnvelope(200, 'Bạn đang xem DealSach với trạng thái khách.', [
                'authenticated' => false,
                'user' => null,
            ], null);
        }

        return $this->jsonEnvelope(200, 'Thông tin tài khoản hiện tại.', [
            'authenticated' => true,
            'user' => $this->verification->publicUser($current['user']),
        ], null);
    }

    public function logout(): ResponseInterface
    {
        $this->auth->logoutFromRequest($this->request);

        return $this->jsonEnvelope(200, 'Đăng xuất thành công.', [
            'authenticated' => false,
            'user' => null,
        ], null)->setCookie(new Cookie(AuthService::COOKIE_NAME, '', [
            'expires' => time() - 3600,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]));
    }

    /**
     * @return array<string, mixed>
     */
    private function jsonBody(): array
    {
        $json = $this->request->getJSON(true);
        if (is_array($json)) {
            return $json;
        }

        $post = $this->request->getPost();

        return is_array($post) ? $post : [];
    }

    private function jsonEnvelope(int $statusCode, string $message, mixed $data, ?array $errors): ResponseInterface
    {
        return $this->response
            ->setStatusCode($statusCode)
            ->setJSON([
                'status' => $statusCode >= 200 && $statusCode < 300 ? 'success' : 'error',
                'message' => $message,
                'data' => $data,
                'errors' => $errors,
            ]);
    }
}
