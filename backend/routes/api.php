<?php

use App\Http\Controllers\Api\Admin\EntryController as AdminEntryController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FicEntryController;
use App\Http\Controllers\Api\MapMarkerController;
use App\Http\Controllers\Api\PlaceController;
use App\Http\Controllers\Api\RecentLoginController;
use App\Http\Controllers\Api\RegionController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:register');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::get('regions', RegionController::class);
Route::get('places', [PlaceController::class, 'index'])->middleware('throttle:120,1');
// Each lookup may call OpenStreetMap, so this one is throttled harder.
Route::get('places/{place}/location', [PlaceController::class, 'location'])->middleware('throttle:30,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('recent-logins', RecentLoginController::class);

    Route::get('my/entries', [FicEntryController::class, 'mine']);
    Route::apiResource('entries', FicEntryController::class)->except('index');
    Route::get('map/markers', MapMarkerController::class);
});

// Superadmin only. The gate is checked on the server for every request here.
Route::middleware(['auth:sanctum', 'can:access-admin'])->prefix('admin')->group(function () {
    Route::get('entries', [AdminEntryController::class, 'index']);
    Route::get('entries/export', [AdminEntryController::class, 'export']);

    Route::get('users', [AdminUserController::class, 'index']);
    Route::get('users/{user}', [AdminUserController::class, 'show']);
    Route::get('users/{user}/login-history', [AdminUserController::class, 'loginHistory']);
});
