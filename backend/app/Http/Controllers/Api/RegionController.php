<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class RegionController extends Controller
{
    /**
     * Options for the Region dropdown (public: the signup form needs it).
     */
    public function __invoke(): JsonResponse
    {
        $regions = collect(config('regions'))
            ->map(fn (string $name, string $code) => ['code' => $code, 'name' => $name])
            ->values();

        return response()->json(['data' => $regions]);
    }
}
