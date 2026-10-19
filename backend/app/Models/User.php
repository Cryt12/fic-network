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

// "role" is deliberately not fillable: only SuperadminSeeder and AuthController::registerFocal set it.
#[Fillable(['name', 'email', 'password', 'first_name', 'middle_name', 'last_name', 'age', 'position', 'dost_unit', 'region'])]
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

    public function isFocal(): bool
    {
        return $this->role === Role::Focal;
    }

    /** Superadmin and DOST FIC Focal accounts see every member's entries (read-only for Focal). */
    public function canViewAllEntries(): bool
    {
        return $this->isSuperadmin() || $this->isFocal();
    }

    /**
     * @return HasMany<FicEntry, $this>
     */
    public function ficEntries(): HasMany
    {
        return $this->hasMany(FicEntry::class);
    }

    /**
     * @return HasMany<FailedLoginAttempt, $this>
     */
    public function failedLoginAttempts(): HasMany
    {
        return $this->hasMany(FailedLoginAttempt::class);
    }

    /**
     * @return HasMany<LoginActivity, $this>
     */
    public function loginActivities(): HasMany
    {
        return $this->hasMany(LoginActivity::class);
    }
}
