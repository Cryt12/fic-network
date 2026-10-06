<?php

namespace Tests\Feature\Auth;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\FicEntryTest;
use Tests\SeedsPlaces;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase, SeedsPlaces;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedPlaces();
    }

    private function payload(array $overrides = []): array
    {
        return [
            'name' => 'Maria Santos',
            'email' => 'maria@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'entry' => FicEntryTest::validEntry(),
            ...$overrides,
        ];
    }

    public function test_user_can_register_and_is_logged_in(): void
    {
        $this->postJson('/api/auth/register', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.email', 'maria@example.com')
            ->assertJsonPath('data.role', 'user')
            ->assertJsonMissingPath('data.password');

        $user = User::sole();
        $this->assertAuthenticatedAs($user, 'web');
        $this->assertSame(Role::User, $user->role);
        $this->assertSame(1, $user->loginActivities()->count());
        $this->assertSame('Butuan Food Innovation Center', $user->ficEntries()->sole()->name);
    }

    public function test_signup_requires_valid_fic_details_and_creates_nothing_otherwise(): void
    {
        $this->postJson('/api/auth/register', $this->payload(['entry' => FicEntryTest::validEntry(['latitude' => 200, 'name' => ''])]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['entry.latitude', 'entry.name']);

        $this->postJson('/api/auth/register', $this->payload(['entry' => null]))
            ->assertJsonValidationErrors(['entry.region', 'entry.latitude', 'entry.lto_status']);

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('fic_entries', 0);
    }

    public function test_role_cannot_be_chosen_at_signup(): void
    {
        $this->postJson('/api/auth/register', $this->payload(['role' => 'superadmin']))
            ->assertCreated()
            ->assertJsonPath('data.role', 'user');

        $this->assertSame(Role::User, User::sole()->role);
    }

    public function test_superadmin_email_cannot_be_registered(): void
    {
        config(['fic.superadmin.email' => 'Boss@FIC.local']);

        $this->postJson('/api/auth/register', $this->payload(['email' => 'boss@fic.local']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_email_must_be_unique_regardless_of_case(): void
    {
        User::factory()->create(['email' => 'maria@example.com']);

        $this->postJson('/api/auth/register', $this->payload(['email' => 'Maria@Example.COM']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_password_rules_are_enforced(): void
    {
        foreach (['short1', 'lettersonly', '12345678'] as $password) {
            $this->postJson('/api/auth/register', $this->payload([
                'password' => $password,
                'password_confirmation' => $password,
            ]))->assertJsonValidationErrors('password');
        }

        $this->postJson('/api/auth/register', $this->payload(['password_confirmation' => 'different1']))
            ->assertJsonValidationErrors('password');

        $this->assertDatabaseCount('users', 0);
    }
}
