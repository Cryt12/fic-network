<?php

namespace App\Listeners;

use App\Enums\LoginFailure;
use App\Models\FailedLoginAttempt;
use App\Models\User;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Logs every failed login: wrong password, unknown email, or a try while blocked
 * (Lockout, fired by LoginRequest). The password that was tried is never stored.
 */
class RecordFailedLogin
{
    public function __construct(private Request $request) {}

    public function handle(Failed|Lockout $event): void
    {
        if ($event instanceof Failed) {
            $email = (string) ($event->credentials['email'] ?? '');
            $user = $event->user instanceof User ? $event->user : null;
            $reason = $user ? LoginFailure::WrongPassword : LoginFailure::UnknownEmail;
        } else {
            $email = Str::lower((string) $event->request->input('email'));
            $user = User::firstWhere('email', $email);
            $reason = LoginFailure::LockedOut;
        }

        FailedLoginAttempt::create([
            'user_id' => $user?->id,
            'email' => Str::limit($email, 255, ''),
            'reason' => $reason,
            'ip_address' => $this->request->ip(),
            'user_agent' => Str::limit((string) $this->request->userAgent(), 512, '') ?: null,
            'attempted_at' => now(),
        ]);
    }
}
