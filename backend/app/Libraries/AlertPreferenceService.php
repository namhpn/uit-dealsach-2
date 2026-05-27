<?php

namespace App\Libraries;

use App\Models\UserAlertPreferenceModel;

class AlertPreferenceService
{
    private UserAlertPreferenceModel $preferences;

    public function __construct()
    {
        $this->preferences = new UserAlertPreferenceModel();
    }

    /**
     * @return array{alert_emails_enabled: bool}
     */
    public function getForUser(int $userId): array
    {
        $row = $this->preferences->find($userId);

        return [
            'alert_emails_enabled' => $row === null ? true : (bool) $row->alert_emails_enabled,
        ];
    }

    /**
     * @return array{ok: bool, statusCode: int, message: string, data?: array<string, bool>, errors?: array<string, string>}
     */
    public function updateForUser(int $userId, array $payload): array
    {
        if (! array_key_exists('alert_emails_enabled', $payload) || ! is_bool($payload['alert_emails_enabled'])) {
            return [
                'ok' => false,
                'statusCode' => 422,
                'message' => 'Tùy chọn nhận email cảnh báo chưa hợp lệ.',
                'errors' => ['alert_emails_enabled' => 'Giá trị phải là true hoặc false.'],
            ];
        }

        $data = [
            'user_id' => $userId,
            'alert_emails_enabled' => $payload['alert_emails_enabled'] ? 1 : 0,
        ];

        if ($this->preferences->find($userId) === null) {
            $this->preferences->insert($data);
        } else {
            $this->preferences->update($userId, $data);
        }

        return [
            'ok' => true,
            'statusCode' => 200,
            'message' => 'Đã cập nhật tùy chọn email cảnh báo.',
            'data' => $this->getForUser($userId),
        ];
    }
}
