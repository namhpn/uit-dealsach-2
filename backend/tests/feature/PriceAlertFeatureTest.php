<?php

use App\Database\Seeds\DealSachDemoSeeder;
use App\Libraries\AuthService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class PriceAlertFeatureTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $seed = DealSachDemoSeeder::class;
    protected $namespace = 'App';

    public function testGuestAlertAndPreferenceRequestsAreRejectedWithVietnameseJson(): void
    {
        foreach ([
            $this->requestGet('/api/user/alerts'),
            $this->requestGet('/api/user/alerts/1'),
            $this->postJson('/api/user/alerts', []),
            $this->patchJson('/api/user/alerts/1', []),
            $this->requestPost('/api/user/alerts/1/pause'),
            $this->requestPost('/api/user/alerts/1/reactivate'),
            $this->requestPost('/api/user/alerts/1/renew'),
            $this->requestPost('/api/user/alerts/1/restart-tracking'),
            $this->requestPost('/api/user/alerts/1/disable'),
            $this->requestGet('/api/user/alert-preferences'),
            $this->patchJson('/api/user/alert-preferences', ['alert_emails_enabled' => false]),
        ] as $result) {
            $result->assertStatus(401);
            $body = $this->json($result);
            $this->assertSame('error', $body['status']);
            $this->assertNull($body['data']);
            $this->assertArrayHasKey('auth', $body['errors']);
        }
    }

    public function testTargetPriceCreationValidationAndDuplicateRules(): void
    {
        $token = $this->createAuthenticatedSession('target-alert@example.com');
        $bookId = $this->bookIdByIsbn('9786041000003');

        foreach ([[], ['target_price' => 0], ['target_price' => -1], ['target_price' => 90000.5], ['target_price' => 'abc']] as $payload) {
            $invalid = $this->postJson('/api/user/alerts', ['book_id' => $bookId, 'alert_type' => 'target_price'] + $payload, $token);
            $invalid->assertStatus(422);
            $this->assertArrayHasKey('target_price', $this->json($invalid)['errors']);
        }

        $create = $this->postJson('/api/user/alerts', ['book_id' => $bookId, 'alert_type' => 'target_price', 'target_price' => 90000], $token);
        $create->assertStatus(201);
        $alert = $this->json($create)['data'];
        $this->assertSame('target_price', $alert['alert_type']);
        $this->assertSame('Active', $alert['status']);
        $this->assertSame(90000, $alert['target_price']);
        $this->assertSame(0, $alert['notification_count']);
        $this->assertNotNull($alert['comparison_price']);
        $this->assertSame(1, $this->db->table('price_alert_events')->where('price_alert_id', $alert['id'])->countAllResults());

        $duplicate = $this->postJson('/api/user/alerts', ['book_id' => $bookId, 'alert_type' => 'target_price', 'target_price' => 90000], $token);
        $duplicate->assertOK();
        $this->assertSame($alert['id'], $this->json($duplicate)['data']['id']);
        $this->assertSame(1, $this->db->table('price_alerts')->where('user_id', $this->userIdByEmail('target-alert@example.com'))->where('book_id', $bookId)->where('target_price', 90000)->countAllResults());

        $otherTarget = $this->postJson('/api/user/alerts', ['book_id' => $bookId, 'alert_type' => 'target_price', 'target_price' => 95000], $token);
        $otherTarget->assertStatus(201);
        $this->assertSame(2, $this->db->table('price_alerts')->where('user_id', $this->userIdByEmail('target-alert@example.com'))->where('book_id', $bookId)->where('alert_type', 'target_price')->countAllResults());
    }

    public function testNewLowestCreationBaselinePendingDuplicateAndCoexistenceRules(): void
    {
        $token = $this->createAuthenticatedSession('lowest-alert@example.com');
        $pricedBookId = $this->bookIdByIsbn('9786041000003');
        $pendingBookId = $this->bookIdByIsbn('9786041000007');

        $withTarget = $this->postJson('/api/user/alerts', ['book_id' => $pricedBookId, 'alert_type' => 'new_lowest_price', 'target_price' => 90000], $token);
        $withTarget->assertStatus(422);

        $target = $this->postJson('/api/user/alerts', ['book_id' => $pricedBookId, 'alert_type' => 'target_price', 'target_price' => 90000], $token);
        $target->assertStatus(201);

        $lowest = $this->postJson('/api/user/alerts', ['book_id' => $pricedBookId, 'alert_type' => 'new_lowest_price'], $token);
        $lowest->assertStatus(201);
        $lowestData = $this->json($lowest)['data'];
        $this->assertSame('new_lowest_price', $lowestData['alert_type']);
        $this->assertFalse($lowestData['baseline_pending']);
        $this->assertNotNull($lowestData['baseline_price']);

        $duplicate = $this->postJson('/api/user/alerts', ['book_id' => $pricedBookId, 'alert_type' => 'new_lowest_price'], $token);
        $duplicate->assertOK();
        $this->assertSame($lowestData['id'], $this->json($duplicate)['data']['id']);

        $pending = $this->postJson('/api/user/alerts', ['book_id' => $pendingBookId, 'alert_type' => 'new_lowest_price'], $token);
        $pending->assertStatus(201);
        $this->assertTrue($this->json($pending)['data']['baseline_pending']);
    }

    public function testListDetailOwnerScopingAndArchivedBookRejection(): void
    {
        $ownerToken = $this->createAuthenticatedSession('owner-alert@example.com');
        $otherToken = $this->createAuthenticatedSession('other-alert@example.com');
        $bookId = $this->bookIdByIsbn('9786041000003');
        $alertId = $this->createTargetAlert($ownerToken, $bookId, 90000);

        $list = $this->requestGet('/api/user/alerts', $ownerToken);
        $list->assertOK();
        $item = $this->json($list)['data']['items'][0];
        $this->assertSame($alertId, $item['id']);
        $this->assertSame('Nhà giả kim', $item['book']['title']);
        $this->assertArrayHasKey('current_lowest_eligible_price', $item);
        $this->assertTrue($item['alert_emails_enabled']);

        $this->requestGet('/api/user/alerts/' . $alertId, $otherToken)->assertStatus(404);
        $this->requestPost('/api/user/alerts/' . $alertId . '/pause', $otherToken)->assertStatus(404);

        $this->db->table('books')->where('id', $bookId)->update(['status' => 'archived']);
        $archived = $this->postJson('/api/user/alerts', ['book_id' => $bookId, 'alert_type' => 'target_price', 'target_price' => 80000], $ownerToken);
        $archived->assertStatus(404);
    }

    public function testTargetUpdateAndLifecycleActions(): void
    {
        $token = $this->createAuthenticatedSession('actions-alert@example.com');
        $bookId = $this->bookIdByIsbn('9786041000003');
        $alertId = $this->createTargetAlert($token, $bookId, 90000);

        $this->db->table('price_alerts')->where('id', $alertId)->update([
            'last_notified_price' => 85000,
            'notification_count' => 2,
        ]);
        $updated = $this->patchJson('/api/user/alerts/' . $alertId, ['target_price' => 88000], $token);
        $updated->assertOK();
        $updatedData = $this->json($updated)['data'];
        $this->assertSame(88000, $updatedData['target_price']);
        $this->assertSame(0, $updatedData['notification_count']);
        $this->assertNull($updatedData['last_notified_price']);

        $paused = $this->requestPost('/api/user/alerts/' . $alertId . '/pause', $token);
        $paused->assertOK();
        $this->assertSame('Paused', $this->json($paused)['data']['status']);
        $this->requestPost('/api/user/alerts/' . $alertId . '/pause', $token)->assertOK();

        $reactivated = $this->requestPost('/api/user/alerts/' . $alertId . '/reactivate', $token);
        $reactivated->assertOK();
        $this->assertSame('Active', $this->json($reactivated)['data']['status']);

        $renewed = $this->requestPost('/api/user/alerts/' . $alertId . '/renew', $token);
        $renewed->assertOK();
        $this->assertSame('Active', $this->json($renewed)['data']['status']);

        $disabled = $this->requestPost('/api/user/alerts/' . $alertId . '/disable', $token);
        $disabled->assertOK();
        $this->assertSame('Disabled', $this->json($disabled)['data']['status']);
        $this->requestPost('/api/user/alerts/' . $alertId . '/reactivate', $token)->assertStatus(409);

        $replacement = $this->postJson('/api/user/alerts', ['book_id' => $bookId, 'alert_type' => 'target_price', 'target_price' => 88000], $token);
        $replacement->assertStatus(201);
        $this->assertNotSame($alertId, $this->json($replacement)['data']['id']);
    }

    public function testExpiredAndDisabledAlertsDoNotBlockCreationAndRestartTrackingWorks(): void
    {
        $token = $this->createAuthenticatedSession('restart-alert@example.com');
        $bookId = $this->bookIdByIsbn('9786041000003');
        $newLowestId = $this->createNewLowestAlert($token, $bookId);

        $this->db->table('price_alerts')->where('id', $newLowestId)->update([
            'last_notified_price' => 120000,
            'notification_count' => 2,
        ]);
        $restart = $this->requestPost('/api/user/alerts/' . $newLowestId . '/restart-tracking', $token);
        $restart->assertOK();
        $restartData = $this->json($restart)['data'];
        $this->assertSame(0, $restartData['notification_count']);
        $this->assertNull($restartData['last_notified_price']);
        $this->assertFalse($restartData['baseline_pending']);

        $this->db->table('price_alerts')->where('id', $newLowestId)->update(['expires_at' => '2026-01-01 00:00:00']);
        $replacement = $this->postJson('/api/user/alerts', ['book_id' => $bookId, 'alert_type' => 'new_lowest_price'], $token);
        $replacement->assertStatus(201);
        $this->assertSame('Expired', $this->db->table('price_alerts')->where('id', $newLowestId)->get()->getFirstRow()->status);
    }

    public function testAlertPreferencesDefaultUpdateAndDoNotChangeAlertStatusesOrSendEmails(): void
    {
        $token = $this->createAuthenticatedSession('prefs-alert@example.com');
        $bookId = $this->bookIdByIsbn('9786041000003');
        $alertId = $this->createTargetAlert($token, $bookId, 90000);

        $default = $this->requestGet('/api/user/alert-preferences', $token);
        $default->assertOK();
        $this->assertTrue($this->json($default)['data']['alert_emails_enabled']);

        $updated = $this->patchJson('/api/user/alert-preferences', ['alert_emails_enabled' => false], $token);
        $updated->assertOK();
        $this->assertFalse($this->json($updated)['data']['alert_emails_enabled']);
        $this->assertSame('Active', $this->db->table('price_alerts')->where('id', $alertId)->get()->getFirstRow()->status);
        $this->assertSame(0, $this->db->table('outbound_emails')->countAllResults());

        $invalid = $this->patchJson('/api/user/alert-preferences', ['alert_emails_enabled' => 'false'], $token);
        $invalid->assertStatus(422);
    }

    public function testInvalidatedOrDeactivatedSessionIsRejected(): void
    {
        $token = $this->createAuthenticatedSession('blocked-alert@example.com');
        $this->db->table('users')->where('normalized_email', 'blocked-alert@example.com')->update(['status' => 'deactivated']);

        $this->requestGet('/api/user/alerts', $token)->assertStatus(401);
        $this->requestGet('/api/user/alert-preferences', $token)->assertStatus(401);
    }

    public function testPublicCatalogAndBuyFlowSmokeStillPassAfterAlertMigration(): void
    {
        foreach (['/api/public/filters', '/api/public/discovery', '/api/public/books'] as $path) {
            $this->requestGet($path)->assertOK();
        }

        $offerId = $this->offerIdByTitle('Nhà giả kim - tái bản');
        $result = $this->requestGet('/go/offers/' . $offerId);
        $result->assertStatus(302);
        $this->assertSame('https://tiki.vn/nha-gia-kim-demo', $result->response()->getHeaderLine('Location'));
    }

    private function createTargetAlert(string $token, int $bookId, int $targetPrice): int
    {
        $result = $this->postJson('/api/user/alerts', ['book_id' => $bookId, 'alert_type' => 'target_price', 'target_price' => $targetPrice], $token);
        $result->assertStatus(201);

        return (int) $this->json($result)['data']['id'];
    }

    private function createNewLowestAlert(string $token, int $bookId): int
    {
        $result = $this->postJson('/api/user/alerts', ['book_id' => $bookId, 'alert_type' => 'new_lowest_price'], $token);
        $result->assertStatus(201);

        return (int) $this->json($result)['data']['id'];
    }

    private function createAuthenticatedSession(string $email): string
    {
        $this->db->table('users')->insert([
            'normalized_email' => $email,
            'display_email' => $email,
            'role' => 'registered',
            'status' => 'active',
            'alert_email_enabled' => 1,
            'created_at' => '2026-05-27 09:00:00',
            'updated_at' => '2026-05-27 09:00:00',
        ]);
        $userId = (int) $this->db->insertID();
        $token = bin2hex(random_bytes(32));

        $this->db->table('user_sessions')->insert([
            'user_id' => $userId,
            'token_hash' => hash('sha256', $token),
            'status' => 'active',
            'issued_at' => '2026-05-27 09:00:00',
            'expires_at' => '2026-06-03 09:00:00',
            'last_seen_at' => '2026-05-27 09:00:00',
            'created_at' => '2026-05-27 09:00:00',
            'updated_at' => '2026-05-27 09:00:00',
        ]);

        return $token;
    }

    private function postJson(string $path, array $payload, ?string $token = null): object
    {
        $request = $this->withHeaders(['Content-Type' => 'application/json'] + ($token === null ? [] : ['Cookie' => AuthService::COOKIE_NAME . '=' . $token]))
            ->withBody(json_encode($payload, JSON_UNESCAPED_UNICODE));

        return $request->post($path);
    }

    private function patchJson(string $path, array $payload, ?string $token = null): object
    {
        $request = $this->withHeaders(['Content-Type' => 'application/json'] + ($token === null ? [] : ['Cookie' => AuthService::COOKIE_NAME . '=' . $token]))
            ->withBody(json_encode($payload, JSON_UNESCAPED_UNICODE));

        return $request->patch($path);
    }

    private function requestGet(string $path, ?string $token = null): object
    {
        return $token === null
            ? $this->withHeaders([])->call('get', $path)
            : $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $token])->call('get', $path);
    }

    private function requestPost(string $path, ?string $token = null): object
    {
        return $token === null
            ? $this->withHeaders([])->call('post', $path)
            : $this->withHeaders(['Cookie' => AuthService::COOKIE_NAME . '=' . $token])->call('post', $path);
    }

    private function bookIdByIsbn(string $isbn): int
    {
        return (int) $this->db->table('books')->select('id')->where('isbn', $isbn)->get()->getFirstRow()->id;
    }

    private function offerIdByTitle(string $title): int
    {
        return (int) $this->db->table('offers')->select('id')->where('external_offer_title', $title)->get()->getFirstRow()->id;
    }

    private function userIdByEmail(string $email): int
    {
        return (int) $this->db->table('users')->select('id')->where('normalized_email', $email)->get()->getFirstRow()->id;
    }

    /**
     * @return array<string, mixed>
     */
    private function json(object $result): array
    {
        $decoded = json_decode($result->getJSON(), true);
        $this->assertIsArray($decoded);

        return $decoded;
    }
}
