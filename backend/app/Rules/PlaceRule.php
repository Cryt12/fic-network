<?php

namespace App\Rules;

use App\Models\Place;
use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Arr;

/**
 * The value is a PSGC place code of the given level that belongs to the chosen parent:
 * a province in the chosen region, a city in the chosen province, a barangay in the chosen city.
 */
class PlaceRule implements DataAwareRule, ValidationRule
{
    /** @var array<string, mixed> */
    private array $data = [];

    /**
     * @param  'province'|'city'|'barangay'  $level
     * @param  string  $parentField  dotted path of the region (for provinces) or parent place field
     */
    public function __construct(private string $level, private string $parentField) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function setData(array $data): static
    {
        $this->data = $data;

        return $this;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $parent = Arr::get($this->data, $this->parentField);

        $exists = Place::query()
            ->where('code', $value)
            ->where('level', $this->level)
            ->where($this->level === 'province' ? 'region' : 'parent_code', $parent)
            ->exists();

        if (! $exists) {
            $fail(match ($this->level) {
                'province' => 'Select a province in the chosen region.',
                'city' => 'Select a city or municipality in the chosen province.',
                'barangay' => 'Select a barangay in the chosen city or municipality.',
            });
        }
    }
}
