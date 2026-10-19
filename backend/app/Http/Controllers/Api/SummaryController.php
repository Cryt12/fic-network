<?php

namespace App\Http\Controllers\Api;

use App\Enums\AssistanceType;
use App\Enums\EquipmentOperation;
use App\Enums\EquipmentUtilization;
use App\Http\Controllers\Controller;
use App\Models\FicEntry;
use App\Models\MsmeReport;
use App\Reports\EntryReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Network-wide totals for the Summary dashboard: national figures and one row per region
 * (every region, including those with no FICs yet), plus how many FICs report each type of
 * assistance requested by MSMEs, nationally and per region, and how much listed equipment is in
 * each operation / utilization status per region, plus the Food MSME partners reported by DOST
 * FIC Focal accounts (the sum of every report per region). Aggregates only, no personal data.
 */
class SummaryController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $byRegion = FicEntry::query()
            ->toBase()
            ->selectRaw('region, count(*) as fics, coalesce(sum(products_developed), 0) as products_developed, coalesce(sum(products_commercialized), 0) as products_commercialized')
            ->groupBy('region')
            ->get()
            ->keyBy('region');

        // [region => [type => FICs]], one row per (entry, type) via Postgres' JSON array expansion.
        $assistance = DB::query()
            ->fromSub(FicEntry::query()->toBase()->select('region', 'assistance_types'), 'e')
            ->crossJoin(DB::raw('jsonb_array_elements_text(e.assistance_types) as t(type)'))
            ->selectRaw('e.region, t.type, count(*) as fics')
            ->groupBy('e.region', 't.type')
            ->get()
            ->groupBy('region')
            ->map(fn ($rows) => $rows->pluck('fics', 'type'));

        // One row per (region, operation, utilization) with the number of equipment items.
        $equipment = DB::query()
            ->fromSub(FicEntry::query()->toBase()->select('region', 'equipment'), 'e')
            ->crossJoin(DB::raw('jsonb_array_elements(e.equipment) as item'))
            ->selectRaw("e.region, item->>'operation_status' as operation, item->>'utilization_status' as utilization, count(*) as items")
            ->groupBy('e.region', 'operation', 'utilization')
            ->get()
            ->groupBy('region');

        $msmes = MsmeReport::query()
            ->toBase()
            ->selectRaw('region, sum(msme_partners) as msme_partners, sum(msmes_with_lto) as msmes_with_lto')
            ->groupBy('region')
            ->get()
            ->keyBy('region');

        $regions = collect(config('regions'))->map(fn (string $name, string $code) => [
            'code' => $code,
            'name' => $name,
            'fics' => (int) ($byRegion[$code]->fics ?? 0),
            'products_developed' => (int) ($byRegion[$code]->products_developed ?? 0),
            'products_commercialized' => (int) ($byRegion[$code]->products_commercialized ?? 0),
            'assistance' => collect(AssistanceType::cases())->mapWithKeys(fn (AssistanceType $type) => [
                $type->value => (int) ($assistance[$code][$type->value] ?? 0),
            ]),
            'equipment' => self::equipmentCounts($equipment[$code] ?? collect()),
            'msme_partners' => (int) ($msmes[$code]->msme_partners ?? 0),
            'msmes_with_lto' => (int) ($msmes[$code]->msmes_with_lto ?? 0),
        ])->values();

        return response()->json(['data' => [
            'national' => [
                'fics' => $regions->sum('fics'),
                'products_developed' => $regions->sum('products_developed'),
                'products_commercialized' => $regions->sum('products_commercialized'),
                'regions_with_fics' => $regions->where('fics', '>', 0)->count(),
                'equipment' => $regions->sum(fn (array $r) => array_sum($r['equipment']['operation'])),
                'msme_partners' => $regions->sum('msme_partners'),
                'msmes_with_lto' => $regions->sum('msmes_with_lto'),
            ],
            'regions' => $regions,
            'assistance' => EntryReport::assistanceCounts(FicEntry::query()),
        ]]);
    }

    /**
     * Equipment items per status, every status present (zeros included).
     *
     * @param  Collection<int, object{operation: string, utilization: string, items: int}>  $rows
     * @return array{operation: array<string, int>, utilization: array<string, int>}
     */
    private static function equipmentCounts(Collection $rows): array
    {
        $sum = fn (string $column, string $value) => (int) $rows->where($column, $value)->sum('items');

        return [
            'operation' => collect(EquipmentOperation::cases())->mapWithKeys(fn ($s) => [$s->value => $sum('operation', $s->value)])->all(),
            'utilization' => collect(EquipmentUtilization::cases())->mapWithKeys(fn ($s) => [$s->value => $sum('utilization', $s->value)])->all(),
        ];
    }
}
