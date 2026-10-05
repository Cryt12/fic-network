<?php

namespace App\Http\Resources;

use App\Models\LoginActivity;
use App\Support\NameMasker;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public-facing login row. Deliberately exposes no user id, email or full name.
 *
 * @mixin LoginActivity
 */
class RecentLoginResource extends JsonResource
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
            'masked_name' => NameMasker::mask($this->user->name),
            'logged_in_at' => $this->logged_in_at,
        ];
    }
}
