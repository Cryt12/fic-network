<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A province, city/municipality or barangay from the PSGC (see PlaceSeeder).
 */
#[Fillable(['code', 'name', 'level', 'parent_code', 'region', 'is_city', 'latitude', 'longitude', 'bounds', 'located_at'])]
#[WithoutTimestamps]
class Place extends Model
{
    public const LEVELS = ['province', 'city', 'barangay'];

    protected $primaryKey = 'code';

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_city' => 'boolean',
            'latitude' => 'float',
            'longitude' => 'float',
            'bounds' => 'array',
            'located_at' => 'immutable_datetime',
        ];
    }

    /**
     * @return BelongsTo<Place, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Place::class, 'parent_code');
    }

    /** "City of Butuan" -> "Butuan", "Adams (Pob.)" -> "Adams": the name as maps know it. */
    public function searchName(): string
    {
        $name = preg_replace('/\s*\(.*?\)\s*/', ' ', $this->name);
        $name = preg_replace('/^City of\s+/i', '', trim($name));

        return trim($name);
    }
}
