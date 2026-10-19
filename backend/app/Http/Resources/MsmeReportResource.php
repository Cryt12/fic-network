<?php

namespace App\Http\Resources;

use App\Models\MsmeReport;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin MsmeReport
 */
class MsmeReportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'region' => $this->region,
            'region_name' => config("regions.{$this->region}"),
            'msme_partners' => $this->msme_partners,
            'msmes_with_lto' => $this->msmes_with_lto,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
