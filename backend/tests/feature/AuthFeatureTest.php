<?php

use App\Libraries\AuthService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class AuthFeatureTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $namespace = 'App';

    public function testEmailCodeRequestValidatesEmailAndDoesNotExposeCode(): void
    {
        $invalid = $this->json($this->postJson('/api/auth/email-code/request', ['email' => 'khong-hop-le']));
        $this->assertSame('error', $invalid['status']);
        $this->assertSame('Vui lòng nhập địa chỉ email hợp lệ.', $invalid['errors']['email']);

        $result = $this->postJson('/api/auth/email-code/request', ['email' => ' Tester@Example.COM ']);
        $result->assertOK();
        $body = $this->json($result);

        $this->assertSame('success', $body['status']);
        $this->assertSame('tester@example.com', $body['data']['email']);
        $this->assertStringNotContainsString($this->latestOutboxCode('tester@example.com'), $result->getJSON());
        $this->assertSame(1, $this->db->table('outbound_emails')->where('normalized_recipient_email', 'tester@example.com')->countAllResults());
        $this->assertSame(1, $this->db->table('email_verification_codes')->where('normalized_email', 'tester@example.com')->where('status', 'active')->countAllResults());
    }

    public function testRequestCooldownAndHourlyAndDailyLimitsAreEnforced(): void
    {
        $this->postJson('/api/auth/email-code/request', ['email' => 'limit@example.com'])->assertOK();

        $cooldown = $this->postJson('/api/auth/email-code/request', ['email' => 'limit@example.com']);
        $cooldown->assertStatus(429);
        $this->assertSame('error', $this->json($cooldown)['status']);

        $this->db->table('email_verification_codes')
            ->where('normalized_email', 'limit@example.com')
            ->update(['requested_at' => $this->vietnamTime(-120), 'expires_at' => $this->vietnamTime(480)]);

        for ($i = 0; $i < 4; $i++) {
            $this->db->table('email_verification_codes')->insert($this->codeRow('limit@example.com', $this->vietnamTime(-180 - $i)));
        }

        $hourly = $this->postJson('/api/auth/email-code/request', ['email' => 'limit@example.com']);
        $hourly->assertStatus(429);
        $this->assertSame('Mỗi email chỉ được yêu cầu tối đa 5 mã trong 1 giờ.', $this->json($hourly)['errors']['email']);

        $this->db->table('email_verification_codes')
            ->where('normalized_email', 'limit@example.com')
            ->update(['requested_at' => $this->vietnamTime(-7200), 'expires_at' => $this->vietnamTime(-6600)]);

        for ($i = 0; $i < 5; $i++) {
            $this->db->table('email_verification_codes')->insert($this->codeRow('limit@example.com', $this->vietnamTime(-7600 - $i)));
        }

        $daily = $this->postJson('/api/auth/email-code/request', ['email' => 'limit@example.com']);
        $daily->assertStatus(429);
        $this->assertSame('Mỗi email chỉ được yêu cầu tối đa 10 mã trong 1 ngày.', $this->json($daily)['errors']['email']);
    }

    public function testNewRequestInvalidatesPreviousUnusedCode(): void
    {
        $this->postJson('/api/auth/email-code/request', ['email' => 'reuse@example.com'])->assertOK();
        $firstId = (int) $this->db->table('email_verification_codes')->select('id')->where('normalized_email', 'reuse@example.com')->get()->getFirstRow()->id;
        $this->db->table('email_verification_codes')
            ->where('id', $firstId)
            ->update(['requested_at' => '2026-05-27 07:00:00', 'expires_at' => '2026-05-27 07:10:00']);

        $this->postJson('/api/auth/email-code/request', ['email' => 'reuse@example.com'])->assertOK();

        $this->assertSame('invalidated', $this->db->table('email_verification_codes')->where('id', $firstId)->get()->getFirstRow()->status);
        $this->assertSame(1, $this->db->table('email_verification_codes')->where('normalized_email', 'reuse@example.com')->where('status', 'active')->countAllResults());
    }

    public function testVerifyCreatesUserSessionCookieAndMeReturnsCurrentUser(): void
    {
        $this->postJson('/api/auth/email-code/request', ['email' => 'login@example.com'])->assertOK();
        $code = $this->latestOutboxCode('login@example.com');

        $verify = $this->postJson('/api/auth/email-code/verify', ['email' => 'login@example.com', 'code' => $code]);
        $verify->assertOK();
        $verify->assertCookie(AuthService::COOKIE_NAME);
        $body = $this->json($verify);
        $this->assertSame('login@example.com', $body['data']['user']['email']);
        $this->assertSame('registered', $body['data']['user']['role']);
        $this->assertSame(1, $this->db->table('users')->where('normalized_email', 'login@example.com')->countAllResults());
        $this->assertSame(1, $this->db->table('user_sessions')->where('status', 'active')->countAllResults());

        $token = $verify->response()->getCookie(AuthService::COOKIE_NAME)->getValue();
        $me = $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $token])->get('/api/auth/me');
        $me->assertOK();
        $this->assertTrue($this->json($me)['data']['authenticated']);
    }

    public function testVerifyExistingUserDoesNotCreateDuplicateAndSupportsMultipleSessions(): void
    {
        $this->db->table('users')->insert([
            'normalized_email' => 'existing@example.com',
            'display_email' => 'existing@example.com',
            'role' => 'registered',
            'status' => 'active',
            'alert_email_enabled' => 1,
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);

        for ($i = 0; $i < 2; $i++) {
            $this->postJson('/api/auth/email-code/request', ['email' => 'existing@example.com'])->assertOK();
            $code = $this->latestOutboxCode('existing@example.com');
            $this->postJson('/api/auth/email-code/verify', ['email' => 'existing@example.com', 'code' => $code])->assertOK();
            $this->db->table('email_verification_codes')->where('normalized_email', 'existing@example.com')->update([
                'requested_at' => '2026-05-27 07:00:00',
                'expires_at' => '2026-05-27 07:10:00',
            ]);
        }

        $this->assertSame(1, $this->db->table('users')->where('normalized_email', 'existing@example.com')->countAllResults());
        $this->assertSame(2, $this->db->table('user_sessions')->where('status', 'active')->countAllResults());
    }

    public function testWrongExpiredUsedAndOverAttemptedCodesCannotBeUsed(): void
    {
        $this->postJson('/api/auth/email-code/request', ['email' => 'attempts@example.com'])->assertOK();
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/email-code/verify', ['email' => 'attempts@example.com', 'code' => '000000'])->assertStatus(422);
        }
        $this->assertSame('over_attempted', $this->db->table('email_verification_codes')->where('normalized_email', 'attempts@example.com')->get()->getFirstRow()->status);
        $this->postJson('/api/auth/email-code/verify', ['email' => 'attempts@example.com', 'code' => $this->latestOutboxCode('attempts@example.com')])->assertStatus(422);

        $this->postJson('/api/auth/email-code/request', ['email' => 'expired@example.com'])->assertOK();
        $this->db->table('email_verification_codes')->where('normalized_email', 'expired@example.com')->update([
            'requested_at' => '2026-05-27 07:00:00',
            'expires_at' => '2026-05-27 07:10:00',
        ]);
        $this->postJson('/api/auth/email-code/verify', ['email' => 'expired@example.com', 'code' => $this->latestOutboxCode('expired@example.com')])->assertStatus(422);

        $this->postJson('/api/auth/email-code/request', ['email' => 'used@example.com'])->assertOK();
        $usedCode = $this->latestOutboxCode('used@example.com');
        $this->postJson('/api/auth/email-code/verify', ['email' => 'used@example.com', 'code' => $usedCode])->assertOK();
        $this->postJson('/api/auth/email-code/verify', ['email' => 'used@example.com', 'code' => $usedCode])->assertStatus(422);
    }

    public function testGuestExpiredDeactivatedAndLogoutSessionStates(): void
    {
        $guest = $this->json($this->get('/api/auth/me'));
        $this->assertFalse($guest['data']['authenticated']);

        $this->postJson('/api/auth/email-code/request', ['email' => 'session@example.com'])->assertOK();
        $verify = $this->postJson('/api/auth/email-code/verify', ['email' => 'session@example.com', 'code' => $this->latestOutboxCode('session@example.com')]);
        $token = $verify->response()->getCookie(AuthService::COOKIE_NAME)->getValue();

        $this->db->table('user_sessions')->update(['expires_at' => '2026-05-27 07:00:00']);
        $expired = $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $token])->get('/api/auth/me');
        $this->assertFalse($this->json($expired)['data']['authenticated']);
        $this->assertSame('expired', $this->db->table('user_sessions')->get()->getFirstRow()->status);

        $this->postJson('/api/auth/email-code/request', ['email' => 'deactivated@example.com'])->assertOK();
        $deactivatedVerify = $this->postJson('/api/auth/email-code/verify', ['email' => 'deactivated@example.com', 'code' => $this->latestOutboxCode('deactivated@example.com')]);
        $deactivatedToken = $deactivatedVerify->response()->getCookie(AuthService::COOKIE_NAME)->getValue();
        $this->db->table('users')->where('normalized_email', 'deactivated@example.com')->update(['status' => 'deactivated']);
        $deactivated = $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $deactivatedToken])->get('/api/auth/me');
        $this->assertFalse($this->json($deactivated)['data']['authenticated']);
        $this->assertSame('invalidated', $this->db->table('user_sessions')->where('token_hash', hash('sha256', $deactivatedToken))->get()->getFirstRow()->status);

        $this->postJson('/api/auth/email-code/request', ['email' => 'logout@example.com'])->assertOK();
        $logoutVerify = $this->postJson('/api/auth/email-code/verify', ['email' => 'logout@example.com', 'code' => $this->latestOutboxCode('logout@example.com')]);
        $logoutToken = $logoutVerify->response()->getCookie(AuthService::COOKIE_NAME)->getValue();
        $logout = $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $logoutToken])->post('/api/auth/logout');
        $logout->assertOK();
        $logout->assertCookie(AuthService::COOKIE_NAME, '');
        $this->assertSame('logged_out', $this->db->table('user_sessions')->where('token_hash', hash('sha256', $logoutToken))->get()->getFirstRow()->status);
    }

    public function testDeactivatedUsersCannotRequestOrVerifyLoginCode(): void
    {
        $this->db->table('users')->insert([
            'normalized_email' => 'blocked@example.com',
            'display_email' => 'blocked@example.com',
            'role' => 'registered',
            'status' => 'deactivated',
            'alert_email_enabled' => 1,
            'created_at' => '2026-05-27 08:00:00',
            'updated_at' => '2026-05-27 08:00:00',
        ]);

        $this->postJson('/api/auth/email-code/request', ['email' => 'blocked@example.com'])->assertOK();
        $this->assertSame(0, $this->db->table('outbound_emails')->where('normalized_recipient_email', 'blocked@example.com')->countAllResults());

        $this->db->table('email_verification_codes')->insert($this->codeRow('blocked@example.com', '2026-05-27 08:00:00', hash('sha256', '123456')));
        $this->postJson('/api/auth/email-code/verify', ['email' => 'blocked@example.com', 'code' => '123456'])->assertStatus(422);
        $this->assertSame(0, $this->db->table('user_sessions')->countAllResults());
    }

    private function postJson(string $path, array $payload): object
    {
        return $this->withHeaders(['Content-Type' => 'application/json'])
            ->withBody(json_encode($payload, JSON_UNESCAPED_UNICODE))
            ->post($path);
    }

    private function latestOutboxCode(string $normalizedEmail): string
    {
        $row = $this->db->table('outbound_emails')
            ->where('normalized_recipient_email', $normalizedEmail)
            ->orderBy('id', 'DESC')
            ->get()
            ->getFirstRow();

        $this->assertNotNull($row);
        preg_match('/\b(\d{6})\b/', (string) $row->body_text, $matches);
        $this->assertArrayHasKey(1, $matches);

        return $matches[1];
    }

    private function codeRow(string $email, string $requestedAt, ?string $hash = null): array
    {
        return [
            'normalized_email' => $email,
            'display_email' => $email,
            'code_hash' => $hash ?? hash('sha256', '111111'),
            'status' => 'active',
            'failed_attempts' => 0,
            'requested_at' => $requestedAt,
            'expires_at' => date('Y-m-d H:i:s', strtotime($requestedAt . ' +10 minutes')),
            'created_at' => $requestedAt,
            'updated_at' => $requestedAt,
        ];
    }

    private function vietnamTime(int $offsetSeconds): string
    {
        return (new DateTimeImmutable('now', new DateTimeZone('Asia/Ho_Chi_Minh')))
            ->modify(sprintf('%+d seconds', $offsetSeconds))
            ->format('Y-m-d H:i:s');
    }

    private function json(object $result): array
    {
        $decoded = json_decode($result->getJSON(), true);
        $this->assertIsArray($decoded);

        return $decoded;
    }
}
