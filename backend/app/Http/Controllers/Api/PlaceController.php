<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Place;
use App\Support\PlaceLocator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Province / city / barangay options and their map positions. Public: signup needs them.
 */
class PlaceController extends Controller
{
    /**
     * Provinces of a region (?region=XIII), or the children of a place (?parent=CODE).
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'region' => ['required_without:parent', 'nullable', Rule::in(array_keys(config('regions')))],
            'parent' => ['required_without:region', 'nullable', 'string', 'max:10'],
        ]);

        $places = Place::query()
            ->when(
                $filters['parent'] ?? null,
                fn ($q, $parent) => $q->where('parent_code', $parent),
                fn ($q) => $q->where('level', 'province')->where('region', $filters['region']),
            )
            ->orderBy('name')
            ->get(['code', 'name']);

        return response()->json(['data' => $places])->setCache(['public' => true, 'max_age' => 86400]);
    }

    public function location(Place $place, PlaceLocator $locator): JsonResponse
    {
        return response()->json(['data' => $locator->locate($place)]);
    }
}
