<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RecentLoginResource;
use App\Models\LoginActivity;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RecentLoginController extends Controller
{
    private const LIMIT = 15;

    /**
     * The most recent logins, one row per user (their latest), names masked.
     */
    public function __invoke(): AnonymousResourceCollection
    {
        // Postgres DISTINCT ON keeps the first row per user_id in the given order: their latest login.
        $latestPerUser = LoginActivity::query()
            ->select(['id', 'user_id', 'logged_in_at'])
            ->distinct('user_id')
            ->orderBy('user_id')
            ->orderByDesc('logged_in_at');

        $logins = LoginActivity::query()
            ->fromSub($latestPerUser, 'login_activities')
            ->with('user:id,name')
            ->orderByDesc('logged_in_at')
            ->limit(self::LIMIT)
            ->get();

        return RecentLoginResource::collection($logins);
    }
}
