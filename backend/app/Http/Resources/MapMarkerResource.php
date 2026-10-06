<?php

namespace App\Http\Resources;

use App\Models\FicEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A map pin: coordinates plus the short summary shown in its popup.
 *
 * @mixin FicEntry
 */
class MapMarkerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'name' => $this->name,
            'host_institution' => $this->host_institution,
            'region_name' => config("regions.{$this->region}", $this->region),
            'lto_status' => $this->lto_status,
            'is_mine' => $request->user()?->id === $this->user_id,
        ];
    }
}
