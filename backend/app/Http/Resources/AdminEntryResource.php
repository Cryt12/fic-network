<?php

namespace App\Http\Resources;

use App\Models\FicEntry;
use Illuminate\Http\Request;

/**
 * An entry as the superadmin sees it: every field, plus who submitted it (full name).
 *
 * @mixin FicEntry
 */
class AdminEntryResource extends FicEntryResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'owner' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ],
        ];
    }
}
