<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
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
            $user = User::create($request->safe()->only(['name', 'email', 'password']));
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
        $name = collect([$profile['first_name'], $profile['middle_name'] ?? null, $profile['last_name']])->filter()->implode(' ');

        $user = new User([...$profile, 'name' => $name, ...$request->safe()->only(['email', 'password'])]);
        $user->forceFill(['role' => Role::Focal])->save();

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return (new UserResource($user))->response()->setStatusCode(201);
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

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}
