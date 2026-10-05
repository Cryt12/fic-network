<?php

namespace App\Listeners;

use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Records every successful login, including the automatic login after signup.
 */
class RecordLoginActivity
{
    public function __construct(private Request $request) {}

    public function handle(Login $event): void
    {
        if (! $event->user instanceof User) {
            return;
        }

        $event->user->loginActivities()->create([
            'logged_in_at' => now(),
            'ip_address' => $this->request->ip(),
            'user_agent' => Str::limit((string) $this->request->userAgent(), 512, '') ?: null,
        ]);
    }
}
