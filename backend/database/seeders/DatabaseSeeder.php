<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(SuperadminSeeder::class);
        $this->call(PlaceSeeder::class); // provinces / cities / barangays (reference data)

        if (app()->isLocal()) {
            $this->call(DemoUserSeeder::class);
        }
    }
}
