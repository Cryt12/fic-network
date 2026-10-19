<?php

namespace Tests\Feature;

use App\Enums\AssistanceType;
use App\Models\FicEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_members_only(): void
    {
        $this->getJson('/api/summary')->assertUnauthorized();
    }

    public function test_national_and_per_region_totals(): void
    {
        FicEntry::factory()->create(['region' => 'XIII', 'products_developed' => 10, 'products_commercialized' => 4]);
        FicEntry::factory()->create(['region' => 'XIII', 'products_developed' => 6, 'products_commercialized' => 1]);
        FicEntry::factory()->create(['region' => 'VII', 'products_developed' => 3, 'products_commercialized' => 0]);
        FicEntry::factory()->create(['region' => 'VII', 'products_developed' => 50])->delete(); // deleted: not counted

        $data = $this->actingAs(User::factory()->create())->getJson('/api/summary')->assertOk()->json('data');

        $this->assertSame(['fics' => 3, 'products_developed' => 19, 'products_commercialized' => 5, 'regions_with_fics' => 2, 'equipment' => 0], $data['national']);
        $this->assertCount(count(config('regions')), $data['regions']); // every region, even with no FICs

        $regions = collect($data['regions'])->keyBy('code');
        $this->assertSame(2, $regions['XIII']['fics']);
        $this->assertSame(16, $regions['XIII']['products_developed']);
        $this->assertSame(5, $regions['XIII']['products_commercialized']);
        $this->assertSame(0, $regions['NCR']['fics']);
    }

    public function test_assistance_counts_every_type(): void
    {
        FicEntry::factory()->create(['region' => 'XIII', 'assistance_types' => ['training', 'food_safety']]);
        FicEntry::factory()->create(['region' => 'XIII', 'assistance_types' => ['training']]);
        FicEntry::factory()->create(['region' => 'VII', 'assistance_types' => ['training']]);
        FicEntry::factory()->create(['region' => 'VII', 'assistance_types' => ['training']])->delete(); // deleted: not counted

        $data = $this->actingAs(User::factory()->create())->getJson('/api/summary')->assertOk()->json('data');

        $assistance = collect($data['assistance'])->keyBy('type');
        $this->assertCount(count(AssistanceType::cases()), $assistance); // every type, even with no requests
        $this->assertSame(3, $assistance['training']['fics']);
        $this->assertSame(1, $assistance['food_safety']['fics']);
        $this->assertSame(0, $assistance['shelf_life']['fics']);
        $this->assertSame('Training / Technical Assistance', $assistance['training']['label']);

        // Per region: every type for every region, zeros included.
        $regions = collect($data['regions'])->keyBy('code');
        $this->assertSame(2, $regions['XIII']['assistance']['training']);
        $this->assertSame(1, $regions['XIII']['assistance']['food_safety']);
        $this->assertSame(1, $regions['VII']['assistance']['training']);
        $this->assertSame(0, $regions['VII']['assistance']['food_safety']);
        $this->assertCount(count(AssistanceType::cases()), $regions['NCR']['assistance']);
        $this->assertSame(0, $regions['NCR']['assistance']['training']);
    }

    public function test_equipment_status_per_region(): void
    {
        $item = fn (string $op, string $util) => ['name' => uniqid('Dryer '), 'operation_status' => $op, 'utilization_status' => $util, 'capacity' => '10 kg'];
        FicEntry::factory()->create(['region' => 'XIII', 'equipment' => [
            $item('operational', 'regularly_used'),
            $item('operational', 'rarely_used'),
            $item('under_maintenance', 'not_currently_used'),
        ]]);
        FicEntry::factory()->create(['region' => 'XIII', 'equipment' => [$item('operational', 'regularly_used')]]);
        FicEntry::factory()->create(['region' => 'VII', 'equipment' => []]);
        FicEntry::factory()->create(['region' => 'VII', 'equipment' => [$item('non_operational', 'not_currently_used')]])->delete(); // deleted: not counted

        $data = $this->actingAs(User::factory()->create())->getJson('/api/summary')->assertOk()->json('data');

        $this->assertSame(4, $data['national']['equipment']);
        $regions = collect($data['regions'])->keyBy('code');
        $this->assertSame(['operational' => 3, 'under_maintenance' => 1, 'non_operational' => 0, 'for_decommissioning' => 0], $regions['XIII']['equipment']['operation']);
        $this->assertSame(['regularly_used' => 2, 'occasionally_used' => 0, 'rarely_used' => 1, 'not_currently_used' => 1], $regions['XIII']['equipment']['utilization']);
        $this->assertSame(0, array_sum($regions['VII']['equipment']['operation']));
    }
}
