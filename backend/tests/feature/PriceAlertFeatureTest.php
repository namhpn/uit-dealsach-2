<?php

use App\Database\Seeds\DealSachDemoSeeder;
use App\Libraries\AlertNotificationService;
use App\Libraries\AuthService;
use Config\Database;
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
        $this->assertSame(0, $this->db->table('outbound_emails')->where('normalized_recipient_email', 'prefs-alert@example.com')->countAllResults());

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

    public function testEvaluatorWritesTargetAlertEmailAndAvoidsDuplicateUnchangedNotifications(): void
    {
        $token = $this->createAuthenticatedSession('notify-alert@example.com');
        $bookId = $this->bookIdByIsbn('9786041000003');
        $alertId = $this->createTargetAlert($token, $bookId, 200000);
        $offerId = $this->offerIdByTitle('Nhà giả kim - tái bản');
        $base = $this->nowInVietnam()->setTime(12, 0, 0);

        $this->appendObservation($offerId, 80000, $this->formatDateTime($base));
        $summary = $this->evaluateAt($this->formatDateTime($base->modify('+5 minutes')));

        $this->assertGreaterThanOrEqual(1, $summary['triggered']);
        $this->assertGreaterThanOrEqual(1, $summary['emailed']);
        $email = $this->db->table('outbound_emails')
            ->where('email_type', 'price_alert_target_price')
            ->where('normalized_recipient_email', 'notify-alert@example.com')
            ->orderBy('id', 'DESC')
            ->get()
            ->getFirstRow();
        $this->assertNotNull($email);
        $this->assertStringContainsString('Nhà giả kim', $email->body_text);
        $this->assertStringContainsString('Giá tham khảo được ghi nhận gần đây', $email->body_text);
        $this->assertSame(1, $this->db->table('email_deal_links')->where('price_alert_id', $alertId)->countAllResults());
        $this->assertSame(1, (int) $this->db->table('price_alerts')->where('id', $alertId)->get()->getFirstRow()->notification_count);

        $again = $this->evaluateAt($this->formatDateTime($base->modify('+10 minutes')));
        $this->assertSame(0, $again['triggered']);
        $this->assertSame(1, $this->db->table('outbound_emails')->where('email_type', 'price_alert_target_price')->where('normalized_recipient_email', 'notify-alert@example.com')->countAllResults());
    }

    public function testNewLowestPendingBaselineAndSuppressedPreferenceDoNotWriteTriggeredEmailOrCount(): void
    {
        $token = $this->createAuthenticatedSession('suppressed-alert@example.com');
        $bookId = $this->bookIdByIsbn('9786041000007');
        $alertId = $this->createNewLowestAlert($token, $bookId);
        $offerId = $this->offerIdByTitle('Nghĩ giàu làm giàu');
        $base = $this->nowInVietnam()->setTime(12, 0, 0);

        $this->appendObservation($offerId, 120000, $this->formatDateTime($base));
        $baseline = $this->evaluateAt($this->formatDateTime($base->modify('+5 minutes')));
        $this->assertSame(1, $baseline['baseline_set']);

        $this->patchJson('/api/user/alert-preferences', ['alert_emails_enabled' => false], $token)->assertOK();
        $this->appendObservation($offerId, 110000, $this->formatDateTime($base->modify('+1 hour')));
        $suppressed = $this->evaluateAt($this->formatDateTime($base->modify('+1 hour 5 minutes')));
        $this->assertSame(1, $suppressed['suppressed']);
        $this->assertSame(0, $this->db->table('outbound_emails')->where('email_type', 'price_alert_new_lowest')->where('normalized_recipient_email', 'suppressed-alert@example.com')->countAllResults());
        $this->assertSame(0, $this->db->table('price_alert_events')->where('price_alert_id', $alertId)->where('event_type', 'triggered')->countAllResults());
        $this->assertSame(0, (int) $this->db->table('price_alerts')->where('id', $alertId)->get()->getFirstRow()->notification_count);
    }

    public function testFailedMockEmailRetriesAndDoesNotUpdateSuccessFields(): void
    {
        $token = $this->createAuthenticatedSession('fail-alert@example.com');
        $bookId = $this->bookIdByIsbn('9786041000003');
        $alertId = $this->createTargetAlert($token, $bookId, 200000);
        $base = $this->nowInVietnam()->setTime(12, 0, 0);

        $this->appendObservation($this->offerIdByTitle('Nhà giả kim - tái bản'), 79000, $this->formatDateTime($base));
        $summary = $this->evaluateAt($this->formatDateTime($base->modify('+5 minutes')));

        $this->assertGreaterThanOrEqual(1, $summary['triggered']);
        $this->assertSame(2, $summary['failed']);
        $this->assertSame(2, $this->db->table('outbound_emails')->where('normalized_recipient_email', 'fail-alert@example.com')->where('status', 'failed')->countAllResults());
        $alert = $this->db->table('price_alerts')->where('id', $alertId)->get()->getFirstRow();
        $this->assertSame(0, (int) $alert->notification_count);
        $this->assertNull($alert->last_notified_price);
    }

    public function testDealLinkClickDisableLinkAndAutoPauseAfterThreeSuccessfulEmails(): void
    {
        $token = $this->createAuthenticatedSession('links-alert@example.com');
        $bookId = $this->bookIdByIsbn('9786041000003');
        $alertId = $this->createTargetAlert($token, $bookId, 200000);
        $offerId = $this->offerIdByTitle('Nhà giả kim - tái bản');
        $redirectsBeforeEmailClick = $this->db->table('affiliate_redirects')->countAllResults();
        $base = $this->nowInVietnam()->setTime(12, 0, 0);

        foreach ([80000, 79000, 78000] as $index => $price) {
            $observedAt = $this->formatDateTime($base->modify('+' . $index . ' hour'));
            $evaluatedAt = $this->formatDateTime($base->modify('+' . $index . ' hour +5 minutes'));
            $this->appendObservation($offerId, $price, $observedAt);
            $this->evaluateAt($evaluatedAt);
        }

        $alert = $this->db->table('price_alerts')->where('id', $alertId)->get()->getFirstRow();
        $this->assertSame('Auto-paused', $alert->status);
        $this->assertSame(3, (int) $alert->notification_count);

        $dealLink = $this->db->table('email_deal_links')->where('price_alert_id', $alertId)->orderBy('id', 'ASC')->get()->getFirstRow();
        $dealToken = $this->plainTokenForHash('email_deal_links', (string) $dealLink->token_hash);
        $click = $this->requestGet('/email/deals/' . $dealToken);
        $click->assertStatus(302);
        $this->assertStringEndsWith('/book/' . $bookId . '#offers', $click->response()->getHeaderLine('Location'));
        $this->assertSame(1, $this->db->table('email_deal_link_clicks')->where('email_deal_link_id', $dealLink->id)->countAllResults());
        $this->assertSame($redirectsBeforeEmailClick, $this->db->table('affiliate_redirects')->countAllResults());

        $disableRow = $this->db->table('alert_disable_tokens')->where('price_alert_id', $alertId)->orderBy('id', 'ASC')->get()->getFirstRow();
        $disableToken = $this->plainTokenForHash('alert_disable_tokens', (string) $disableRow->token_hash);
        $disable = $this->requestGet('/alerts/disable/' . $disableToken);
        $disable->assertOK();
        $this->assertSame('Disabled', $this->db->table('price_alerts')->where('id', $alertId)->get()->getFirstRow()->status);
        $this->assertSame(1, $this->db->table('price_alert_events')->where('price_alert_id', $alertId)->where('event_type', 'disabled_by_email_link')->countAllResults());

        $reuse = $this->requestGet('/alerts/disable/' . $disableToken);
        $reuse->assertOK();
        $this->assertStringContainsString('&#273;&atilde; &#273;&#432;&#7907;c t&#7855;t', $reuse->getBody());
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
        $issuedAt = $this->nowInVietnam()->format('Y-m-d H:i:s');
        $expiresAt = $this->nowInVietnam()->modify('+7 days')->format('Y-m-d H:i:s');
        $this->db->table('users')->insert([
            'normalized_email' => $email,
            'display_email' => $email,
            'role' => 'registered',
            'status' => 'active',
            'alert_email_enabled' => 1,
            'created_at' => $issuedAt,
            'updated_at' => $issuedAt,
        ]);
        $userId = (int) $this->db->insertID();
        $token = bin2hex(random_bytes(32));

        $this->db->table('user_sessions')->insert([
            'user_id' => $userId,
            'token_hash' => hash('sha256', $token),
            'status' => 'active',
            'issued_at' => $issuedAt,
            'expires_at' => $expiresAt,
            'last_seen_at' => $issuedAt,
            'created_at' => $issuedAt,
            'updated_at' => $issuedAt,
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

    /**
     * @return array<string, int>
     */
    private function evaluateAt(string $now): array
    {
        return (new AlertNotificationService(Database::connect(), new DateTimeImmutable($now, new DateTimeZone('Asia/Ho_Chi_Minh'))))->evaluate();
    }

    private function appendObservation(int $offerId, int $price, string $observedAt): void
    {
        $offer = $this->db->table('offers o')
            ->select('o.*, b.status AS book_status, r.status AS retailer_status, m.status AS merchant_status, m.retailer_platform_id AS merchant_retailer_platform_id')
            ->join('books b', 'b.id = o.book_id')
            ->join('retailer_platforms r', 'r.id = o.retailer_platform_id')
            ->join('merchants m', 'm.id = o.merchant_id')
            ->where('o.id', $offerId)
            ->get()
            ->getFirstRow();

        $cycleId = (int) $this->db->table('observation_cycles')->select('id')->orderBy('id', 'DESC')->get()->getFirstRow()->id;
        $this->db->table('price_observations')->insert([
            'offer_id' => $offerId,
            'observation_cycle_id' => $cycleId,
            'observed_at' => $observedAt,
            'availability_status' => 'available',
            'listed_item_price' => $price,
            'book_status_at_observation' => $offer->book_status,
            'offer_status_at_observation' => $offer->status,
            'retailer_status_at_observation' => $offer->retailer_status,
            'merchant_status_at_observation' => $offer->merchant_status,
            'merchant_retailer_consistent_at_observation' => (int) $offer->merchant_retailer_platform_id === (int) $offer->retailer_platform_id ? 1 : 0,
            'destination_status_at_observation' => $offer->destination_status,
            'created_at' => $observedAt,
            'updated_at' => $observedAt,
        ]);
    }

    private function plainTokenForHash(string $table, string $hash): string
    {
        $email = $this->db->table('outbound_emails')
            ->orderBy('id', 'ASC')
            ->get()
            ->getResult();

        foreach ($email as $row) {
            if (! preg_match_all('#/(?:email/deals|alerts/disable)/([a-f0-9]{48})#', (string) $row->body_text, $matches)) {
                continue;
            }

            foreach ($matches[1] as $token) {
                if (hash('sha256', $token) === $hash) {
                    return $token;
                }
            }
        }

        $this->fail('Missing plain token for ' . $table);
    }

    private function nowInVietnam(): DateTimeImmutable
    {
        return new DateTimeImmutable('now', new DateTimeZone('Asia/Ho_Chi_Minh'));
    }

    private function formatDateTime(DateTimeImmutable $time): string
    {
        return $time->format('Y-m-d H:i:s');
    }
}
