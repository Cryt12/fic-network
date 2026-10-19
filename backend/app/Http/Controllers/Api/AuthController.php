<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\FocalRegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Session (cookie) auth for the SPA. Every successful login, including the one
 * right after signup, is recorded by App\Listeners\RecordLoginActivity.
 */
class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $names = $request->safe()->only(['first_name', 'middle_name', 'last_name']);
            $user = User::create([...$names, 'name' => self::fullName($names), ...$request->safe()->only(['email', 'password'])]);
            $user->ficEntries()->create($request->validated('entry'));

            return $user;
        });

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return (new UserResource($user))->response()->setStatusCode(201);
    }

    /**
     * A DOST FIC Focal account (regional office): read-only access to all FIC data.
     * The role comes from this endpoint, never from the request body.
     */
    public function registerFocal(FocalRegisterRequest $request): JsonResponse
    {
        $profile = $request->safe()->only(['first_name', 'middle_name', 'last_name', 'age', 'position', 'dost_unit', 'region']);
        $user = new User([...$profile, 'name' => self::fullName($profile), ...$request->safe()->only(['email', 'password'])]);
        $user->forceFill(['role' => Role::Focal])->save();

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return (new UserResource($user))->response()->setStatusCode(201);
    }

    /**
     * "First Middle Last" (middle name optional): the display name used across the app.
     *
     * @param  array<string, mixed>  $names
     */
    private static function fullName(array $names): string
    {
        return collect([$names['first_name'] ?? null, $names['middle_name'] ?? null, $names['last_name'] ?? null])
            ->map(fn ($part) => trim((string) $part))
            ->filter()
            ->implode(' ');
    }

    public function login(LoginRequest $request): UserResource
    {
        $request->authenticate();
        $request->session()->regenerate();

        return new UserResource($request->user());
    }

    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    /**
     * A new password: required after the superadmin resets an account, optional otherwise.
     * Every other session of the account is signed out; this one stays signed in.
     */
    public function changePassword(ChangePasswordRequest $request): UserResource
    {
        $user = $request->user();
        $user->forceFill(['password' => $request->validated('password'), 'must_change_password' => false])->save();

        $request->session()->regenerate();
        DB::table(config('session.table'))
            ->where('user_id', $user->id)
            ->where('id', '!=', $request->session()->getId())
            ->delete();

        return new UserResource($user);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}
