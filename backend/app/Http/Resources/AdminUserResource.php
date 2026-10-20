<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A member as the superadmin sees them, with activity counts (loaded by Admin\UserController).
 *
 * @mixin User
 */
class AdminUserResource extends JsonResource
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
            'must_change_password' => (bool) $this->must_change_password,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'age' => $this->age,
            'position' => $this->position,
            'dost_unit' => $this->dost_unit,
            'organization' => $this->organization,
            'contact_number' => $this->contact_number,
            'bio' => $this->bio,
            'avatar_url' => $this->avatarUrl(),
            'region' => $this->region,
            'region_name' => $this->region ? config("regions.{$this->region}") : null,
            'created_at' => $this->created_at,
            'entries_count' => $this->entries_count,
            'logins_count' => $this->logins_count,
            'failed_logins_count' => $this->failed_logins_count,
            'last_login_at' => $this->asIso($this->last_login_at),
            'last_failed_login_at' => $this->asIso($this->last_failed_login_at),
        ];
    }

    /** Aggregates come back from Postgres as plain strings. */
    private function asIso(?string $timestamp): ?string
    {
        return $timestamp === null ? null : now()->parse($timestamp)->toIso8601ZuluString();
    }
}
