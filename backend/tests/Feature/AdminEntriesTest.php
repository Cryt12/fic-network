<?php

namespace Tests\Feature;

use App\Models\FicEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use OpenSpout\Reader\XLSX\Reader;
use Tests\TestCase;

class AdminEntriesTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->superadmin()->create();
    }

    public function test_only_the_superadmin_can_list_or_export(): void
    {
        $this->getJson('/api/admin/entries')->assertUnauthorized();
        $this->getJson('/api/admin/entries/export')->assertUnauthorized();

        $member = User::factory()->create();
        $this->actingAs($member)->getJson('/api/admin/entries')->assertForbidden();
        $this->actingAs($member)->getJson('/api/admin/entries/export')->assertForbidden();
    }

    public function test_lists_everyones_entries_with_the_submitters_full_name_and_totals(): void
    {
        $maria = User::factory()->create(['name' => 'Maria Clara Santos', 'email' => 'maria@example.com']);
        FicEntry::factory()->for($maria)->create(['products_developed' => 10, 'products_commercialized' => 4, 'msmes_served' => 30]);
        FicEntry::factory()->create(['products_developed' => 5, 'products_commercialized' => 1, 'msmes_served' => 12]);
        FicEntry::factory()->create()->delete();

        $response = $this->actingAs($this->admin)->getJson('/api/admin/entries')->assertOk()->assertJsonCount(2, 'data');

        $this->assertContains('Maria Clara Santos', array_column(array_column($response->json('data'), 'owner'), 'name'));
        $response
            ->assertJsonPath('totals.entries', 2)
            ->assertJsonPath('totals.products_developed', 15)
            ->assertJsonPath('totals.products_commercialized', 5)
            ->assertJsonPath('totals.msmes_served', 42)
            ->assertJsonStructure(['data' => [['owner' => ['id', 'name', 'email'], 'assistance_types', 'msmes_needing_fabrication_details']]]);
    }

    public function test_filters_narrow_the_list_and_the_totals(): void
    {
        $ana = User::factory()->create(['name' => 'Analyn Reyes']);
        $target = FicEntry::factory()->for($ana)->create([
            'region' => 'XIII', 'lto_status' => 'with_valid_lto', 'assistance_types' => ['packaging_labeling', 'training'],
        ]);
        FicEntry::factory()->create(['region' => 'X', 'lto_status' => 'with_valid_lto', 'assistance_types' => ['training']]);
        FicEntry::factory()->create(['region' => 'XIII', 'lto_status' => 'no_lto', 'assistance_types' => ['packaging_labeling']]);

        $only = fn (string $query) => $this->actingAs($this->admin)->getJson("/api/admin/entries?{$query}")->assertOk()->json();

        $this->assertCount(2, $only('region=XIII')['data']);
        $this->assertCount(2, $only('lto_status=with_valid_lto')['data']);
        $this->assertCount(2, $only('assistance_type=packaging_labeling')['data']);
        $this->assertCount(1, $only('search=analyn')['data']);

        $all = $only('region=XIII&lto_status=with_valid_lto&assistance_type=packaging_labeling');
        $this->assertSame([$target->id], array_column($all['data'], 'id'));
        $this->assertSame(1, $all['totals']['entries']);
    }

    public function test_date_filters_use_philippine_calendar_days(): void
    {
        // 23:30 UTC on Oct 4 is 07:30 on Oct 5 in Manila.
        $entry = FicEntry::factory()->create();
        $entry->forceFill(['created_at' => Carbon::parse('2026-10-04 23:30:00', 'UTC')])->saveQuietly();

        $ids = fn (string $query) => array_column($this->actingAs($this->admin)->getJson("/api/admin/entries?{$query}")->json('data'), 'id');

        $this->assertSame([$entry->id], $ids('from=2026-10-05&to=2026-10-05'));
        $this->assertSame([], $ids('to=2026-10-04'));
    }

    public function test_invalid_filters_are_rejected(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/admin/entries?region=XXI&lto_status=expired&from=2026-10-05&to=2026-10-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['region', 'lto_status', 'to']);
    }

    public function test_the_excel_report_has_a_summary_and_every_matching_entry(): void
    {
        $maria = User::factory()->create(['name' => 'Maria Clara Santos', 'email' => 'maria@example.com']);
        FicEntry::factory()->for($maria)->create([
            'region' => 'XIII',
            'name' => 'Butuan Food Innovation Center',
            'products_developed' => 12,
            'lto_status' => 'in_process',
            'assistance_types' => ['packaging_labeling', 'other'],
            'assistance_other' => 'Halal certification',
        ]);
        FicEntry::factory()->create(['region' => 'X', 'name' => 'Not In This Report']);

        $response = $this->actingAs($this->admin)->get('/api/admin/entries/export?region=XIII')->assertOk();
        $this->assertStringContainsString('spreadsheetml', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('fic-entries-report-', $response->headers->get('Content-Disposition'));

        $sheets = $this->readWorkbook($response->streamedContent());
        $this->assertSame(['Summary', 'Entries'], array_keys($sheets));

        $summary = $this->flatten($sheets['Summary']);
        $this->assertContains('Region XIII (Caraga)', $summary);
        $this->assertContains('LTO application in process', $summary);
        $this->assertContains($this->admin->name, $summary);

        $headings = $sheets['Entries'][0];
        $rows = array_slice($sheets['Entries'], 1);
        $this->assertSame('Submitted by', $headings[0]);
        $this->assertContains('Name of FIC', $headings);
        $this->assertContains('Number of MSMEs served', $headings);
        $this->assertCount(1, $rows);

        $row = array_combine($headings, $rows[0]);
        $this->assertSame('Maria Clara Santos', $row['Submitted by']);
        $this->assertSame('maria@example.com', $row['Email']);
        $this->assertSame('Butuan Food Innovation Center', $row['Name of FIC']);
        $this->assertSame('Region XIII (Caraga)', $row['Region']);
        $this->assertEquals(12, $row['Number of products developed']);
        $this->assertSame('LTO application in process', $row['License to Operate (LTO) status']);
        $this->assertSame('Packaging / Labeling, Other', $row['Types of assistance requested by MSMEs']);
        $this->assertSame('Halal certification', $row['Other assistance (specified)']);
    }

    /**
     * @return array<string, list<list<mixed>>>
     */
    private function readWorkbook(string $contents): array
    {
        $path = tempnam(sys_get_temp_dir(), 'report').'.xlsx';
        file_put_contents($path, $contents);

        $reader = new Reader;
        $reader->open($path);
        $sheets = [];
        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $sheets[$sheet->getName()][] = $row->toArray();
            }
        }
        $reader->close();
        unlink($path);

        return $sheets;
    }

    /**
     * @param  list<list<mixed>>  $rows
     * @return list<mixed>
     */
    private function flatten(array $rows): array
    {
        return array_merge(...$rows);
    }
}
