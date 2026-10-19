<?php

namespace App\Http\Requests;

use App\Models\MsmeReport;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Create and update a Focal's MSME report. Mirrored by frontend/src/features/msme-reports/schema.ts.
 */
class MsmeReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $report = $this->route('msme_report');

        // Checked before validation so others get a 403, not a 422.
        return $report instanceof MsmeReport
            ? $this->user()->can('update', $report)
            : $this->user()->can('create', MsmeReport::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'msme_partners' => ['required', 'integer', 'min:0', 'max:1000000'],
            'msmes_with_lto' => ['required', 'integer', 'min:0', 'lte:msme_partners'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'msme_partners.required' => 'Enter the number of Food MSME partners.',
            'msmes_with_lto.required' => 'Enter the number of MSMEs with an LTO.',
            'msmes_with_lto.lte' => 'This can\'t be more than the number of Food MSME partners.',
        ];
    }
}
