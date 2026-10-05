<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Database\Seeders\SuperadminSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use RuntimeException;
use Tests\TestCase;

class SuperadminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['fic.superadmin' => [
            'name' => 'FIC Superadmin',
            'email' => 'Admin@FIC.local',
            'password' => 'admin-pass-123',
        ]]);
    }

    public function test_seeder_creates_a_superadmin_who_can_log_in(): void
    {
        $this->seed(SuperadminSeeder::class);

        $admin = User::sole();
        $this->assertSame('admin@fic.local', $admin->email);
        $this->assertSame(Role::Superadmin, $admin->role);

        $this->postJson('/api/auth/login', ['email' => 'admin@fic.local', 'password' => 'admin-pass-123'])
            ->assertOk()
            ->assertJsonPath('data.role', 'superadmin')
            ->assertJsonPath('data.is_superadmin', true);
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(SuperadminSeeder::class);
        $this->seed(SuperadminSeeder::class);

        $this->assertSame(1, User::where('role', Role::Superadmin)->count());
    }

    public function test_seeder_takes_over_an_account_registered_with_the_superadmin_email(): void
    {
        $squatter = User::factory()->create(['email' => 'admin@fic.local', 'password' => 'squatter-pass-1']);

        $this->seed(SuperadminSeeder::class);

        $squatter->refresh();
        $this->assertSame(Role::Superadmin, $squatter->role);
        $this->postJson('/api/auth/login', ['email' => 'admin@fic.local', 'password' => 'squatter-pass-1'])
            ->assertUnprocessable();
    }

    public function test_seeder_refuses_to_run_without_credentials(): void
    {
        config(['fic.superadmin.password' => null]);

        $this->expectException(RuntimeException::class);

        $this->seed(SuperadminSeeder::class);
    }

    public function test_only_superadmins_pass_the_admin_gate(): void
    {
        $this->assertTrue(Gate::forUser(User::factory()->superadmin()->create())->allows('access-admin'));
        $this->assertFalse(Gate::forUser(User::factory()->create())->allows('access-admin'));
    }
}
