<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_superadmin_resets_a_password_to_the_temporary_one(): void
    {
        $user = User::factory()->create(['password' => 'Old-password-1']);
        DB::table('sessions')->insert(['id' => 'old-session', 'user_id' => $user->id, 'payload' => '', 'last_activity' => time()]);

        $this->actingAs(User::factory()->superadmin()->create())
            ->postJson("/api/admin/users/{$user->id}/reset-password")
            ->assertOk()
            ->assertJsonPath('data.must_change_password', true);

        $user->refresh();
        $this->assertTrue(Hash::check('dost1234', $user->password));
        $this->assertTrue($user->must_change_password);
        $this->assertDatabaseMissing('sessions', ['id' => 'old-session']); // signed out everywhere
    }

    public function test_only_the_superadmin_can_reset_and_not_their_own_account(): void
    {
        $user = User::factory()->create();
        $superadmin = User::factory()->superadmin()->create();

        $this->postJson("/api/admin/users/{$user->id}/reset-password")->assertUnauthorized();
        $this->actingAs(User::factory()->create())->postJson("/api/admin/users/{$user->id}/reset-password")->assertForbidden();
        $this->actingAs(User::factory()->focal()->create())->postJson("/api/admin/users/{$user->id}/reset-password")->assertForbidden();
        $this->actingAs($superadmin)->postJson("/api/admin/users/{$superadmin->id}/reset-password")->assertForbidden();

        $this->assertFalse($user->fresh()->must_change_password);
        $this->assertFalse($superadmin->fresh()->must_change_password);
    }

    public function test_a_reset_account_signs_in_with_the_temporary_password_and_can_only_change_it(): void
    {
        $user = User::factory()->create(['email' => 'reset@example.com']);
        $user->forceFill(['password' => 'dost1234', 'must_change_password' => true])->save();

        $this->postJson('/api/auth/login', ['email' => 'reset@example.com', 'password' => 'dost1234'])
            ->assertOk()
            ->assertJsonPath('data.must_change_password', true);

        // Everything else is refused until the password is changed.
        $this->getJson('/api/summary')->assertForbidden()->assertJsonPath('code', 'password_change_required');
        $this->getJson('/api/my/entries')->assertForbidden();
        $this->getJson('/api/auth/me')->assertOk();

        $this->postJson('/api/auth/change-password', ['password' => 'dost1234', 'password_confirmation' => 'dost1234'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password' => 'other than the temporary one']);
        $this->postJson('/api/auth/change-password', ['password' => 'short', 'password_confirmation' => 'short'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->postJson('/api/auth/change-password', ['password' => 'New-password-2026', 'password_confirmation' => 'New-password-2026'])
            ->assertOk()
            ->assertJsonPath('data.must_change_password', false);

        $this->getJson('/api/summary')->assertOk();
        $this->assertTrue(Hash::check('New-password-2026', $user->fresh()->password));
    }

    public function test_the_temporary_password_stops_working_once_changed(): void
    {
        $user = User::factory()->create(['email' => 'reset@example.com']);
        $user->forceFill(['password' => 'dost1234', 'must_change_password' => true])->save();

        $this->actingAs($user)->postJson('/api/auth/change-password', ['password' => 'New-password-2026', 'password_confirmation' => 'New-password-2026'])->assertOk();
        $this->postJson('/api/auth/logout')->assertNoContent();
        $this->app['auth']->forgetGuards();

        $this->postJson('/api/auth/login', ['email' => 'reset@example.com', 'password' => 'dost1234'])->assertUnprocessable();
        $this->postJson('/api/auth/login', ['email' => 'reset@example.com', 'password' => 'New-password-2026'])->assertOk();
    }

    public function test_a_normal_password_change_needs_the_current_password(): void
    {
        $user = User::factory()->create(['password' => 'Current-pass-1']);

        $this->actingAs($user)
            ->postJson('/api/auth/change-password', ['password' => 'Another-pass-2', 'password_confirmation' => 'Another-pass-2'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password']);
        $this->postJson('/api/auth/change-password', ['current_password' => 'wrong', 'password' => 'Another-pass-2', 'password_confirmation' => 'Another-pass-2'])
            ->assertJsonValidationErrors(['current_password' => 'incorrect']);
        $this->postJson('/api/auth/change-password', ['current_password' => 'Current-pass-1', 'password' => 'Another-pass-2', 'password_confirmation' => 'Another-pass-2'])
            ->assertOk();
    }
}
