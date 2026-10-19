<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * An account whose password the superadmin reset may only change it (or log out) until it has.
 * Applied to every authenticated API route except auth/me, auth/logout and auth/change-password.
 */
class EnsurePasswordIsChanged
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->must_change_password) {
            return response()->json([
                'message' => 'Set a new password before continuing.',
                'code' => 'password_change_required',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
