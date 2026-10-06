<?php

namespace Tests\Feature\Auth;

use App\Models\FailedLoginAttempt;
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

    public function test_login_time_is_stored_without_a_timezone_shift(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password'])->assertOk();

        $loggedInAt = $user->loginActivities()->sole()->logged_in_at;
        $this->assertLessThan(60, abs(now()->diffInSeconds($loggedInAt)));
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

    public function test_five_wrong_passwords_block_login_without_saying_how_many_are_allowed(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'wrong-password'])
                ->assertUnprocessable();
        }

        // Even the right password is refused until the block expires.
        $response = $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password'])
            ->assertTooManyRequests()
            ->assertHeader('Retry-After');

        $this->assertMatchesRegularExpression('/^Too many login attempts\. Try again in \d+ seconds\.$/', $response->json('message'));
        $this->assertGuest('web');

        $this->travel(61)->seconds();
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password'])->assertOk();
    }

    public function test_successful_logins_do_not_use_up_attempts(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 4; $i++) {
            $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'wrong-password']);
        }
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password'])->assertOk();
        $this->postJson('/api/auth/logout')->assertNoContent();

        // The success reset the count, so four more mistakes are still allowed.
        for ($i = 0; $i < 4; $i++) {
            $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'wrong-password'])->assertUnprocessable();
        }
    }

    public function test_failed_attempts_are_recorded_without_the_password(): void
    {
        $user = User::factory()->create(['email' => 'juan@example.com']);

        $this->withHeader('User-Agent', 'FIC Test Browser')
            ->postJson('/api/auth/login', ['email' => 'Juan@Example.com', 'password' => 'not-my-password']);
        $this->postJson('/api/auth/login', ['email' => 'nobody@example.com', 'password' => 'whatever-123']);

        $this->assertDatabaseHas('failed_login_attempts', [
            'user_id' => $user->id, 'email' => 'juan@example.com', 'reason' => 'wrong_password', 'user_agent' => 'FIC Test Browser',
        ]);
        $this->assertDatabaseHas('failed_login_attempts', ['user_id' => null, 'email' => 'nobody@example.com', 'reason' => 'unknown_email']);

        $stored = json_encode(FailedLoginAttempt::all()->toArray());
        $this->assertStringNotContainsString('not-my-password', $stored);
        $this->assertStringNotContainsString('whatever-123', $stored);
    }

    public function test_tries_while_blocked_are_recorded_as_locked_out(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 7; $i++) {
            $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'wrong-password']);
        }

        $this->assertSame(5, $user->failedLoginAttempts()->where('reason', 'wrong_password')->count());
        $this->assertSame(2, $user->failedLoginAttempts()->where('reason', 'locked_out')->count());
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
