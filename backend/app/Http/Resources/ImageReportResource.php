<?php

namespace App\Http\Resources;

use App\Models\ImageReport;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ImageReport
 */
class ImageReportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'model' => $this->model,
            'model_label' => config("services.openrouter.image_models.{$this->model}") ?? $this->model,
            'options' => $this->options,
            'figures' => $this->figures,
            'system_prompt' => $this->system_prompt,
            'prompt' => $this->prompt,
            'error' => $this->error,
            'cost_usd' => $this->cost_usd,
            'image_url' => $this->status === ImageReport::SUCCEEDED ? "/api/admin/image-reports/{$this->id}/image" : null,
            'created_by' => $this->user?->name,
            'created_at' => $this->created_at,
            'completed_at' => $this->completed_at,
        ];
    }
}
