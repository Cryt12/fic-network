<?php

namespace Tests\Feature;

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

        $this->assertSame(['fics' => 3, 'products_developed' => 19, 'products_commercialized' => 5, 'regions_with_fics' => 2], $data['national']);
        $this->assertCount(count(config('regions')), $data['regions']); // every region, even with no FICs

        $regions = collect($data['regions'])->keyBy('code');
        $this->assertSame(2, $regions['XIII']['fics']);
        $this->assertSame(16, $regions['XIII']['products_developed']);
        $this->assertSame(5, $regions['XIII']['products_commercialized']);
        $this->assertSame(0, $regions['NCR']['fics']);
    }
}
