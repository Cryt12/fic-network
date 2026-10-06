<?php

namespace App\Http\Requests;

use App\Enums\AssistanceType;
use App\Enums\LtoStatus;
use App\Models\FicEntry;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Create and update a FIC entry. Mirrored by frontend/src/features/entries/fields.ts.
 */
class FicEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $entry = $this->route('entry');

        // Only the owner may update. Checked before validation so others get a 403, not a 422.
        return $entry instanceof FicEntry ? $this->user()->can('update', $entry) : true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return self::fieldRules();
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return self::fieldMessages();
    }

    /**
     * The FIC field rules. Signup reuses them under an "entry." prefix.
     *
     * @return array<string, array<mixed>>
     */
    public static function fieldRules(string $prefix = ''): array
    {
        $count = ['required', 'integer', 'min:0', 'max:1000000'];

        return [
            $prefix.'region' => ['required', 'string', Rule::in(array_keys(config('regions')))],
            $prefix.'latitude' => ['required', 'numeric', 'between:-90,90'],
            $prefix.'longitude' => ['required', 'numeric', 'between:-180,180'],
            $prefix.'name' => ['required', 'string', 'max:255'],
            $prefix.'host_institution' => ['required', 'string', 'max:255'],
            $prefix.'products_developed' => $count,
            $prefix.'products_commercialized' => [...$count, 'lte:'.$prefix.'products_developed'],
            $prefix.'lto_status' => ['required', Rule::enum(LtoStatus::class)],
            $prefix.'msmes_needing_fabrication' => $count,
            $prefix.'msmes_needing_fabrication_details' => ['nullable', 'string', 'max:2000'],
            $prefix.'msmes_needing_tech_interventions' => $count,
            $prefix.'msmes_served' => $count,
            $prefix.'assistance_types' => ['present', 'array'],
            $prefix.'assistance_types.*' => ['distinct', Rule::enum(AssistanceType::class)],
            $prefix.'assistance_other' => [
                'nullable', 'string', 'max:255',
                Rule::requiredIf(fn () => in_array(
                    AssistanceType::Other->value,
                    (array) request()->input($prefix.'assistance_types'),
                    true,
                )),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function fieldMessages(string $prefix = ''): array
    {
        return [
            $prefix.'products_commercialized.lte' => 'Products commercialized cannot be more than products developed.',
            $prefix.'assistance_other.required' => 'Describe the other type of assistance.',
        ];
    }
}
