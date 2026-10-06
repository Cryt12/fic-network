<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /** Wrong passwords allowed (per email + IP) before login is blocked... */
    public const MAX_ATTEMPTS = 5;

    /** ...and for how long. A successful login resets the count. */
    public const LOCKOUT_SECONDS = 60;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * Log the user in, or fail. Failures (and tries while blocked) fire the events that
     * App\Listeners\RecordFailedLogin records for the superadmin.
     *
     * @throws ValidationException|ThrottleRequestsException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::guard('web')->attempt($this->only('email', 'password'))) {
            RateLimiter::hit($this->throttleKey(), self::LOCKOUT_SECONDS);

            throw ValidationException::withMessages(['email' => __('auth.failed')]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    private function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), self::MAX_ATTEMPTS)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        // Deliberately doesn't say how many tries are allowed.
        throw new ThrottleRequestsException(
            "Too many login attempts. Try again in {$seconds} seconds.",
            headers: ['Retry-After' => $seconds],
        );
    }

    private function throttleKey(): string
    {
        return Str::transliterate($this->string('email')->lower().'|'.$this->ip());
    }

    protected function prepareForValidation(): void
    {
        // Emails are stored lowercase (see User::email()).
        if (is_string($this->input('email'))) {
            $this->merge(['email' => Str::lower($this->input('email'))]);
        }
    }
}
