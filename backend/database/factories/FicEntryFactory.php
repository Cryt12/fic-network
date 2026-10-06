<?php

namespace Database\Factories;

use App\Enums\AssistanceType;
use App\Enums\LtoStatus;
use App\Models\FicEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Sample FICs placed around the Caraga Region, for local testing.
 *
 * @extends Factory<FicEntry>
 */
class FicEntryFactory extends Factory
{
    /** [place, latitude, longitude, host institution] */
    private const SITES = [
        ['Butuan', 8.9475, 125.5406, 'Father Saturnino Urios University'],
        ['Ampayon', 8.9564, 125.5998, 'Caraga State University'],
        ['Cabadbaran', 9.1236, 125.5347, 'Caraga State University Cabadbaran Campus'],
        ['Bayugan', 8.7143, 125.7481, 'Agusan del Sur State College of Agriculture and Technology'],
        ['San Francisco', 8.5072, 125.9772, 'Agusan del Sur State College of Agriculture and Technology'],
        ['Prosperidad', 8.6057, 125.9153, 'Philippine Normal University Mindanao'],
        ['Surigao City', 9.7843, 125.4888, 'Surigao del Norte State University'],
        ['Del Carmen', 9.8690, 125.9700, 'Surigao del Norte State University'],
        ['Tandag', 9.0783, 126.1986, 'North Eastern Mindanao State University'],
        ['Cantilan', 9.3347, 125.9775, 'North Eastern Mindanao State University'],
        ['Bislig', 8.2153, 126.3214, 'North Eastern Mindanao State University'],
        ['San Jose, Dinagat', 10.0089, 125.5711, 'Surigao del Norte State University'],
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        [$place, $lat, $lng, $host] = fake()->randomElement(self::SITES);
        $developed = fake()->numberBetween(2, 48);
        $types = fake()->randomElements(
            array_filter(AssistanceType::cases(), fn ($t) => $t !== AssistanceType::Other),
            fake()->numberBetween(1, 5),
        );
        $fabrication = fake()->numberBetween(0, 9);

        return [
            'user_id' => User::factory(),
            'region' => 'XIII',
            // Jitter so several entries in one town don't sit on the exact same spot.
            'latitude' => round($lat + fake()->randomFloat(4, -0.02, 0.02), 7),
            'longitude' => round($lng + fake()->randomFloat(4, -0.02, 0.02), 7),
            'name' => "{$place} Food Innovation Center",
            'host_institution' => $host,
            'products_developed' => $developed,
            'products_commercialized' => fake()->numberBetween(0, intdiv($developed, 2)),
            'lto_status' => fake()->randomElement(LtoStatus::cases()),
            'msmes_needing_fabrication' => $fabrication,
            'msmes_needing_fabrication_details' => $fabrication > 0
                ? fake()->randomElement([
                    'Banana chip processors need a slicer and a vacuum fryer.',
                    'Seaweed growers need a solar dryer and sealing equipment.',
                    'Cacao groups need a roaster and a winnower for tablea.',
                    'Fish processors need a smokehouse upgrade.',
                ])
                : null,
            'msmes_needing_tech_interventions' => fake()->numberBetween(0, 14),
            'msmes_served' => fake()->numberBetween(5, 120),
            'assistance_types' => array_map(fn (AssistanceType $t) => $t->value, $types),
            'assistance_other' => null,
        ];
    }
}
