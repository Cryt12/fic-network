<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminUserResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Every account, with login activity, for the superadmin. Superadmin-only via the route group.
 */
class UserController extends Controller
{
    private const PER_PAGE = 20;

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::enum(Role::class)],
            'sort' => ['nullable', Rule::in(['newest', 'name', 'last_login', 'failed_logins'])],
        ]);

        $users = $this->withActivity(User::query())
            ->when($filters['search'] ?? null, function (Builder $query, string $search) {
                $like = '%'.addcslashes($search, '\\%_').'%';
                $query->where(fn (Builder $q) => $q->whereLike('name', $like)->orWhereLike('email', $like));
            })
            ->when($filters['role'] ?? null, fn (Builder $q, string $role) => $q->where('role', $role))
            ->tap(fn (Builder $q) => match ($filters['sort'] ?? 'newest') {
                'name' => $q->orderBy('name'),
                'last_login' => $q->orderByRaw('last_login_at desc nulls last'),
                'failed_logins' => $q->orderByDesc('failed_logins_count')->orderByRaw('last_failed_login_at desc nulls last'),
                default => $q->latest(),
            })
            ->orderBy('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        return AdminUserResource::collection($users);
    }

    public function show(User $user): AdminUserResource
    {
        return new AdminUserResource($this->withActivity(User::query())->findOrFail($user->id));
    }

    /**
     * Successful logins and failed attempts for one user, newest first, in one timeline.
     */
    public function loginHistory(User $user): JsonResponse
    {
        $logins = DB::table('login_activities')
            ->where('user_id', $user->id)
            ->selectRaw("'s' || id as key, 'success' as result, logged_in_at as at, host(ip_address) as ip_address, user_agent");

        $failures = DB::table('failed_login_attempts')
            ->where('user_id', $user->id)
            ->selectRaw("'f' || id as key, reason as result, attempted_at as at, host(ip_address) as ip_address, user_agent");

        $history = DB::query()
            ->fromSub($logins->unionAll($failures), 'history')
            ->orderByDesc('at')
            ->orderByDesc('key')
            ->paginate(self::PER_PAGE)
            ->through(fn (object $row) => [...(array) $row, 'at' => Carbon::parse($row->at)->toIso8601ZuluString()]);

        return response()->json($history);
    }

    /**
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    private function withActivity(Builder $query): Builder
    {
        return $query
            ->withCount([
                'ficEntries as entries_count',
                'loginActivities as logins_count',
                'failedLoginAttempts as failed_logins_count',
            ])
            ->withMax('loginActivities as last_login_at', 'logged_in_at')
            ->withMax('failedLoginAttempts as last_failed_login_at', 'attempted_at');
    }
}
