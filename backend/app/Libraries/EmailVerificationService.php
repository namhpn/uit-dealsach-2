<?php

namespace App\Libraries;

use App\Models\EmailVerificationCodeModel;
use App\Models\OutboundEmailModel;
use App\Models\UserModel;
use CodeIgniter\Config\Services;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\I18n\Time;
use Config\Email as EmailConfig;
use Config\Database;
use DateTimeImmutable;
use DateTimeZone;

class EmailVerificationService
{
    private const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';
    private const MAX_FAILED_ATTEMPTS = 5;
    private const REQUEST_LIMIT_HOURLY = 5;
    private const REQUEST_LIMIT_DAILY = 10;

    private EmailVerificationCodeModel $codes;
    private OutboundEmailModel $emails;
    private UserModel $users;
    private AuthService $auth;
    private BaseConnection $db;
    private DateTimeImmutable $now;

    public function __construct(?DateTimeImmutable $now = null, ?AuthService $auth = null)
    {
        $this->codes = new EmailVerificationCodeModel();
        $this->emails = new OutboundEmailModel();
        $this->users = new UserModel();
        $this->auth = $auth ?? new AuthService($now);
        $this->db = Database::connect();
        $this->now = $now ?? new DateTimeImmutable(Time::now(self::VIETNAM_TIMEZONE)->toDateTimeString(), new DateTimeZone(self::VIETNAM_TIMEZONE));
    }

    public function normalizeEmail(string $email): string
    {
        return mb_strtolower(trim($email), 'UTF-8');
    }

    public function requestCode(string $email): array
    {
        $normalized = $this->normalizeEmail($email);
        $display = trim($email);
        $neutralMessage = 'Nếu email có thể sử dụng, DealSach đã gửi mã xác minh. Vui lòng kiểm tra hộp thư của bạn.';

        $user = $this->users->where('normalized_email', $normalized)->first();
        if ($user !== null && $user->status === 'deactivated') {
            return [
                'ok' => true,
                'message' => $neutralMessage,
                'data' => ['email' => $normalized, 'resent_after_seconds' => 60],
            ];
        }

        $latest = $this->codes
            ->where('normalized_email', $normalized)
            ->orderBy('requested_at', 'DESC')
            ->orderBy('id', 'DESC')
            ->first();

        if ($latest !== null && (string) $latest->requested_at > $this->now->modify('-60 seconds')->format('Y-m-d H:i:s')) {
            return $this->limited('Bạn vừa yêu cầu mã xác minh. Vui lòng chờ 60 giây rồi thử lại.', ['email' => 'Vui lòng chờ trước khi yêu cầu mã mới.']);
        }

        if ($this->requestCountSince($normalized, $this->now->modify('-1 hour')) >= self::REQUEST_LIMIT_HOURLY) {
            return $this->limited('Bạn đã yêu cầu quá nhiều mã trong 1 giờ. Vui lòng thử lại sau.', ['email' => 'Mỗi email chỉ được yêu cầu tối đa 5 mã trong 1 giờ.']);
        }

        if ($this->requestCountSince($normalized, $this->now->modify('-1 day')) >= self::REQUEST_LIMIT_DAILY) {
            return $this->limited('Bạn đã yêu cầu quá nhiều mã trong hôm nay. Vui lòng thử lại sau.', ['email' => 'Mỗi email chỉ được yêu cầu tối đa 10 mã trong 1 ngày.']);
        }

        $code = (string) random_int(100000, 999999);
        $now = $this->now->format('Y-m-d H:i:s');

        $emailId = 0;
        $this->db->transStart();
        $this->invalidateActiveCodes($normalized);
        $this->codes->insert([
            'normalized_email' => $normalized,
            'display_email' => $display,
            'code_hash' => $this->hashCode($code),
            'status' => 'active',
            'failed_attempts' => 0,
            'requested_at' => $now,
            'expires_at' => $this->now->modify('+10 minutes')->format('Y-m-d H:i:s'),
        ]);
        $emailId = (int) $this->emails->insert([
            'normalized_recipient_email' => $normalized,
            'display_recipient_email' => $display,
            'email_type' => 'email_verification_code',
            'subject' => 'Mã xác minh DealSach',
            'body_text' => sprintf('Mã xác minh DealSach của bạn là %s. Mã có hiệu lực trong 10 phút.', $code),
            'metadata_json' => json_encode(['expires_in_minutes' => 10], JSON_UNESCAPED_UNICODE),
            'status' => 'queued',
        ]);
        $this->db->transComplete();

        if (! $this->db->transStatus()) {
            return [
                'ok' => false,
                'statusCode' => 500,
                'message' => 'DealSach chưa thể tạo mã xác minh. Vui lòng thử lại.',
                'errors' => ['email' => 'Không thể tạo mã xác minh lúc này.'],
            ];
        }

        $this->attemptSmtpDelivery($emailId);

        return [
            'ok' => true,
            'message' => $neutralMessage,
            'data' => ['email' => $normalized, 'resent_after_seconds' => 60],
        ];
    }

    public function verifyCode(string $email, string $code): array
    {
        $normalized = $this->normalizeEmail($email);
        $activeCode = $this->codes
            ->where('normalized_email', $normalized)
            ->where('status', 'active')
            ->orderBy('requested_at', 'DESC')
            ->orderBy('id', 'DESC')
            ->first();

        if ($activeCode === null) {
            return $this->verificationFailed('Mã xác minh không hợp lệ hoặc đã hết hiệu lực.');
        }

        if ((string) $activeCode->expires_at <= $this->now->format('Y-m-d H:i:s')) {
            $this->codes->update((int) $activeCode->id, ['status' => 'expired']);

            return $this->verificationFailed('Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới.');
        }

        if ((int) $activeCode->failed_attempts >= self::MAX_FAILED_ATTEMPTS) {
            $this->codes->update((int) $activeCode->id, ['status' => 'over_attempted']);

            return $this->verificationFailed('Mã xác minh đã nhập sai quá số lần cho phép. Vui lòng yêu cầu mã mới.');
        }

        if (! hash_equals((string) $activeCode->code_hash, $this->hashCode($code))) {
            $failedAttempts = (int) $activeCode->failed_attempts + 1;
            $update = ['failed_attempts' => $failedAttempts];
            if ($failedAttempts >= self::MAX_FAILED_ATTEMPTS) {
                $update['status'] = 'over_attempted';
                $update['invalidated_at'] = $this->now->format('Y-m-d H:i:s');
            }
            $this->codes->update((int) $activeCode->id, $update);

            return $this->verificationFailed('Mã xác minh không đúng. Vui lòng kiểm tra lại.');
        }

        $user = $this->users->where('normalized_email', $normalized)->first();
        if ($user !== null && $user->status === 'deactivated') {
            $this->codes->update((int) $activeCode->id, [
                'status' => 'invalidated',
                'invalidated_at' => $this->now->format('Y-m-d H:i:s'),
            ]);

            return $this->verificationFailed('Email này hiện chưa thể đăng nhập. Vui lòng liên hệ quản trị viên nếu cần hỗ trợ.');
        }

        $this->db->transStart();

        if ($user === null) {
            $userId = (int) $this->users->insert([
                'normalized_email' => $normalized,
                'display_email' => (string) $activeCode->display_email,
                'role' => 'registered',
                'status' => 'active',
                'alert_email_enabled' => 1,
            ]);
            $user = $this->users->find($userId);
        }

        $this->codes->update((int) $activeCode->id, [
            'status' => 'used',
            'used_at' => $this->now->format('Y-m-d H:i:s'),
        ]);
        $this->invalidateActiveCodes($normalized, (int) $activeCode->id);
        $session = $this->auth->createSession((int) $user->id);

        $this->db->transComplete();

        if (! $this->db->transStatus()) {
            return [
                'ok' => false,
                'statusCode' => 500,
                'message' => 'DealSach chưa thể xác minh email. Vui lòng thử lại.',
                'errors' => ['code' => 'Không thể xác minh mã lúc này.'],
            ];
        }

        return [
            'ok' => true,
            'message' => 'Xác minh email thành công.',
            'data' => [
                'user' => $this->publicUser($user),
                'session' => $session,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function publicUser(object $user): array
    {
        return [
            'id' => (int) $user->id,
            'email' => (string) $user->display_email,
            'role' => (string) $user->role,
            'status' => (string) $user->status,
            'alert_email_enabled' => (bool) $user->alert_email_enabled,
        ];
    }

    private function invalidateActiveCodes(string $normalizedEmail, ?int $exceptId = null): void
    {
        $builder = $this->codes
            ->where('normalized_email', $normalizedEmail)
            ->where('status', 'active');

        if ($exceptId !== null) {
            $builder->where('id !=', $exceptId);
        }

        $builder
            ->set([
                'status' => 'invalidated',
                'invalidated_at' => $this->now->format('Y-m-d H:i:s'),
                'updated_at' => $this->now->format('Y-m-d H:i:s'),
            ])
            ->update();
    }

    private function requestCountSince(string $normalizedEmail, DateTimeImmutable $since): int
    {
        return (int) $this->codes
            ->where('normalized_email', $normalizedEmail)
            ->where('requested_at >=', $since->format('Y-m-d H:i:s'))
            ->countAllResults();
    }

    private function hashCode(string $code): string
    {
        return hash('sha256', $code);
    }

    private function limited(string $message, array $errors): array
    {
        return [
            'ok' => false,
            'statusCode' => 429,
            'message' => $message,
            'errors' => $errors,
        ];
    }

    private function verificationFailed(string $message): array
    {
        return [
            'ok' => false,
            'statusCode' => 422,
            'message' => $message,
            'errors' => ['code' => $message],
        ];
    }

    private function attemptSmtpDelivery(int $emailId): void
    {
        if ($emailId <= 0) {
            return;
        }

        $config = config('Email');
        if (! $config instanceof EmailConfig || ! $config->smtpConfigured()) {
            return;
        }

        $emailRow = $this->emails->find($emailId);
        if ($emailRow === null || ! in_array((string) $emailRow->status, ['queued', 'sent'], true)) {
            return;
        }

        $mailer = Services::email();
        $mailer->clear(true);
        $mailer->setFrom($config->fromEmail !== '' ? $config->fromEmail : $config->SMTPUser, $config->fromName !== '' ? $config->fromName : 'DealSach');
        $mailer->setTo((string) $emailRow->display_recipient_email);
        $mailer->setSubject((string) $emailRow->subject);
        $mailer->setMessage((string) $emailRow->body_text);

        if ($mailer->send(false)) {
            $this->emails->update($emailId, ['status' => 'sent']);

            return;
        }

        $this->emails->update($emailId, ['status' => 'failed']);
    }
}
