<?php

namespace Tests\Feature;

use App\Models\Place;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use Tests\SeedsPlaces;
use Tests\TestCase;

class PlaceTest extends TestCase
{
    use RefreshDatabase, SeedsPlaces;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedPlaces();
        Sleep::fake(); // the 1-request-per-second spacing shouldn't slow the tests
    }

    public function test_lists_provinces_of_a_region_and_children_of_a_place(): void
    {
        $this->getJson('/api/places?region=XIII')
            ->assertOk()
            ->assertJsonPath('data', [['code' => '160200000', 'name' => 'Agusan del Norte'], ['code' => '160300000', 'name' => 'Agusan del Sur']]);

        $this->getJson('/api/places?parent=160202000')
            ->assertOk()
            ->assertJsonPath('data.*.name', ['Ampayon', 'Libertad']);

        $this->getJson('/api/places')->assertUnprocessable();
    }

    public function test_barangays_are_located_inside_their_citys_area_and_cached(): void
    {
        Http::fake([
            'nominatim.openstreetmap.org/*' => function (Request $request) {
                return Http::response(match ($request['q']) {
                    'Agusan del Norte' => [$this->hit(8.92, 125.46, [8.69, 9.47, 125.14, 125.79])],
                    'Butuan' => [$this->hit(8.9477, 125.5432, [8.80, 9.10, 125.40, 125.75])],
                    'Ampayon' => [['category' => 'amenity', 'lat' => '1', 'lon' => '1', 'boundingbox' => ['0', '1', '0', '1']], $this->hit(8.9613, 125.6025, [8.95, 8.97, 125.59, 125.61])],
                });
            },
        ]);

        $this->getJson('/api/places/160202007/location')
            ->assertOk()
            ->assertJsonPath('data.latitude', 8.9613)
            ->assertJsonPath('data.longitude', 125.6025)
            ->assertJsonPath('data.approximate', false);

        Http::assertSent(fn (Request $r) => $r['q'] === 'Ampayon' && (string) $r['bounded'] === '1' && $r['viewbox'] === '125.4,9.1,125.75,8.8');
        Http::assertSent(fn (Request $r) => str_contains($r->header('User-Agent')[0], config('app.url')));

        // Cached: asking again doesn't call OpenStreetMap.
        Http::fake(fn () => throw new \RuntimeException('should not be called'));
        $this->getJson('/api/places/160202007/location')->assertOk()->assertJsonPath('data.latitude', 8.9613);
    }

    public function test_falls_back_to_the_city_when_a_barangay_is_not_on_the_map(): void
    {
        Http::fake([
            'nominatim.openstreetmap.org/*' => fn (Request $request) => Http::response(match ($request['q']) {
                'Agusan del Norte' => [$this->hit(8.92, 125.46, [8.69, 9.47, 125.14, 125.79])],
                'Butuan' => [$this->hit(8.9477, 125.5432, [8.80, 9.10, 125.40, 125.75])],
                default => [],
            }),
        ]);

        $this->getJson('/api/places/160202054/location')
            ->assertOk()
            ->assertJsonPath('data.latitude', 8.9477)
            ->assertJsonPath('data.approximate', true);

        $this->assertNotNull(Place::find('160202054')->located_at); // "not found" is cached too
    }

    public function test_an_outage_is_not_cached(): void
    {
        Http::fake(['nominatim.openstreetmap.org/*' => Http::response('busy', 503)]);

        $this->getJson('/api/places/160200000/location')->assertOk()->assertJsonPath('data', null);

        $this->assertNull(Place::find('160200000')->located_at);
    }

    /**
     * @param  array{0: float, 1: float, 2: float, 3: float}  $box  south, north, west, east
     * @return array<string, mixed>
     */
    private function hit(float $lat, float $lon, array $box): array
    {
        return ['category' => 'boundary', 'lat' => (string) $lat, 'lon' => (string) $lon, 'boundingbox' => array_map('strval', $box)];
    }
}
