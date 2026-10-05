<?php

use Illuminate\Support\Facades\Route;

// API-only backend: the SPA lives in /frontend. Sanctum registers /sanctum/csrf-cookie itself.
Route::get('/', fn () => ['name' => config('app.name'), 'api' => url('/api')]);
