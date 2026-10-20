<?php

namespace App\Jobs;

use App\Models\ImageReport;
use App\Services\OpenRouterImages;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * Generates one image report in the background: a model can take a minute or more, longer than
 * the Cloudflare tunnel lets a web request run. Never retried, so a failure isn't paid for twice.
 */
class GenerateImageReport implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    public function __construct(public ImageReport $report) {}

    public function handle(): void
    {
        $report = $this->report;
        if ($report->status !== ImageReport::PENDING) {
            return;
        }

        try {
            $image = OpenRouterImages::generate(
                $report->model,
                $report->system_prompt,
                $report->prompt,
                [resource_path('report-assets/onefic-logo.png'), resource_path('report-assets/dost-logo.png')],
                ['aspect_ratio' => $report->options['aspect_ratio'], 'image_size' => $report->options['resolution']],
            );
        } catch (RuntimeException $e) {
            $this->markFailed($e->getMessage());

            return;
        }

        $path = 'image-reports/'.Str::uuid().'.'.$image['extension'];
        Storage::disk('local')->put($path, $image['bytes']);

        $report->forceFill([
            'status' => ImageReport::SUCCEEDED,
            'image_path' => $path,
            'cost_usd' => $image['cost'],
            'completed_at' => now(),
        ])->save();
    }

    /** The worker gave up (timeout, crash): don't leave the page waiting. */
    public function failed(?Throwable $e): void
    {
        $this->markFailed('Generating the image took too long or stopped unexpectedly. Try again.');
    }

    private function markFailed(string $message): void
    {
        $this->report->forceFill(['status' => ImageReport::FAILED, 'error' => $message, 'completed_at' => now()])->save();
    }
}
