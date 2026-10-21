<?php

namespace Tests\Feature;

use App\Models\FicEntry;
use App\Models\MsmeReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use OpenSpout\Reader\XLSX\Reader;
use Tests\TestCase;

class DashboardExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_the_superadmin_and_focal_accounts_can_download_it(): void
    {
        $this->get('/api/admin/dashboard/export', ['Accept' => 'application/json'])->assertUnauthorized();
        $this->actingAs(User::factory()->create())->get('/api/admin/dashboard/export')->assertForbidden();

        $this->actingAs(User::factory()->focal()->create())->get('/api/admin/dashboard/export')->assertOk();
        $this->actingAs(User::factory()->superadmin()->create())->get('/api/admin/dashboard/export')->assertOk();
    }

    public function test_every_dashboard_chart_has_a_sheet_with_matching_numbers(): void
    {
        $item = fn (string $name, string $op, string $util) => ['name' => $name, 'operation_status' => $op, 'utilization_status' => $util, 'capacity' => '10 kg'];
        FicEntry::factory()->create([
            'region' => 'XIII', 'products_developed' => 10, 'products_commercialized' => 4,
            'assistance_types' => ['training', 'food_safety'],
            'equipment' => [$item('Oven', 'operational', 'regularly_used'), $item('Spray dryer', 'non_operational', 'not_currently_used')],
        ]);
        FicEntry::factory()->create(['region' => 'XIII', 'products_developed' => 6, 'products_commercialized' => 1, 'assistance_types' => ['training'], 'equipment' => [$item('oven', 'operational', 'rarely_used')]]);
        FicEntry::factory()->create(['region' => 'VII', 'products_developed' => 3, 'products_commercialized' => 0, 'assistance_types' => [], 'equipment' => []]);
        MsmeReport::factory()->for(User::factory()->focal()->create(['region' => 'XIII']))->create(['msme_partners' => 40, 'msmes_with_lto' => 10]);

        $admin = User::factory()->superadmin()->create(['name' => 'Report Admin']);
        $response = $this->actingAs($admin)->get('/api/admin/dashboard/export')->assertOk();
        $this->assertStringContainsString('spreadsheetml', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('onefic-dashboard-data-', $response->headers->get('Content-Disposition'));

        $sheets = $this->readWorkbook($response->streamedContent());
        $this->assertSame([
            'Overview', 'FICs and products', 'FIC personnel', 'Food MSME partners', 'Assistance nationwide',
            'Assistance by region', 'Equipment by region', 'Equipment by type',
        ], array_keys($sheets));

        $this->assertContains('Report Admin', array_merge(...$sheets['Overview']));

        $caraga = $this->rowFor($sheets['FICs and products'], 'Region XIII (Caraga)');
        $this->assertEquals([2, 16, 5], array_slice($caraga, 1, 3));
        $this->assertEquals([3, 19, 5], array_slice($this->rowFor($sheets['FICs and products'], 'Nationwide'), 1, 3));

        $this->assertEquals([40, 10, '25%'], array_slice($this->rowFor($sheets['Food MSME partners'], 'Region XIII (Caraga)'), 1, 3));

        $training = $this->rowFor($sheets['Assistance nationwide'], 'Training / Technical Assistance');
        $this->assertEquals([2, '67%'], array_slice($training, 1, 2));
        $this->assertSame('Training / Technical Assistance', $sheets['Assistance nationwide'][1][0]); // most requested first

        $byRegion = $sheets['Assistance by region'];
        $xiii = array_search('XIII', $byRegion[0], true);
        $this->assertEquals(2, $this->rowFor($byRegion, 'Training / Technical Assistance')[$xiii]);

        $this->assertEquals(3, $this->rowFor($sheets['Equipment by region'], 'Region XIII (Caraga)')[1]);
        $oven = $this->rowFor($sheets['Equipment by type'], 'Oven'); // "Oven" and "oven" are one type
        $this->assertEquals(2, $oven[1]);
    }

    /**
     * @param  list<list<mixed>>  $rows
     * @return list<mixed>
     */
    private function rowFor(array $rows, string $label): array
    {
        foreach ($rows as $row) {
            if (($row[0] ?? null) === $label) {
                return $row;
            }
        }
        $this->fail("No row labelled {$label}");
    }

    /**
     * @return array<string, list<list<mixed>>>
     */
    private function readWorkbook(string $contents): array
    {
        $path = tempnam(sys_get_temp_dir(), 'dashboard').'.xlsx';
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
}
