<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ImageReportResource;
use App\Jobs\GenerateImageReport;
use App\Models\ImageReport;
use App\Reports\ImageReportPrompt;
use App\Services\OpenRouterImages;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Generate Image Report: infographics of the Dashboard data, drawn by an OpenRouter image model.
 * Superadmin-only via the route group. Images are private files, served only through this API.
 */
class ImageReportController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        ImageReport::failStale();

        return ImageReportResource::collection(ImageReport::query()->with('user:id,name')->latest()->latest('id')->paginate(12))
            ->additional(['meta' => [
                'configured' => OpenRouterImages::configured(),
                'models' => collect(config('services.openrouter.image_models'))->map(fn ($label, $id) => ['id' => $id, 'label' => $label])->values(),
                'daily_limit' => config('services.openrouter.daily_limit'),
                'used_today' => $this->usedToday(),
            ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $options = $request->validate([
            'model' => ['required', Rule::in(array_keys(config('services.openrouter.image_models')))],
            'aspect_ratio' => ['required', Rule::in(['16:9', '4:3', '1:1', '3:4', '9:16'])],
            'resolution' => ['required', Rule::in(['1K', '2K', '4K'])],
            'detail' => ['required', Rule::in(['highlights', 'full'])],
            'instructions' => ['nullable', 'string', 'max:1000'],
        ]);

        abort_unless(OpenRouterImages::configured(), 503, 'OpenRouter is not set up yet: add OPENROUTER_API_KEY to backend/.env and restart the backend.');

        ImageReport::failStale();
        abort_if(ImageReport::query()->where('status', ImageReport::PENDING)->exists(), 409, 'A report is already being generated. Wait for it to finish.');
        abort_if(
            $this->usedToday() >= config('services.openrouter.daily_limit'),
            429,
            'The daily limit of '.config('services.openrouter.daily_limit').' image reports is reached. Try again tomorrow, or raise FIC_IMAGE_REPORTS_PER_DAY in backend/.env.',
        );

        ['system' => $system, 'prompt' => $prompt, 'figures' => $figures] = ImageReportPrompt::build($options);

        $report = new ImageReport([
            'model' => $options['model'],
            'options' => collect($options)->except('model')->all(),
            'figures' => $figures,
            'system_prompt' => $system,
            'prompt' => $prompt,
        ]);
        $report->user()->associate($request->user());
        $report->save();

        GenerateImageReport::dispatch($report);

        return (new ImageReportResource($report->fresh('user')))->response()->setStatusCode(202);
    }

    public function show(ImageReport $imageReport): ImageReportResource
    {
        ImageReport::failStale();

        return new ImageReportResource($imageReport->fresh('user'));
    }

    public function image(Request $request, ImageReport $imageReport): StreamedResponse
    {
        abort_unless($imageReport->image_path && Storage::disk('local')->exists($imageReport->image_path), 404);

        $name = 'onefic-image-report-'.$imageReport->created_at->timezone(config('fic.timezone'))->format('Y-m-d-His').'.'.pathinfo($imageReport->image_path, PATHINFO_EXTENSION);

        return $request->boolean('download')
            ? Storage::disk('local')->download($imageReport->image_path, $name)
            : Storage::disk('local')->response($imageReport->image_path, $name, ['Cache-Control' => 'private, max-age=86400']);
    }

    public function destroy(ImageReport $imageReport): Response
    {
        abort_if($imageReport->status === ImageReport::PENDING, 409, 'Wait for this report to finish before deleting it.');

        if ($imageReport->image_path) {
            Storage::disk('local')->delete($imageReport->image_path);
        }
        $imageReport->delete();

        return response()->noContent();
    }

    /** Reports started today (Philippine time), failed ones included: they may still have cost. */
    private function usedToday(): int
    {
        return ImageReport::query()->where('created_at', '>=', now(config('fic.timezone'))->startOfDay()->utc())->count();
    }
}
