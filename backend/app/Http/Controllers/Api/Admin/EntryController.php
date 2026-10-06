<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\EntryFilterRequest;
use App\Http\Resources\AdminEntryResource;
use App\Reports\EntryReport;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Every member's entries, for the superadmin. Superadmin-only via the route group.
 */
class EntryController extends Controller
{
    private const PER_PAGE = 15;

    public function index(EntryFilterRequest $request): AnonymousResourceCollection
    {
        $query = $request->filteredQuery();
        $totals = EntryReport::totals($query);

        $entries = $query->with('user:id,name,email')->paginate(self::PER_PAGE)->withQueryString();

        return AdminEntryResource::collection($entries)->additional(['totals' => $totals]);
    }

    /**
     * The same filtered entries as an Excel report.
     */
    public function export(EntryFilterRequest $request): StreamedResponse
    {
        return (new EntryReport($request))->download();
    }
}
