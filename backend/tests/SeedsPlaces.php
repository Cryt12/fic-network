<?php

namespace Tests;

use App\Models\Place;

/**
 * The few real PSGC places the tests use (Butuan, Agusan del Norte, Caraga).
 */
trait SeedsPlaces
{
    protected function seedPlaces(): void
    {
        Place::insert([
            ['code' => '160200000', 'name' => 'Agusan del Norte', 'level' => 'province', 'parent_code' => null, 'region' => 'XIII', 'is_city' => false],
            ['code' => '160300000', 'name' => 'Agusan del Sur', 'level' => 'province', 'parent_code' => null, 'region' => 'XIII', 'is_city' => false],
            ['code' => '070200000', 'name' => 'Cebu', 'level' => 'province', 'parent_code' => null, 'region' => 'VII', 'is_city' => false],
            ['code' => '160202000', 'name' => 'City of Butuan', 'level' => 'city', 'parent_code' => '160200000', 'region' => 'XIII', 'is_city' => true],
            ['code' => '160302000', 'name' => 'Bayugan', 'level' => 'city', 'parent_code' => '160300000', 'region' => 'XIII', 'is_city' => true],
            ['code' => '160202007', 'name' => 'Ampayon', 'level' => 'barangay', 'parent_code' => '160202000', 'region' => 'XIII', 'is_city' => false],
            ['code' => '160202054', 'name' => 'Libertad', 'level' => 'barangay', 'parent_code' => '160202000', 'region' => 'XIII', 'is_city' => false],
            ['code' => '160302003', 'name' => 'Libertad', 'level' => 'barangay', 'parent_code' => '160302000', 'region' => 'XIII', 'is_city' => false],
        ]);
    }
}
