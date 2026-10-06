<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Mirrored by the frontend's zod schema.
        Password::defaults(fn () => Password::min(8)->letters()->numbers());

        Gate::define('access-admin', fn (User $user) => $user->isSuperadmin());

        $this->configureRateLimiting();
    }

    private function configureRateLimiting(): void
    {
        $tooMany = fn (string $what) => fn (Request $request, array $headers) => response()->json([
            'message' => "Too many {$what}. Try again in {$headers['Retry-After']} seconds.",
        ], 429, $headers);

        // Flood guard per IP. The "5 wrong passwords" lockout lives in LoginRequest, because
        // it counts failures only (a successful login must not use up attempts).
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(20)
            ->by($request->ip())
            ->response($tooMany('login attempts')));

        RateLimiter::for('register', fn (Request $request) => Limit::perMinute(5)
            ->by($request->ip())
            ->response($tooMany('signup attempts')));
    }
}
