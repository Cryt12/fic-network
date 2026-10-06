<?php

namespace App\Http\Resources;

use App\Models\FicEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full entry details, as any logged-in member sees them. The owner is not identified;
 * "is_mine" only tells the viewer whether they may edit it.
 *
 * @mixin FicEntry
 */
class FicEntryResource extends JsonResource
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
            'region' => $this->region,
            'region_name' => config("regions.{$this->region}", $this->region),
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'name' => $this->name,
            'host_institution' => $this->host_institution,
            'products_developed' => $this->products_developed,
            'products_commercialized' => $this->products_commercialized,
            'lto_status' => $this->lto_status,
            'msmes_needing_fabrication' => $this->msmes_needing_fabrication,
            'msmes_needing_fabrication_details' => $this->msmes_needing_fabrication_details,
            'msmes_needing_tech_interventions' => $this->msmes_needing_tech_interventions,
            'msmes_served' => $this->msmes_served,
            'assistance_types' => $this->assistance_types,
            'assistance_other' => $this->assistance_other,
            'is_mine' => $request->user()?->id === $this->user_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
