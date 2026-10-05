<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

// "role" is deliberately not fillable: it is only ever set by SuperadminSeeder.
#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Mirrors the column default, so a freshly created user has a role before any reload.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'role' => 'user',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class,
        ];
    }

    /**
     * Emails are stored lowercase so lookups and the unique index are case-insensitive.
     */
    protected function email(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => Str::lower(trim($value)),
        );
    }

    public function isSuperadmin(): bool
    {
        return $this->role === Role::Superadmin;
    }

    /**
     * @return HasMany<LoginActivity, $this>
     */
    public function loginActivities(): HasMany
    {
        return $this->hasMany(LoginActivity::class);
    }
}
