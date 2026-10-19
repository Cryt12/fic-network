<?php

namespace Tests\Feature;

use App\Models\FicEntry;
use App\Models\MsmeReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MsmeReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_focal_reports_msme_partners_for_their_own_region(): void
    {
        $focal = User::factory()->focal()->create(['region' => 'XIII']);

        // A region in the body is ignored: it always comes from the Focal's profile.
        $this->actingAs($focal)
            ->postJson('/api/msme-reports', ['msme_partners' => 40, 'msmes_with_lto' => 25, 'region' => 'NCR', 'user_id' => 999])
            ->assertCreated()
            ->assertJsonPath('data.region', 'XIII')
            ->assertJsonPath('data.msme_partners', 40)
            ->assertJsonPath('data.msmes_with_lto', 25);

        $this->assertDatabaseHas('msme_reports', ['user_id' => $focal->id, 'region' => 'XIII', 'msme_partners' => 40]);
        $this->getJson('/api/auth/me')->assertJsonPath('data.can_add_msme_reports', true);
    }

    public function test_only_focal_accounts_can_report(): void
    {
        $payload = ['msme_partners' => 10, 'msmes_with_lto' => 5];

        $this->postJson('/api/msme-reports', $payload)->assertUnauthorized();
        $this->actingAs(User::factory()->create())->postJson('/api/msme-reports', $payload)->assertForbidden();
        $this->actingAs(User::factory()->superadmin()->create())->postJson('/api/msme-reports', $payload)->assertForbidden();
        $this->actingAs(User::factory()->create())->getJson('/api/my/msme-reports')->assertForbidden();

        $this->assertDatabaseCount('msme_reports', 0);
    }

    public function test_reports_are_validated(): void
    {
        $focal = User::factory()->focal()->create();

        $this->actingAs($focal)
            ->postJson('/api/msme-reports', ['msme_partners' => -1, 'msmes_with_lto' => 'many'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['msme_partners', 'msmes_with_lto']);

        $this->postJson('/api/msme-reports', ['msme_partners' => 10, 'msmes_with_lto' => 11])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['msmes_with_lto' => "can't be more than"]);

        $this->postJson('/api/msme-reports', ['msme_partners' => 0, 'msmes_with_lto' => 0])->assertCreated();
    }

    public function test_only_the_owner_can_change_or_delete_a_report(): void
    {
        $owner = User::factory()->focal()->create(['region' => 'XIII']);
        $other = User::factory()->focal()->create(['region' => 'XIII']);
        $report = MsmeReport::factory()->for($owner)->create(['msme_partners' => 10, 'msmes_with_lto' => 2]);

        $this->actingAs($other)->putJson("/api/msme-reports/{$report->id}", ['msme_partners' => 99, 'msmes_with_lto' => 0])->assertForbidden();
        $this->actingAs($other)->deleteJson("/api/msme-reports/{$report->id}")->assertForbidden();
        $this->actingAs($other)->getJson("/api/msme-reports/{$report->id}")->assertForbidden();

        $this->actingAs($owner)->putJson("/api/msme-reports/{$report->id}", ['msme_partners' => 12, 'msmes_with_lto' => 3])
            ->assertOk()
            ->assertJsonPath('data.msme_partners', 12);
        $this->actingAs($owner)->deleteJson("/api/msme-reports/{$report->id}")->assertNoContent();

        $this->assertSoftDeleted($report);
    }

    public function test_my_reports_list_includes_the_region_totals(): void
    {
        $focal = User::factory()->focal()->create(['region' => 'XIII']);
        $colleague = User::factory()->focal()->create(['region' => 'XIII']);
        MsmeReport::factory()->for($focal)->create(['msme_partners' => 40, 'msmes_with_lto' => 25]);
        MsmeReport::factory()->for($focal)->create(['msme_partners' => 10, 'msmes_with_lto' => 6]);
        MsmeReport::factory()->for($colleague)->create(['msme_partners' => 5, 'msmes_with_lto' => 1]);
        MsmeReport::factory()->for($focal)->create(['msme_partners' => 100, 'msmes_with_lto' => 100])->delete();

        $this->actingAs($focal)->getJson('/api/my/msme-reports')
            ->assertOk()
            ->assertJsonCount(2, 'data') // only their own, not deleted
            ->assertJsonPath('region_totals.msme_partners', 55) // the whole region
            ->assertJsonPath('region_totals.msmes_with_lto', 32);
    }

    public function test_the_summary_adds_up_every_report_per_region(): void
    {
        $caraga = User::factory()->focal()->create(['region' => 'XIII']);
        MsmeReport::factory()->for($caraga)->create(['msme_partners' => 40, 'msmes_with_lto' => 25]);
        MsmeReport::factory()->for($caraga)->create(['msme_partners' => 10, 'msmes_with_lto' => 6]);
        MsmeReport::factory()->for(User::factory()->focal()->create(['region' => 'VII']))->create(['msme_partners' => 7, 'msmes_with_lto' => 7]);
        FicEntry::factory()->create();

        $data = $this->actingAs(User::factory()->create())->getJson('/api/summary')->assertOk()->json('data');

        $this->assertSame(57, $data['national']['msme_partners']);
        $this->assertSame(38, $data['national']['msmes_with_lto']);
        $regions = collect($data['regions'])->keyBy('code');
        $this->assertSame(50, $regions['XIII']['msme_partners']);
        $this->assertSame(31, $regions['XIII']['msmes_with_lto']);
        $this->assertSame(0, $regions['NCR']['msme_partners']);
    }
}
