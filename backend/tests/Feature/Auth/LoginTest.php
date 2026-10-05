<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_log_in_and_the_login_is_recorded(): void
    {
        $user = User::factory()->create(['email' => 'juan@example.com']);

        $this->withHeader('User-Agent', 'FIC Test Browser')
            ->withServerVariables(['REMOTE_ADDR' => '203.0.113.7'])
            ->postJson('/api/auth/login', ['email' => 'juan@example.com', 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);

        $this->assertAuthenticatedAs($user, 'web');
        $this->assertDatabaseHas('login_activities', [
            'user_id' => $user->id,
            'ip_address' => '203.0.113.7',
            'user_agent' => 'FIC Test Browser',
        ]);
    }

    public function test_email_is_matched_case_insensitively(): void
    {
        User::factory()->create(['email' => 'juan@example.com']);

        $this->postJson('/api/auth/login', ['email' => 'Juan@Example.com', 'password' => 'password'])
            ->assertOk();
    }

    public function test_wrong_password_is_rejected_and_not_recorded(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'wrong-password'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertGuest('web');
        $this->assertDatabaseCount('login_activities', 0);
    }

    public function test_login_attempts_are_rate_limited(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'wrong-password'])
                ->assertUnprocessable();
        }

        // Even the right password is refused until the window passes.
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password'])
            ->assertTooManyRequests()
            ->assertHeader('Retry-After');

        $this->assertGuest('web');
    }

    public function test_user_can_log_out(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password'])->assertOk();

        $this->postJson('/api/auth/logout')->assertNoContent();

        $this->assertGuest('web');
    }

    public function test_me_returns_the_current_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.is_superadmin', false);
    }

    public function test_guests_get_401_from_protected_endpoints(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
        $this->postJson('/api/auth/logout')->assertUnauthorized();
    }
}
