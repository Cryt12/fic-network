<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FicEntryRequest;
use App\Http\Resources\FicEntryResource;
use App\Models\FicEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class FicEntryController extends Controller
{
    private const PER_PAGE = 10;

    /**
     * The current user's own entries ("My Entries"), newest first, optionally searched.
     */
    public function mine(Request $request): AnonymousResourceCollection
    {
        $search = trim((string) $request->query('search'));

        $entries = $request->user()->ficEntries()
            ->when($search !== '', function ($query) use ($search) {
                $like = '%'.addcslashes($search, '\\%_').'%';
                $query->where(fn ($q) => $q->whereLike('name', $like)->orWhereLike('host_institution', $like));
            })
            ->latest()
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        return FicEntryResource::collection($entries);
    }

    public function store(FicEntryRequest $request): JsonResponse
    {
        $entry = $request->user()->ficEntries()->create($request->validated());

        return (new FicEntryResource($entry))->response()->setStatusCode(201);
    }

    public function show(FicEntry $entry): FicEntryResource
    {
        Gate::authorize('view', $entry);

        return new FicEntryResource($entry);
    }

    // Ownership is checked in FicEntryRequest::authorize().
    public function update(FicEntryRequest $request, FicEntry $entry): FicEntryResource
    {
        $entry->update($request->validated());

        return new FicEntryResource($entry);
    }

    public function destroy(FicEntry $entry): Response
    {
        Gate::authorize('delete', $entry);

        $entry->delete(); // soft delete

        return response()->noContent();
    }
}
