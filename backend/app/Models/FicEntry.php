<?php

namespace App\Models;

use App\Enums\AssistanceType;
use App\Enums\LtoStatus;
use Database\Factories\FicEntryFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Casts\AsEnumCollection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Guarded rather than fillable so a new FIC column needs no change here. That is safe
 * because controllers only ever fill from $request->validated().
 */
#[Guarded(['id', 'user_id', 'created_at', 'updated_at', 'deleted_at'])]
class FicEntry extends Model
{
    /** @use HasFactory<FicEntryFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'products_developed' => 'integer',
            'products_commercialized' => 'integer',
            'lto_status' => LtoStatus::class,
            'msmes_needing_fabrication' => 'integer',
            'msmes_needing_tech_interventions' => 'integer',
            'msmes_served' => 'integer',
            'assistance_types' => AsEnumCollection::of(AssistanceType::class),
        ];
    }

    protected static function booted(): void
    {
        // "Other" text only means something while "Other" is ticked.
        static::saving(function (FicEntry $entry) {
            if (! $entry->assistance_types?->contains(AssistanceType::Other)) {
                $entry->assistance_other = null;
            }
        });
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
