<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * A new login email. Needs the current password, so a borrowed signed-in browser can't take
 * the account over. The superadmin's email is set in the server's .env, so it can't change here.
 */
class EmailChangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return ! $this->user()->isSuperadmin();
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($this->user()->id),
                Rule::notIn(array_filter([Str::lower((string) config('fic.superadmin.email'))])),
            ],
            'current_password' => ['required', 'string', 'current_password:web'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.not_in' => 'The email has already been taken.',
            'current_password.current_password' => 'Your current password is incorrect.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => Str::lower(trim($this->input('email')))]);
        }
    }
}
