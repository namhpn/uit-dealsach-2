<?php

namespace App\Libraries;

use App\Models\UserModel;
use App\Models\UserSessionModel;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\I18n\Time;
use DateTimeImmutable;
use DateTimeZone;

class AuthService
{
    public const COOKIE_NAME = 'dealsach_session';

    private const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

    private UserModel $users;
    private UserSessionModel $sessions;
    private DateTimeImmutable $now;

    public function __construct(?DateTimeImmutable $now = null)
    {
        $this->users = new UserModel();
        $this->sessions = new UserSessionModel();
        $this->now = $now ?? new DateTimeImmutable(Time::now(self::VIETNAM_TIMEZONE)->toDateTimeString(), new DateTimeZone(self::VIETNAM_TIMEZONE));
    }

    public function createSession(int $userId): array
    {
        $token = bin2hex(random_bytes(32));
        $issuedAt = $this->now;
        $expiresAt = $this->now->modify('+7 days');

        $this->sessions->insert([
            'user_id' => $userId,
            'token_hash' => $this->hashToken($token),
            'status' => 'active',
            'issued_at' => $issuedAt->format('Y-m-d H:i:s'),
            'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
            'last_seen_at' => $issuedAt->format('Y-m-d H:i:s'),
        ]);

        return [
            'token' => $token,
            'expires_at' => $expiresAt,
        ];
    }

    public function currentUserFromRequest(IncomingRequest $request): array
    {
        $token = $this->tokenFromRequest($request);
        if ($token === null) {
            return ['authenticated' => false, 'user' => null, 'session' => null];
        }

        $session = $this->sessions
            ->where('token_hash', $this->hashToken($token))
            ->where('status', 'active')
            ->first();

        if ($session === null) {
            return ['authenticated' => false, 'user' => null, 'session' => null];
        }

        if ((string) $session->expires_at <= $this->now->format('Y-m-d H:i:s')) {
            $this->invalidateSession((int) $session->id, 'expired');

            return ['authenticated' => false, 'user' => null, 'session' => null];
        }

        $user = $this->users->find((int) $session->user_id);
        if ($user === null || $user->status !== 'active') {
            $this->invalidateSession((int) $session->id, 'invalidated');

            return ['authenticated' => false, 'user' => null, 'session' => null];
        }

        $this->sessions->update((int) $session->id, [
            'last_seen_at' => $this->now->format('Y-m-d H:i:s'),
        ]);

        return ['authenticated' => true, 'user' => $user, 'session' => $session];
    }

    public function logoutFromRequest(IncomingRequest $request): void
    {
        $token = $this->tokenFromRequest($request);
        if ($token === null) {
            return;
        }

        $session = $this->sessions
            ->where('token_hash', $this->hashToken($token))
            ->where('status', 'active')
            ->first();

        if ($session !== null) {
            $this->invalidateSession((int) $session->id, 'logged_out');
        }
    }

    public function invalidateActiveSessionsForUser(int $userId): void
    {
        $this->sessions
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->set([
                'status' => 'invalidated',
                'invalidated_at' => $this->now->format('Y-m-d H:i:s'),
                'updated_at' => $this->now->format('Y-m-d H:i:s'),
            ])
            ->update();
    }

    private function invalidateSession(int $sessionId, string $status): void
    {
        $this->sessions->update($sessionId, [
            'status' => $status,
            'invalidated_at' => $this->now->format('Y-m-d H:i:s'),
        ]);
    }

    private function tokenFromRequest(IncomingRequest $request): ?string
    {
        $token = $request->getCookie(self::COOKIE_NAME);
        if (is_string($token) && $token !== '') {
            return $token;
        }

        $cookieHeader = $request->getHeaderLine('Cookie');
        if ($cookieHeader === '') {
            return null;
        }

        foreach (explode(';', $cookieHeader) as $cookie) {
            [$name, $value] = array_pad(explode('=', trim($cookie), 2), 2, '');
            if ($name === self::COOKIE_NAME && $value !== '') {
                return urldecode($value);
            }
        }

        return null;
    }

    private function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }
}
