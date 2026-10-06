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
            'is_superadmin' => $this->isSuperadmin(),
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
