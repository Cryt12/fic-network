<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Reports\DashboardSummary;
use Illuminate\Http\JsonResponse;

/**
 * Network-wide figures for the Dashboard charts (see App\Reports\DashboardSummary).
 * Any member may see them: aggregates only, no personal data.
 */
class SummaryController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json(['data' => DashboardSummary::build()]);
    }
}
