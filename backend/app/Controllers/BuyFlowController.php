<?php

namespace App\Controllers;

use App\Libraries\BuyFlowService;
use CodeIgniter\HTTP\ResponseInterface;

class BuyFlowController extends BaseController
{
    private BuyFlowService $buyFlow;

    public function __construct()
    {
        $this->buyFlow = new BuyFlowService();
    }

    public function offer($offerId = null): ResponseInterface|string
    {
        if (! ctype_digit((string) $offerId)) {
            return $this->failurePage('Đường dẫn mua không hợp lệ.', 404);
        }

        $result = $this->buyFlow->handleOfferClick((int) $offerId);

        if ($result['status'] === 'redirect') {
            return redirect()->to($result['destination']);
        }

        return $this->failurePage($result['message'], $result['status'] === 'not_found' ? 404 : 409);
    }

    private function failurePage(string $message, int $statusCode): ResponseInterface
    {
        $body = '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Không thể mở liên kết mua</title></head><body style="font-family:Arial,sans-serif;background:#fcf9f8;color:#1b1c1c;margin:0;padding:32px"><main style="max-width:680px;margin:0 auto;border:3px solid #000;background:#fff;padding:24px;box-shadow:8px 8px 0 #000"><h1>Không thể mở liên kết mua</h1><p>' . esc($message) . '</p><p>DealSach chỉ chuyển bạn đến nơi bán bên ngoài khi liên kết đã được kiểm tra. Vui lòng quay lại trang sách và chọn ưu đãi khác.</p><a href="/" style="color:#003527;font-weight:700">Về trang chủ DealSach</a></main></body></html>';

        return $this->response
            ->setStatusCode($statusCode)
            ->setContentType('text/html', 'UTF-8')
            ->setBody($body);
    }
}
