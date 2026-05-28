<?php

use App\Libraries\AuthService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class CorsFeatureTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $namespace = 'App';

    public function testAuthPreflightReturnsConfiguredCorsHeaders(): void
    {
        $response = $this
            ->withHeaders([
                'Origin' => 'http://localhost:5173',
                'Access-Control-Request-Method' => 'POST',
                'Access-Control-Request-Headers' => 'content-type',
            ])
            ->call('options', '/api/auth/email-code/request');

        $response->assertStatus(204);
        $this->assertSame('http://localhost:5173', $response->response()->getHeaderLine('Access-Control-Allow-Origin'));
        $this->assertSame('true', $response->response()->getHeaderLine('Access-Control-Allow-Credentials'));
        $this->assertStringContainsString('POST', $response->response()->getHeaderLine('Access-Control-Allow-Methods'));
        $this->assertStringContainsString('Content-Type', $response->response()->getHeaderLine('Access-Control-Allow-Headers'));
        $this->assertStringContainsString('Authorization', $response->response()->getHeaderLine('Access-Control-Allow-Headers'));
    }

    public function testCredentialedAuthAdminAndUserResponsesReturnCorsHeaders(): void
    {
        $authResponse = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Content-Type' => 'application/json',
        ])->withBody(json_encode(['email' => 'admin@dealsach.test'], JSON_UNESCAPED_UNICODE))
            ->post('/api/auth/email-code/request');

        $authResponse->assertOK();
        $this->assertSame('http://localhost:5173', $authResponse->response()->getHeaderLine('Access-Control-Allow-Origin'));
        $this->assertSame('true', $authResponse->response()->getHeaderLine('Access-Control-Allow-Credentials'));

        $adminId = $this->insertUser('admin@dealsach.test', 'admin');
        $adminToken = (new AuthService())->createSession($adminId)['token'];
        $adminResponse = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Cookie' => AuthService::COOKIE_NAME . '=' . $adminToken,
        ])->get('/api/admin/me');

        $adminResponse->assertOK();
        $this->assertSame('http://localhost:5173', $adminResponse->response()->getHeaderLine('Access-Control-Allow-Origin'));
        $this->assertSame('true', $adminResponse->response()->getHeaderLine('Access-Control-Allow-Credentials'));

    }

    private function insertUser(string $email, string $role): int
    {
        $this->db->table('users')->insert([
            'normalized_email' => $email,
            'display_email' => $email,
            'role' => $role,
            'status' => 'active',
            'alert_email_enabled' => 1,
            'created_at' => '2026-05-28 08:00:00',
            'updated_at' => '2026-05-28 08:00:00',
        ]);

        return (int) $this->db->insertID();
    }
}
