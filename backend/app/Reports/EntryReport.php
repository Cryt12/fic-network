<?php

namespace App\Reports;

use App\Enums\AssistanceType;
use App\Enums\EquipmentOperation;
use App\Enums\EquipmentUtilization;
use App\Enums\LtoStatus;
use App\Http\Requests\Admin\EntryFilterRequest;
use App\Http\Resources\FicEntryResource;
use App\Models\FicEntry;
use BackedEnum;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\AutoFilter;
use OpenSpout\Writer\XLSX\Entity\SheetView;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * The superadmin's Excel report: a Summary sheet (totals, by region, by LTO status, the
 * filters used) and an Entries sheet with every field of every matching entry.
 *
 * Entry columns come from FicEntryResource, so a new FIC field appears here automatically.
 * Give it a nicer heading in LABELS if Str::headline() of its key isn't good enough.
 */
class EntryReport
{
    private const LABELS = [
        'region_name' => 'Region',
        'city' => 'City / Municipality',
        'name' => 'Name of FIC',
        'host_institution' => 'Host institution (university)',
        'fulltime_personnel' => 'Number of full-time personnel (stationed in the FIC)',
        'associate_personnel' => 'Number of associate personnel (not reporting full-time in the FIC)',
        'products_developed' => 'Number of products developed',
        'products_commercialized' => 'Number of FIC-developed products commercialized (adopted by MSME or university spin-off through TLA)',
        'lto_status' => 'License to Operate (LTO) status',
        'msmes_needing_fabrication' => 'Existing MSMEs that require equipment fabrication for shopfloor innovations',
        'msmes_needing_fabrication_details' => 'MSMEs and equipment needed (details)',
        'msmes_needing_tech_interventions' => 'Number of MSMEs that require technology interventions',
        'msmes_served' => 'Number of MSMEs served',
        'assistance_types' => 'Types of assistance requested by MSMEs',
        'assistance_other' => 'Other assistance (specified)',
        'equipment' => 'FIC equipment (operation status, utilization, capacity per batch)',
    ];

    /** Resource keys that are not columns (region_name is shown instead of the code). */
    private const SKIP = ['id', 'region', 'province_code', 'city_code', 'barangay_code', 'is_mine', 'created_at', 'updated_at'];

    /** Summed in the totals and per-region tables. */
    private const SUMS = [
        'products_developed' => 'Products developed',
        'products_commercialized' => 'Products commercialized',
        'msmes_served' => 'MSMEs served',
        'msmes_needing_fabrication' => 'MSMEs needing equipment fabrication',
        'msmes_needing_tech_interventions' => 'MSMEs needing technology interventions',
    ];

    public const BRAND_GREEN = '206B47';

    private string $timezone;

    public function __construct(private EntryFilterRequest $request)
    {
        $this->timezone = config('fic.timezone');
    }

    /**
     * Totals for a filtered query: entry count plus the SUMS columns.
     *
     * @param  Builder<FicEntry>  $query
     * @return array<string, int>
     */
    public static function totals(Builder $query): array
    {
        $select = ['count(*) as entries'];
        foreach (array_keys(self::SUMS) as $column) {
            $select[] = "coalesce(sum({$column}), 0) as {$column}";
        }

        $row = (clone $query)->reorder()->toBase()->selectRaw(implode(', ', $select))->first();

        return array_map('intval', (array) $row);
    }

    /**
     * How many entries list each type of assistance requested by MSMEs, for a filtered query.
     * Every type is included (0 when nobody picked it), in the form's order.
     *
     * @param  Builder<FicEntry>  $query
     * @return list<array{type: string, label: string, fics: int}>
     */
    public static function assistanceCounts(Builder $query): array
    {
        $entries = (clone $query)->reorder()->toBase()->select('assistance_types');

        // One row per (entry, type), via Postgres' JSON array expansion.
        $counts = DB::query()
            ->fromSub($entries, 'e')
            ->crossJoin(DB::raw('jsonb_array_elements_text(e.assistance_types) as t(type)'))
            ->selectRaw('t.type, count(*) as fics')
            ->groupBy('t.type')
            ->pluck('fics', 'type');

        return array_map(fn (AssistanceType $type) => [
            'type' => $type->value,
            'label' => $type->label(),
            'fics' => (int) ($counts[$type->value] ?? 0),
        ], AssistanceType::cases());
    }

    public function download(): StreamedResponse
    {
        $filename = 'fic-entries-report-'.now($this->timezone)->format('Y-m-d-His').'.xlsx';

        return response()->streamDownload(
            fn () => $this->writeTo('php://output'),
            $filename,
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        );
    }

    public function writeTo(string $path): void
    {
        $writer = new Writer;
        $writer->openToFile($path);

        $writer->getCurrentSheet()->setName('Summary');
        $this->writeSummary($writer);

        $writer->addNewSheetAndMakeItCurrent()->setName('Entries');
        $this->writeEntries($writer);

        $writer->close();
    }

    private function writeSummary(Writer $writer): void
    {
        $title = new Style(fontBold: true, fontSize: 14, fontColor: self::BRAND_GREEN);
        $bold = new Style(fontBold: true);
        $header = $this->headerStyle();
        $query = $this->request->filteredQuery();

        $sheet = $writer->getCurrentSheet();
        $sheet->setColumnWidth(42, 1);
        $sheet->setColumnWidthForRange(18, 2, 7);

        $writer->addRow(Row::fromValuesWithStyle([config('app.name').': FIC Entries Report'], $title));
        $writer->addRow(Row::fromValues(['Generated', now($this->timezone)->format('F j, Y g:i A').' (Philippine time)']));
        $writer->addRow(Row::fromValues(['Generated by', $this->request->user()->name]));
        $writer->addRow(Row::fromValues([]));

        $writer->addRow(Row::fromValuesWithStyle(['Filters'], $bold));
        foreach ($this->request->describe() as $label => $value) {
            $writer->addRow(Row::fromValues([$label, $value]));
        }
        $writer->addRow(Row::fromValues([]));

        $totals = self::totals($query);
        $writer->addRow(Row::fromValuesWithStyle(['Totals', ''], $header));
        $writer->addRow(Row::fromValues(['Entries', $totals['entries']]));
        foreach (self::SUMS as $column => $label) {
            $writer->addRow(Row::fromValues([$label, $totals[$column]]));
        }
        $writer->addRow(Row::fromValues([]));

        // By region, in the dropdown's order (NCR, CAR, I, II, ...).
        $writer->addRow(Row::fromValuesWithStyle(['By region', 'Entries', ...array_values(self::SUMS)], $header));
        $byRegion = $this->grouped($query, 'region');
        foreach (array_keys(config('regions')) as $code) {
            if ($row = $byRegion[$code] ?? null) {
                $writer->addRow(Row::fromValues([config("regions.{$code}"), ...array_values($row)]));
            }
        }
        $writer->addRow(Row::fromValues([]));

        $writer->addRow(Row::fromValuesWithStyle(['By LTO status', 'Entries'], $header));
        foreach ($this->grouped($query, 'lto_status') as $status => $row) {
            $writer->addRow(Row::fromValues([LtoStatus::from($status)->label(), $row['entries']]));
        }
        $writer->addRow(Row::fromValues([]));

        // Most-requested first.
        $writer->addRow(Row::fromValuesWithStyle(['Assistance requested by MSMEs', 'FICs'], $header));
        $assistance = self::assistanceCounts($query);
        usort($assistance, fn ($a, $b) => $b['fics'] <=> $a['fics']);
        foreach ($assistance as $row) {
            $writer->addRow(Row::fromValues([$row['label'], $row['fics']]));
        }
    }

    private function writeEntries(Writer $writer): void
    {
        $columns = array_values(array_diff(
            array_keys((new FicEntryResource(new FicEntry))->resolve($this->request)),
            self::SKIP,
        ));

        $headings = [
            'Submitted by',
            'Email',
            ...array_map(fn (string $key) => self::LABELS[$key] ?? Str::headline($key), $columns),
            'Submitted',
            'Last updated',
        ];

        $sheet = $writer->getCurrentSheet();
        $sheet->setSheetView((new SheetView)->withFreezeRow(2));
        $sheet->setColumnWidthForRange(24, 1, count($headings));
        $sheet->setColumnWidth(38, 3 + array_search('name', $columns, true), 3 + array_search('host_institution', $columns, true));
        $writer->addRow(Row::fromValuesWithStyle($headings, $this->headerStyle()));

        $wrap = new Style(shouldWrapText: true);
        $this->request->filteredQuery()
            ->with('user:id,name,email')
            ->lazy(500)
            ->each(function (FicEntry $entry) use ($writer, $columns, $wrap) {
                $data = (new FicEntryResource($entry))->resolve($this->request);

                $writer->addRow(Row::fromValuesWithStyle([
                    $entry->user->name,
                    $entry->user->email,
                    ...array_map(fn (string $key) => $key === 'equipment' ? self::equipmentText($data[$key]) : $this->cellValue($data[$key]), $columns),
                    $this->cellValue($entry->created_at),
                    $this->cellValue($entry->updated_at),
                ], $wrap));
            });

        $sheet->setAutoFilter(new AutoFilter(0, 1, count($headings) - 1, max($sheet->getWrittenRowCount(), 1)));
    }

    /**
     * @param  Builder<FicEntry>  $query
     * @return array<string, array<string, int>>
     */
    private function grouped(Builder $query, string $column): array
    {
        $select = [$column, 'count(*) as entries'];
        foreach (array_keys(self::SUMS) as $sum) {
            $select[] = "coalesce(sum({$sum}), 0) as {$sum}";
        }

        return (clone $query)->reorder()->toBase()
            ->selectRaw(implode(', ', $select))
            ->groupBy($column)
            ->orderBy($column)
            ->get()
            ->mapWithKeys(fn ($row) => [$row->{$column} => array_map('intval', array_diff_key((array) $row, [$column => true]))])
            ->all();
    }

    /**
     * One line per item: "Spray dryer: Operational, Regularly used, 50 kg per batch".
     *
     * @param  array<int, array<string, string>>|null  $equipment
     */
    private static function equipmentText(?array $equipment): ?string
    {
        if (! $equipment) {
            return null;
        }

        return collect($equipment)->map(fn (array $item) => sprintf(
            '%s: %s, %s, %s per batch',
            $item['name'],
            EquipmentOperation::tryFrom($item['operation_status'] ?? '')?->label() ?? '-',
            EquipmentUtilization::tryFrom($item['utilization_status'] ?? '')?->label() ?? '-',
            $item['capacity'] ?? '-',
        ))->implode("\n");
    }

    private function cellValue(mixed $value): string|int|float|null
    {
        return match (true) {
            $value === null => null,
            $value instanceof BackedEnum => method_exists($value, 'label') ? $value->label() : $value->value,
            $value instanceof DateTimeInterface => Carbon::instance($value)->setTimezone($this->timezone)->format('Y-m-d H:i'),
            is_iterable($value) => collect($value)->map(fn ($item) => $this->cellValue($item))->implode(', '),
            is_bool($value) => $value ? 'Yes' : 'No',
            default => $value,
        };
    }

    /** White bold text on brand green: table headings in every report. */
    public static function headerStyle(): Style
    {
        return new Style(fontBold: true, fontColor: 'FFFFFF', backgroundColor: self::BRAND_GREEN, shouldWrapText: true);
    }
}
