<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MsmeReportRequest;
use App\Http\Resources\MsmeReportResource;
use App\Models\MsmeReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

/**
 * Food MSME partner reports by DOST FIC Focal accounts. Authorization: MsmeReportPolicy
 * (via MsmeReportRequest::authorize() for store and update).
 */
class MsmeReportController extends Controller
{
    /**
     * The current Focal's own reports, newest first, with their region's running totals.
     */
    public function mine(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('create', MsmeReport::class);

        $reports = $request->user()->msmeReports()->latest()->latest('id')->paginate(20);
        $totals = MsmeReport::query()
            ->where('region', $request->user()->region)
            ->selectRaw('coalesce(sum(msme_partners), 0) as msme_partners, coalesce(sum(msmes_with_lto), 0) as msmes_with_lto')
            ->toBase()
            ->first();

        return MsmeReportResource::collection($reports)->additional(['region_totals' => [
            'region' => $request->user()->region,
            'region_name' => config("regions.{$request->user()->region}"),
            'msme_partners' => (int) $totals->msme_partners,
            'msmes_with_lto' => (int) $totals->msmes_with_lto,
        ]]);
    }

    public function store(MsmeReportRequest $request): JsonResponse
    {
        $report = new MsmeReport($request->validated());
        $report->user()->associate($request->user());
        $report->region = $request->user()->region;
        $report->save();

        return (new MsmeReportResource($report))->response()->setStatusCode(201);
    }

    public function show(Request $request, MsmeReport $msmeReport): MsmeReportResource
    {
        Gate::authorize('update', $msmeReport);

        return new MsmeReportResource($msmeReport);
    }

    public function update(MsmeReportRequest $request, MsmeReport $msmeReport): MsmeReportResource
    {
        $msmeReport->update($request->validated());

        return new MsmeReportResource($msmeReport);
    }

    public function destroy(MsmeReport $msmeReport): Response
    {
        Gate::authorize('delete', $msmeReport);

        $msmeReport->delete(); // soft delete

        return response()->noContent();
    }
}
