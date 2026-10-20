<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Reports\DashboardReport;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Every Dashboard chart's data as one Excel workbook. Same access as the entries Excel report
 * (superadmin and DOST FIC Focal accounts), via the route group.
 */
class DashboardExportController extends Controller
{
    public function __invoke(Request $request): StreamedResponse
    {
        return (new DashboardReport($request->user()))->download();
    }
}
