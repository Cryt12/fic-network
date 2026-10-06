<?php

namespace Tests\Feature;

use App\Enums\LoginFailure;
use App\Models\FailedLoginAttempt;
use App\Models\FicEntry;
use App\Models\LoginActivity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUsersTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->superadmin()->create(['name' => 'Admin']);
    }

    public function test_only_the_superadmin_can_see_users(): void
    {
        $member = User::factory()->create();

        $urls = ['/api/admin/users', "/api/admin/users/{$member->id}", "/api/admin/users/{$member->id}/login-history"];

        foreach ($urls as $url) {
            $this->getJson($url)->assertUnauthorized();
        }
        foreach ($urls as $url) {
            $this->actingAs($member)->getJson($url)->assertForbidden();
        }
    }

    public function test_lists_every_account_with_activity_counts(): void
    {
        $maria = User::factory()->create(['name' => 'Maria Clara Santos']);
        FicEntry::factory()->count(2)->for($maria)->create();
        LoginActivity::factory()->count(3)->for($maria)->create(['logged_in_at' => now()->subHour()]);
        FailedLoginAttempt::factory()->count(4)->for($maria)->create();
        User::factory()->create(['name' => 'Never Logged In']);

        $users = collect($this->actingAs($this->admin)->getJson('/api/admin/users')->assertOk()->json('data'))->keyBy('name');

        $this->assertCount(3, $users);
        $this->assertSame(2, $users['Maria Clara Santos']['entries_count']);
        $this->assertSame(3, $users['Maria Clara Santos']['logins_count']);
        $this->assertSame(4, $users['Maria Clara Santos']['failed_logins_count']);
        $this->assertNotNull($users['Maria Clara Santos']['last_login_at']);
        $this->assertNull($users['Never Logged In']['last_login_at']);
    }

    public function test_search_role_filter_and_sorting(): void
    {
        $risky = User::factory()->create(['name' => 'Risky Person']);
        FailedLoginAttempt::factory()->count(5)->for($risky)->create();
        User::factory()->create(['name' => 'Calm Person']);

        $names = fn (string $query) => array_column($this->actingAs($this->admin)->getJson("/api/admin/users?{$query}")->json('data'), 'name');

        $this->assertSame(['Risky Person'], $names('search=risky'));
        $this->assertSame(['Admin'], $names('role=superadmin'));
        $this->assertSame('Risky Person', $names('sort=failed_logins')[0]);
        $this->assertSame(['Admin', 'Calm Person', 'Risky Person'], $names('sort=name'));
    }

    public function test_login_history_merges_logins_and_failures_newest_first(): void
    {
        $user = User::factory()->create();
        LoginActivity::factory()->for($user)->create(['logged_in_at' => now()->subHours(3)]);
        FailedLoginAttempt::factory()->for($user)->create(['attempted_at' => now()->subHours(2), 'ip_address' => '203.0.113.9']);
        FailedLoginAttempt::factory()->for($user)->create(['attempted_at' => now()->subHour(), 'reason' => LoginFailure::LockedOut]);
        LoginActivity::factory()->create(); // someone else's

        $history = $this->actingAs($this->admin)
            ->getJson("/api/admin/users/{$user->id}/login-history")
            ->assertOk()
            ->assertJsonPath('total', 3)
            ->json('data');

        $this->assertSame(['locked_out', 'wrong_password', 'success'], array_column($history, 'result'));
        $this->assertSame('203.0.113.9', $history[1]['ip_address']);
    }

    public function test_entries_can_be_filtered_by_who_submitted_them(): void
    {
        $maria = User::factory()->create();
        $mine = FicEntry::factory()->for($maria)->create();
        FicEntry::factory()->create();

        $this->actingAs($this->admin)
            ->getJson("/api/admin/entries?user={$maria->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mine->id);
    }
}
