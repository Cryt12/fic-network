<?php

namespace App\Reports;

/**
 * The request for an image model to draw a OneFIC infographic: a system prompt with the design
 * technique (Sequential Flow / Scrollytelling) and the accuracy rules, from a file that can be
 * edited, plus a user prompt with the exact numbers from DashboardSummary and the story's
 * chapters in order. The rules forbid inventing anything (image models like to add websites,
 * social handles and "rounded" figures).
 */
class ImageReportPrompt
{
    /** The design technique and the accuracy rules, sent as the system message. Edit the file to change them. */
    public const SYSTEM_PROMPT_FILE = 'prompts/image-report-system.md';

    /**
     * @param  array{detail: string, aspect_ratio: string, instructions: ?string}  $options
     * @return array{system: string, prompt: string, figures: array<string, mixed>}
     */
    public static function build(array $options): array
    {
        $data = DashboardSummary::build();
        $figures = self::figures($data, $options['detail'] === 'full');
        $date = now(config('fic.timezone'))->format('F j, Y');
        $tall = in_array($options['aspect_ratio'], ['3:4', '9:16'], true);

        $chapters = [
            'The hook: the title "Bridging Innovation & Market: The DOST OneFIC Impact", the subtitle "Food Innovation Centers across the Philippines, as of '.$date.'", and the number of FICs nationwide as the hero number.',
            'Strength in Numbers: how many of the regions have FICs, with a simple map of the Philippines highlighting them, and the regions with the most FICs.',
            'Driving Product Development: products developed as the hero number, with a short bar chart of the leading regions.',
            'From Lab to Market: products commercialized as the hero number, the commercialization rate, and the leading regions.',
            'What MSMEs Ask For: the most requested types of assistance, as a short ranked list or bar chart.',
            ...($figures['equipment']['units'] > 0 ? ['FIC Equipment: units of equipment as the hero number, how many are operational, and the most listed types.'] : []),
            ...($figures['msme_partners'] > 0 ? ['Food MSME Partners: partners reported by DOST regional offices as the hero number, and how many hold a License to Operate.'] : []),
            ...($options['detail'] === 'full' ? ['Regional Performance: a clean table with one row per region in DATA (Region, FICs, Products developed, Commercialized), copied exactly.'] : []),
            'Closing takeaway: the line "Supporting local food entrepreneurs, scaling commercialization, and fostering collaboration." and a footer band with only "Empowering Philippine Food Innovation."',
        ];

        $lines = [
            'Create the OneFIC impact infographic for DOST OneFIC - Philippine Food Innovation Network, the network of Food Innovation Centers (FICs) of the Department of Science and Technology of the Philippines.',
            '',
            "DATA (as of {$date}):",
            ...self::dataLines($figures),
            '',
            'STORY CHAPTERS, in this exact order:',
            ...array_map(fn (string $chapter, int $i) => sprintf('%02d. %s', $i + 1, $chapter), $chapters, array_keys($chapters)),
            '',
            'FORMAT: aspect ratio '.$options['aspect_ratio'].'; '.($tall
                ? 'tall layout, so the chapters flow from top to bottom.'
                : 'wide layout, so the chapters flow from left to right along a gentle zig-zag path.'),
        ];

        if (filled($options['instructions'] ?? null)) {
            $lines[] = '';
            $lines[] = 'EXTRA INSTRUCTIONS FROM THE ADMINISTRATOR (they never override the accuracy rules): '.trim($options['instructions']);
        }

        return [
            'system' => trim((string) file_get_contents(resource_path(self::SYSTEM_PROMPT_FILE))),
            'prompt' => implode("\n", $lines),
            'figures' => $figures,
        ];
    }

    /**
     * The exact numbers the image is allowed to show (also kept with the report for checking).
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private static function figures(array $data, bool $fullTable): array
    {
        $national = $data['national'];
        $withFics = array_values(array_filter($data['regions'], fn (array $r) => $r['fics'] > 0));
        $top = function (string $field, int $count) use ($withFics): array {
            $rows = array_filter($withFics, fn (array $r) => $r[$field] > 0);
            usort($rows, fn (array $a, array $b) => $b[$field] <=> $a[$field] ?: strcmp($a['name'], $b['name']));

            return array_map(fn (array $r) => ['region' => $r['name'], 'value' => $r[$field]], array_slice($rows, 0, $count));
        };

        $assistance = array_values(array_filter($data['assistance'], fn (array $a) => $a['fics'] > 0 && $a['type'] !== 'other'));
        usort($assistance, fn (array $a, array $b) => $b['fics'] <=> $a['fics']);

        $operational = array_sum(array_map(fn (array $t) => $t['operation']['operational'] ?? 0, $data['equipment_types']));

        return [
            'fics' => $national['fics'],
            'regions_with_fics' => $national['regions_with_fics'],
            'regions_total' => count($data['regions']),
            'products_developed' => $national['products_developed'],
            'products_commercialized' => $national['products_commercialized'],
            'commercialization_rate' => $national['products_developed'] > 0
                ? round($national['products_commercialized'] / $national['products_developed'] * 100).'%'
                : null,
            'regions_without_fics' => array_values(array_map(fn (array $r) => $r['name'], array_filter($data['regions'], fn (array $r) => $r['fics'] === 0))),
            'top_fics' => $top('fics', 3),
            'top_developed' => $top('products_developed', 3),
            'top_commercialized' => $top('products_commercialized', 3),
            'top_assistance' => array_map(fn (array $a) => ['type' => $a['label'], 'fics' => $a['fics']], array_slice($assistance, 0, 5)),
            'equipment' => [
                'units' => $national['equipment'],
                'types' => count($data['equipment_types']),
                'operational' => $operational,
                'top_types' => array_map(fn (array $t) => ['name' => $t['name'], 'units' => $t['total']], array_slice($data['equipment_types'], 0, 5)),
            ],
            'msme_partners' => $national['msme_partners'],
            'msmes_with_lto' => $national['msmes_with_lto'],
            'regions' => $fullTable
                ? array_map(fn (array $r) => [
                    'region' => $r['name'], 'fics' => $r['fics'],
                    'developed' => $r['products_developed'], 'commercialized' => $r['products_commercialized'],
                ], $withFics)
                : [],
        ];
    }

    /**
     * @param  array<string, mixed>  $f
     * @return list<string>
     */
    private static function dataLines(array $f): array
    {
        $n = fn (int $value) => number_format($value);
        $list = fn (array $rows, string $key) => implode('; ', array_map(fn (array $r) => "{$r['region']}: ".$n($r[$key]), $rows));

        $lines = [
            "- FICs nationwide: {$n($f['fics'])}, in {$f['regions_with_fics']} of {$f['regions_total']} regions.",
            "- Products developed by all FICs: {$n($f['products_developed'])}.",
            "- Products commercialized (adopted by MSMEs or university spin-offs through technology licensing agreements): {$n($f['products_commercialized'])}"
                .($f['commercialization_rate'] ? ", a commercialization rate of {$f['commercialization_rate']} of products developed." : '.'),
        ];
        if ($f['top_fics']) {
            $lines[] = '- Regions with the most FICs: '.$list($f['top_fics'], 'value').'.';
        }
        if ($f['top_developed']) {
            $lines[] = '- Regions with the most products developed: '.$list($f['top_developed'], 'value').'.';
        }
        if ($f['top_commercialized']) {
            $lines[] = '- Regions with the most products commercialized: '.$list($f['top_commercialized'], 'value').'.';
        }
        if ($f['regions_without_fics']) {
            $lines[] = '- Regions with no FIC yet: '.implode(', ', $f['regions_without_fics']).'.';
        }
        if ($f['top_assistance']) {
            $lines[] = "- Most requested assistance from MSMEs (number of FICs, out of {$n($f['fics'])}): "
                .implode('; ', array_map(fn (array $a) => "{$a['type']}: {$a['fics']}", $f['top_assistance'])).'.';
        }
        if ($f['equipment']['units'] > 0) {
            $lines[] = "- FIC equipment: {$n($f['equipment']['units'])} units of {$f['equipment']['types']} types, {$n($f['equipment']['operational'])} of them operational. Most listed: "
                .implode('; ', array_map(fn (array $t) => "{$t['name']}: {$t['units']}", $f['equipment']['top_types'])).'.';
        }
        if ($f['msme_partners'] > 0) {
            $lines[] = "- Food MSME partners reported by DOST regional offices: {$n($f['msme_partners'])}, of which {$n($f['msmes_with_lto'])} hold a License to Operate.";
        }
        if ($f['regions']) {
            $lines[] = '- Regional performance (Region | FICs | Products developed | Commercialized):';
            foreach ($f['regions'] as $r) {
                $lines[] = "  {$r['region']} | {$r['fics']} | {$n($r['developed'])} | {$n($r['commercialized'])}";
            }
        }

        return $lines;
    }
}
