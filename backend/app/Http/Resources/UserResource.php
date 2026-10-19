<?php

namespace App\Http\Resources;

use App\Models\MsmeReport;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
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
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'role_label' => $this->role->label(),
            'is_superadmin' => $this->isSuperadmin(),
            'is_focal' => $this->isFocal(),
            'can_view_all_entries' => $this->canViewAllEntries(),
            'can_add_entries' => ! $this->isFocal(),
            'can_add_msme_reports' => $this->can('create', MsmeReport::class),
            'region' => $this->region,
            'region_name' => $this->region ? config("regions.{$this->region}") : null,
            'position' => $this->position,
            'dost_unit' => $this->dost_unit,
            'created_at' => $this->created_at,
        ];
    }
}
