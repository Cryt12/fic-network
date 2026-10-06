<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MapMarkerResource;
use App\Models\FicEntry;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MapMarkerController extends Controller
{
    /**
     * Every entry as a lightweight pin. Not paginated: a map needs all of them at once,
     * and the payload is a handful of short fields per entry.
     */
    public function __invoke(): AnonymousResourceCollection
    {
        $entries = FicEntry::query()
            ->without(['province', 'city', 'barangay'])
            ->select(['id', 'user_id', 'latitude', 'longitude', 'name', 'host_institution', 'region', 'lto_status'])
            ->get();

        return MapMarkerResource::collection($entries);
    }
}
