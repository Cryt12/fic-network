<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends FormRequest
{
    /**
     * After a reset the user just signed in with the temporary password, so it isn't asked again.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $forced = (bool) $this->user()->must_change_password;

        return [
            'current_password' => $forced ? ['nullable'] : ['required', 'string', 'current_password:web'],
            'password' => [
                'required', 'string', 'max:255', 'confirmed', Password::defaults(),
                Rule::notIn([config('fic.reset_password')]),
                ...($forced ? [] : ['different:current_password']),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_password.current_password' => 'Your current password is incorrect.',
            'password.not_in' => 'Choose a password other than the temporary one.',
            'password.different' => 'Choose a password different from your current one.',
        ];
    }
}
