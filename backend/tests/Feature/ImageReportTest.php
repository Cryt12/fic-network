<?php

namespace Tests\Feature;

use App\Models\FicEntry;
use App\Models\ImageReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageReportTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private const OPTIONS = ['model' => 'google/gemini-3-pro-image', 'aspect_ratio' => '16:9', 'resolution' => '2K', 'detail' => 'full', 'instructions' => 'Use a calm tone.'];

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        config(['services.openrouter.key' => 'test-key', 'services.openrouter.daily_limit' => 3]);
        $this->admin = User::factory()->superadmin()->create();
    }

    private function fakeImage(): void
    {
        $png = base64_encode((string) file_get_contents(resource_path('report-assets/dost-logo.png')));
        Http::fake(['openrouter.ai/*' => Http::response([
            'choices' => [['message' => ['content' => 'Here it is.', 'images' => [['type' => 'image_url', 'image_url' => ['url' => "data:image/png;base64,{$png}"]]]]]],
            'usage' => ['cost' => 0.134],
        ])]);
    }

    public function test_only_the_superadmin_can_use_it(): void
    {
        $this->getJson('/api/admin/image-reports')->assertUnauthorized();
        $this->actingAs(User::factory()->create())->getJson('/api/admin/image-reports')->assertForbidden();
        $this->actingAs(User::factory()->focal()->create())->postJson('/api/admin/image-reports', self::OPTIONS)->assertForbidden();
    }

    public function test_it_generates_an_image_from_the_exact_dashboard_numbers(): void
    {
        $this->fakeImage();
        FicEntry::factory()->create(['region' => 'XIII', 'products_developed' => 1575, 'products_commercialized' => 71]);

        $report = $this->actingAs($this->admin)->postJson('/api/admin/image-reports', self::OPTIONS)
            ->assertAccepted()
            ->json('data');

        // The queue runs synchronously in tests, so the job has already finished.
        $saved = ImageReport::findOrFail($report['id']);
        $this->assertSame(ImageReport::SUCCEEDED, $saved->status);
        $this->assertSame(0.134, $saved->cost_usd);
        Storage::disk('local')->assertExists($saved->image_path);
        $this->assertSame(1575, $saved->figures['products_developed']);

        Http::assertSent(function (ClientRequest $request) {
            [$system, $user] = $request['messages'];
            $prompt = $user['content'][0]['text'];

            return $request->hasHeader('Authorization', 'Bearer test-key')
                && $request['model'] === 'google/gemini-3-pro-image'
                && $request['modalities'] === ['image', 'text']
                && $request['image_config'] === ['aspect_ratio' => '16:9', 'image_size' => '2K']
                && $system['role'] === 'system'
                && str_contains($system['content'], 'SEQUENTIAL FLOW / SCROLLYTELLING')
                && str_contains($system['content'], 'ACCURACY RULES')
                && str_contains($prompt, 'STORY CHAPTERS, in this exact order:')
                && str_contains($prompt, '01. The hook')
                && str_contains($prompt, 'left to right along a gentle zig-zag path')
                && count($user['content']) === 3 // prompt + both logos
                && str_contains($prompt, 'Products developed by all FICs: 1,575.')
                && str_contains($prompt, 'Region XIII (Caraga) | 1 | 1,575 | 71')
                && str_contains($prompt, 'Use a calm tone.')
                && ! str_contains($prompt, '@'); // no emails or handles in what is sent
        });

        $this->getJson("/api/admin/image-reports/{$saved->id}")->assertJsonPath('data.status', 'succeeded')->assertJsonPath('data.image_url', "/api/admin/image-reports/{$saved->id}/image");
        $this->get("/api/admin/image-reports/{$saved->id}/image")->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->get("/api/admin/image-reports/{$saved->id}/image?download=1")->assertOk()->assertDownload();

        $this->deleteJson("/api/admin/image-reports/{$saved->id}")->assertNoContent();
        Storage::disk('local')->assertMissing($saved->image_path);
    }

    public function test_openrouter_errors_are_saved_as_a_failed_report(): void
    {
        Http::fake(['openrouter.ai/*' => Http::response(['error' => ['message' => 'Insufficient credits']], 402)]);

        $id = $this->actingAs($this->admin)->postJson('/api/admin/image-reports', self::OPTIONS)->assertAccepted()->json('data.id');

        $report = ImageReport::findOrFail($id);
        $this->assertSame(ImageReport::FAILED, $report->status);
        $this->assertStringContainsString('out of credits', $report->error);
        $this->assertNull($report->image_path);
    }

    public function test_a_model_that_refuses_system_messages_gets_them_in_the_prompt(): void
    {
        $png = base64_encode((string) file_get_contents(resource_path('report-assets/dost-logo.png')));
        Http::fakeSequence('openrouter.ai/*')
            ->push(['error' => ['message' => 'System messages are not supported for this model']], 400)
            ->push(['choices' => [['message' => ['images' => [['image_url' => ['url' => "data:image/png;base64,{$png}"]]]]]]]);

        $id = $this->actingAs($this->admin)->postJson('/api/admin/image-reports', self::OPTIONS)->json('data.id');

        $this->assertSame(ImageReport::SUCCEEDED, ImageReport::findOrFail($id)->status);
        Http::assertSentCount(2);
        $retry = Http::recorded()[1][0];
        $this->assertCount(1, $retry['messages']);
        $this->assertStringStartsWith('You are an expert information designer', $retry['messages'][0]['content'][0]['text']);
    }

    public function test_a_reply_without_an_image_fails_cleanly(): void
    {
        Http::fake(['openrouter.ai/*' => Http::response(['choices' => [['message' => ['content' => 'I cannot draw that.']]]])]);

        $id = $this->actingAs($this->admin)->postJson('/api/admin/image-reports', self::OPTIONS)->json('data.id');

        $this->assertStringContainsString('did not return an image', ImageReport::findOrFail($id)->error);
    }

    public function test_requests_are_validated_and_capped(): void
    {
        $this->fakeImage();
        $this->actingAs($this->admin)->postJson('/api/admin/image-reports', [...self::OPTIONS, 'model' => 'some/expensive-model', 'resolution' => '8K'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['model', 'resolution']);

        foreach (range(1, 3) as $i) {
            $this->postJson('/api/admin/image-reports', self::OPTIONS)->assertAccepted();
        }
        $this->postJson('/api/admin/image-reports', self::OPTIONS)->assertStatus(429);
        $this->getJson('/api/admin/image-reports')->assertJsonPath('meta.used_today', 3)->assertJsonPath('meta.configured', true);
    }

    public function test_one_report_at_a_time_and_stale_ones_are_failed(): void
    {
        $pending = new ImageReport(['model' => 'google/gemini-3-pro-image', 'options' => [], 'figures' => [], 'prompt' => 'x']);
        $pending->user()->associate($this->admin)->save();

        $this->actingAs($this->admin)->postJson('/api/admin/image-reports', self::OPTIONS)->assertStatus(409);

        $this->travel(ImageReport::STALE_AFTER_MINUTES + 1)->minutes();
        $this->getJson('/api/admin/image-reports')->assertJsonPath('data.0.status', 'failed');
    }

    public function test_it_says_when_openrouter_is_not_set_up(): void
    {
        config(['services.openrouter.key' => null]);

        $this->actingAs($this->admin)->getJson('/api/admin/image-reports')->assertJsonPath('meta.configured', false);
        $this->postJson('/api/admin/image-reports', self::OPTIONS)->assertStatus(503);
    }
}
