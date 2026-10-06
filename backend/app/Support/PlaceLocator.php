<?php

namespace App\Support;

use App\Models\Place;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

/**
 * Where a province / city / barangay is, for zooming the map and pre-filling the geotag.
 *
 * Looks the place up once in OpenStreetMap (Nominatim) and caches the result on the
 * place row, found or not. Searches are bounded to the parent's area, so "Libertad"
 * finds the one in Butuan, not one of the four others in Caraga.
 *
 * Nominatim's usage policy: at most 1 request per second, a real User-Agent, and cache
 * results. All three are honoured here.
 */
class PlaceLocator
{
    private const ENDPOINT = 'https://nominatim.openstreetmap.org/search';

    /**
     * The place's position, or its nearest located ancestor's (marked approximate).
     *
     * @return array{latitude: float, longitude: float, bounds: array<int, array<int, float>>|null, approximate: bool}|null
     */
    public function locate(Place $place): ?array
    {
        for ($current = $place, $approximate = false; $current; $current = $current->parent, $approximate = true) {
            if ($found = $this->lookUp($current)) {
                return [...$found, 'approximate' => $approximate];
            }
        }

        return null;
    }

    /**
     * @return array{latitude: float, longitude: float, bounds: array<int, array<int, float>>|null}|null
     */
    private function lookUp(Place $place): ?array
    {
        if ($place->located_at === null) {
            try {
                $result = $this->search($place);
            } catch (ConnectionException) {
                return null; // try again next time; don't cache an outage
            }

            $place->forceFill([
                'latitude' => $result['latitude'] ?? null,
                'longitude' => $result['longitude'] ?? null,
                'bounds' => $result['bounds'] ?? null,
                'located_at' => now(),
            ])->save();
        }

        return $place->latitude === null ? null : [
            'latitude' => $place->latitude,
            'longitude' => $place->longitude,
            'bounds' => $place->bounds,
        ];
    }

    /**
     * @return array{latitude: float, longitude: float, bounds: array<int, array<int, float>>}|null
     */
    private function search(Place $place): ?array
    {
        $params = ['q' => $place->searchName(), 'format' => 'jsonv2', 'limit' => 5, 'countrycodes' => 'ph'];

        $isProvince = $place->level === 'province' && ! str_starts_with($place->code, 'X');
        if ($isProvince) {
            $params['featureType'] = 'state';
        } else {
            $params[$place->level === 'barangay' ? 'layer' : 'featureType'] = $place->level === 'barangay' ? 'address' : 'city';

            // Search inside the parent's area when we know it.
            $parent = $place->parent ? $this->lookUp($place->parent) : null;
            if ($parent && $parent['bounds']) {
                [[$south, $west], [$north, $east]] = $parent['bounds'];
                $params += ['viewbox' => "{$west},{$north},{$east},{$south}", 'bounded' => 1];
            } elseif ($place->parent) {
                $params['q'] .= ', '.$place->parent->searchName();
            }
        }

        $results = $this->request($params);

        foreach ($results as $result) {
            if (in_array($result['category'] ?? null, ['boundary', 'place'], true)) {
                [$south, $north, $west, $east] = array_map('floatval', $result['boundingbox']);

                return [
                    'latitude' => round((float) $result['lat'], 7),
                    'longitude' => round((float) $result['lon'], 7),
                    'bounds' => [[$south, $west], [$north, $east]],
                ];
            }
        }

        return null;
    }

    /**
     * @param  array<string, string|int>  $params
     * @return list<array<string, mixed>>
     */
    private function request(array $params): array
    {
        // One request per second across all users (Nominatim usage policy).
        return Cache::lock('nominatim', 10)->block(15, function () use ($params) {
            $wait = (float) Cache::get('nominatim:last', 0) + 1.1 - microtime(true);
            if ($wait > 0) {
                Sleep::for((int) ceil($wait * 1000))->milliseconds();
            }

            try {
                $response = Http::withUserAgent(config('app.name').' ('.config('app.url').')')
                    ->timeout(10)
                    ->get(self::ENDPOINT, $params);
            } finally {
                Cache::put('nominatim:last', microtime(true), 60);
            }

            if (! $response->successful()) {
                throw new ConnectionException("Nominatim returned {$response->status()}");
            }

            return $response->json() ?? [];
        });
    }
}
