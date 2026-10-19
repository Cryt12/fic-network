<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\FicEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\SeedsPlaces;
use Tests\TestCase;

class FocalAccountTest extends TestCase
{
    use RefreshDatabase, SeedsPlaces;

    private function payload(array $overrides = []): array
    {
        return [
            'region' => 'XIII',
            'first_name' => 'Liza',
            'middle_name' => 'Reyes',
            'last_name' => 'Ocampo',
            'age' => 38,
            'position' => 'Science Research Specialist II',
            'dost_unit' => 'Technical Services Division',
            'email' => 'liza@dost.gov.ph',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            ...$overrides,
        ];
    }

    public function test_a_regional_office_can_sign_up_as_focal(): void
    {
        $this->postJson('/api/auth/register-focal', $this->payload(['role' => 'superadmin']))
            ->assertCreated()
            ->assertJsonPath('data.role', 'focal')
            ->assertJsonPath('data.role_label', 'DOST FIC Focal')
            ->assertJsonPath('data.name', 'Liza Reyes Ocampo')
            ->assertJsonPath('data.region_name', 'Region XIII (Caraga)')
            ->assertJsonPath('data.can_add_entries', false)
            ->assertJsonPath('data.can_view_all_entries', true);

        $user = User::sole();
        $this->assertSame(Role::Focal, $user->role); // "role" in the body is ignored
        $this->assertSame('Technical Services Division', $user->dost_unit);
        $this->assertSame(38, $user->age);
        $this->assertAuthenticatedAs($user, 'web');
        $this->assertDatabaseCount('fic_entries', 0);
    }

    public function test_focal_signup_is_validated(): void
    {
        $this->postJson('/api/auth/register-focal', $this->payload(['first_name' => '', 'age' => 15, 'region' => 'XXI', 'dost_unit' => '']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['first_name', 'age', 'region', 'dost_unit']);

        // Middle name is optional.
        $this->postJson('/api/auth/register-focal', $this->payload(['middle_name' => null]))->assertCreated()->assertJsonPath('data.name', 'Liza Ocampo');
    }

    public function test_focal_accounts_are_read_only(): void
    {
        $this->seedPlaces();
        $focal = User::factory()->focal()->create();
        $entry = FicEntry::factory()->create();

        $this->actingAs($focal)->postJson('/api/entries', FicEntryTest::validEntry())->assertForbidden();
        $this->actingAs($focal)->putJson("/api/entries/{$entry->id}", FicEntryTest::validEntry())->assertForbidden();
        $this->actingAs($focal)->deleteJson("/api/entries/{$entry->id}")->assertForbidden();
        $this->assertDatabaseCount('fic_entries', 1);
    }

    public function test_focal_accounts_see_all_entries_and_the_excel_report_but_not_users(): void
    {
        $focal = User::factory()->focal()->create();
        FicEntry::factory()->create(['region' => 'XIII']);
        FicEntry::factory()->create(['region' => 'VII']);

        $this->actingAs($focal)->getJson('/api/admin/entries')->assertOk()->assertJsonCount(2, 'data');
        $this->actingAs($focal)->get('/api/admin/entries/export')->assertOk();
        $this->actingAs($focal)->getJson('/api/admin/users')->assertForbidden();
        $this->actingAs($focal)->getJson('/api/map/markers')->assertOk()->assertJsonCount(2, 'data');
    }
}
