<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * My Profile details. Which fields apply depends on the account: DOST FIC Focal accounts keep
 * their age, position and DOST unit (all required, as at signup); FIC members and the superadmin
 * may add an organization and position. The region and role are never editable here.
 * Mirrored by frontend/src/features/profile/schema.ts.
 */
class ProfileRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $focal = $this->user()->isFocal();

        return [
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'contact_number' => ['nullable', 'string', 'max:30', 'regex:/^\+?[0-9][0-9 ()\-]{5,28}$/'],
            'bio' => ['nullable', 'string', 'max:500'],
            'position' => [$focal ? 'required' : 'nullable', 'string', 'max:150'],
            ...($focal ? [
                'age' => ['required', 'integer', 'min:18', 'max:100'],
                'dost_unit' => ['required', 'string', 'max:150'],
            ] : [
                'organization' => ['nullable', 'string', 'max:150'],
            ]),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'contact_number.regex' => 'Enter a phone number using digits, spaces, dashes or a leading +.',
        ];
    }
}
