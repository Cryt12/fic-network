<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\FicEntryRequest;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $superadminEmail = Str::lower((string) config('fic.superadmin.email'));

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users', 'email'),
                // Nobody can pre-register the superadmin's address before it is seeded.
                Rule::notIn(array_filter([$superadminEmail])),
            ],
            'password' => ['required', 'string', 'max:255', 'confirmed', Password::defaults()],

            // The user's first FIC entry, created together with the account. (No rule on "entry"
            // itself, so validated('entry') only ever contains the listed fields.)
            ...FicEntryRequest::fieldRules('entry.'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.not_in' => 'The email has already been taken.',
            ...FicEntryRequest::fieldMessages('entry.'),
        ];
    }

    protected function prepareForValidation(): void
    {
        // Emails are stored lowercase (see User::email()), so uniqueness is case-insensitive.
        if (is_string($this->input('email'))) {
            $this->merge(['email' => Str::lower($this->input('email'))]);
        }
    }
}
