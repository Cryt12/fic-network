<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Loads every Philippine province, city/municipality and barangay from
 * database/data/psgc.json.gz. Safe to re-run: it updates names and hierarchy
 * but keeps map positions already looked up.
 */
class PlaceSeeder extends Seeder
{
    public function run(): void
    {
        $data = json_decode(gzdecode(file_get_contents(database_path('data/psgc.json.gz'))), true, flags: JSON_THROW_ON_ERROR);

        $regionOf = [];
        $rows = [];
        foreach ($data['provinces'] as [$code, $name, $region]) {
            $regionOf[$code] = $region;
            $rows[] = ['code' => $code, 'name' => $name, 'level' => 'province', 'parent_code' => null, 'region' => $region, 'is_city' => false];
        }
        foreach ($data['cities'] as [$code, $name, $province, $isCity]) {
            $regionOf[$code] = $regionOf[$province];
            $rows[] = ['code' => $code, 'name' => $name, 'level' => 'city', 'parent_code' => $province, 'region' => $regionOf[$province], 'is_city' => (bool) $isCity];
        }
        foreach ($data['barangays'] as [$code, $name, $city]) {
            $rows[] = ['code' => $code, 'name' => $name, 'level' => 'barangay', 'parent_code' => $city, 'region' => $regionOf[$city], 'is_city' => false];
        }

        DB::transaction(function () use ($rows) {
            foreach (array_chunk($rows, 2000) as $chunk) {
                DB::table('places')->upsert($chunk, ['code'], ['name', 'level', 'parent_code', 'region', 'is_city']);
            }
        });

        $this->command?->info(count($rows).' places loaded.');
    }
}
