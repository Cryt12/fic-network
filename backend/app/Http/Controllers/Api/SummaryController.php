<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FicEntry;
use Illuminate\Http\JsonResponse;

/**
 * Network-wide totals for the Summary dashboard: national figures and one row per region
 * (every region, including those with no FICs yet). Aggregates only, no personal data.
 */
class SummaryController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $byRegion = FicEntry::query()
            ->toBase()
            ->selectRaw('region, count(*) as fics, coalesce(sum(products_developed), 0) as products_developed, coalesce(sum(products_commercialized), 0) as products_commercialized')
            ->groupBy('region')
            ->get()
            ->keyBy('region');

        $regions = collect(config('regions'))->map(fn (string $name, string $code) => [
            'code' => $code,
            'name' => $name,
            'fics' => (int) ($byRegion[$code]->fics ?? 0),
            'products_developed' => (int) ($byRegion[$code]->products_developed ?? 0),
            'products_commercialized' => (int) ($byRegion[$code]->products_commercialized ?? 0),
        ])->values();

        return response()->json(['data' => [
            'national' => [
                'fics' => $regions->sum('fics'),
                'products_developed' => $regions->sum('products_developed'),
                'products_commercialized' => $regions->sum('products_commercialized'),
                'regions_with_fics' => $regions->where('fics', '>', 0)->count(),
            ],
            'regions' => $regions,
        ]]);
    }
}
