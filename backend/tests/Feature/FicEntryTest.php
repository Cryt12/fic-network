<?php

namespace Tests\Feature;

use App\Models\FicEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\SeedsPlaces;
use Tests\TestCase;

class FicEntryTest extends TestCase
{
    use RefreshDatabase, SeedsPlaces;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedPlaces();
    }

    public static function validEntry(array $overrides = []): array
    {
        return [
            'region' => 'XIII',
            'province_code' => '160200000',
            'city_code' => '160202000',
            'barangay_code' => '160202007',
            'latitude' => 8.9475123,
            'longitude' => 125.5406456,
            'name' => 'Butuan Food Innovation Center',
            'host_institution' => 'Caraga State University',
            'products_developed' => 12,
            'products_commercialized' => 4,
            'lto_status' => 'in_process',
            'msmes_needing_fabrication' => 3,
            'msmes_needing_fabrication_details' => 'Banana chip makers need a vacuum fryer.',
            'msmes_needing_tech_interventions' => 5,
            'msmes_served' => 40,
            'assistance_types' => ['product_development', 'packaging_labeling'],
            'assistance_other' => null,
            ...$overrides,
        ];
    }

    public function test_a_user_can_create_an_entry(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/entries', self::validEntry())
            ->assertCreated()
            ->assertJsonPath('data.name', 'Butuan Food Innovation Center')
            ->assertJsonPath('data.region_name', 'Region XIII (Caraga)')
            ->assertJsonPath('data.province', 'Agusan del Norte')
            ->assertJsonPath('data.city', 'City of Butuan')
            ->assertJsonPath('data.barangay', 'Ampayon')
            ->assertJsonPath('data.latitude', 8.9475123)
            ->assertJsonPath('data.assistance_types', ['product_development', 'packaging_labeling'])
            ->assertJsonPath('data.is_mine', true);

        $this->assertSame($user->id, FicEntry::sole()->user_id);
    }

    public function test_user_id_in_the_payload_is_ignored(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($user)->postJson('/api/entries', self::validEntry(['user_id' => $other->id]))->assertCreated();

        $this->assertSame($user->id, FicEntry::sole()->user_id);
    }

    public function test_invalid_entries_are_rejected(): void
    {
        $user = User::factory()->create();

        $cases = [
            'latitude' => ['latitude' => 91],
            'longitude' => ['longitude' => -180.5],
            'region' => ['region' => 'XXI'],
            'province_code' => ['province_code' => '070200000'], // Cebu is not in Caraga
            'city_code' => ['city_code' => '160302000'], // Bayugan is not in Agusan del Norte
            'barangay_code' => ['barangay_code' => '160302003'], // the Libertad in Bayugan, not Butuan
            'products_commercialized' => ['products_developed' => 3, 'products_commercialized' => 4],
            'lto_status' => ['lto_status' => 'expired'],
            'msmes_served' => ['msmes_served' => -1],
            'assistance_types.0' => ['assistance_types' => ['astrology']],
            'assistance_other' => ['assistance_types' => ['other'], 'assistance_other' => ''],
        ];

        foreach ($cases as $field => $overrides) {
            $this->actingAs($user)
                ->postJson('/api/entries', self::validEntry($overrides))
                ->assertUnprocessable()
                ->assertJsonValidationErrors($field);
        }

        $this->assertDatabaseCount('fic_entries', 0);
    }

    public function test_other_assistance_text_is_kept_only_while_other_is_ticked(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/entries', self::validEntry(['assistance_types' => ['other'], 'assistance_other' => 'Halal certification']))
            ->assertJsonPath('data.assistance_other', 'Halal certification');

        $entry = FicEntry::sole();
        $this->actingAs($user)
            ->putJson("/api/entries/{$entry->id}", self::validEntry(['assistance_types' => ['training'], 'assistance_other' => 'Halal certification']))
            ->assertOk()
            ->assertJsonPath('data.assistance_other', null);
    }

    public function test_the_owner_can_update_and_delete(): void
    {
        $entry = FicEntry::factory()->create();

        $this->actingAs($entry->user)
            ->putJson("/api/entries/{$entry->id}", self::validEntry(['name' => 'Renamed FIC']))
            ->assertOk()
            ->assertJsonPath('data.name', 'Renamed FIC');

        $this->actingAs($entry->user)->deleteJson("/api/entries/{$entry->id}")->assertNoContent();

        $this->assertSoftDeleted($entry);
    }

    public function test_nobody_else_can_update_or_delete_an_entry(): void
    {
        $entry = FicEntry::factory()->create(['name' => 'Original']);

        foreach ([User::factory()->create(), User::factory()->superadmin()->create()] as $intruder) {
            // 403 even with an invalid payload: ownership is checked before validation.
            $this->actingAs($intruder)->putJson("/api/entries/{$entry->id}", [])->assertForbidden();
            $this->actingAs($intruder)->putJson("/api/entries/{$entry->id}", self::validEntry())->assertForbidden();
            $this->actingAs($intruder)->deleteJson("/api/entries/{$entry->id}")->assertForbidden();
        }

        $this->assertSame('Original', $entry->fresh()->name);
        $this->assertNotSoftDeleted($entry);
    }

    public function test_any_member_can_view_an_entry_without_learning_who_owns_it(): void
    {
        $entry = FicEntry::factory()->create();

        $response = $this->actingAs(User::factory()->create())
            ->getJson("/api/entries/{$entry->id}")
            ->assertOk()
            ->assertJsonPath('data.is_mine', false)
            ->assertJsonMissingPath('data.user_id')
            ->assertJsonMissingPath('data.user');

        $this->assertStringNotContainsString($entry->user->email, $response->getContent());
    }

    public function test_my_entries_lists_only_my_own_and_supports_search(): void
    {
        $me = User::factory()->create();
        FicEntry::factory()->for($me)->create(['name' => 'Tandag Food Innovation Center']);
        FicEntry::factory()->for($me)->create(['name' => 'Bislig Food Innovation Center']);
        FicEntry::factory()->for($me)->create(['name' => 'Deleted FIC'])->delete();
        FicEntry::factory()->create(['name' => 'Someone Else FIC']);

        $this->actingAs($me)
            ->getJson('/api/my/entries')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2);

        $this->actingAs($me)
            ->getJson('/api/my/entries?search=tandag')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Tandag Food Innovation Center');

        // LIKE wildcards are matched literally.
        $this->actingAs($me)->getJson('/api/my/entries?search=%25')->assertJsonCount(0, 'data');
    }

    public function test_map_markers_include_every_live_entry(): void
    {
        $mine = FicEntry::factory()->create();
        FicEntry::factory()->count(2)->create();
        FicEntry::factory()->create()->delete();

        $this->actingAs($mine->user)
            ->getJson('/api/map/markers')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure(['data' => [['id', 'latitude', 'longitude', 'name', 'host_institution', 'region_name', 'lto_status', 'is_mine']]]);
    }

    public function test_guests_cannot_reach_entry_endpoints(): void
    {
        $entry = FicEntry::factory()->create();

        $this->getJson('/api/map/markers')->assertUnauthorized();
        $this->getJson('/api/my/entries')->assertUnauthorized();
        $this->getJson("/api/entries/{$entry->id}")->assertUnauthorized();
        $this->postJson('/api/entries', self::validEntry())->assertUnauthorized();
    }

    public function test_regions_are_public(): void
    {
        $this->getJson('/api/regions')
            ->assertOk()
            ->assertJsonFragment(['code' => 'XIII', 'name' => 'Region XIII (Caraga)']);
    }
}
