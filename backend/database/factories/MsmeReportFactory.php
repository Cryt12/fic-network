<?php

namespace Database\Factories;

use App\Models\MsmeReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MsmeReport>
 */
class MsmeReportFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $partners = fake()->numberBetween(5, 120);

        return [
            'user_id' => User::factory()->focal(),
            'region' => fn (array $attributes) => User::find($attributes['user_id'])?->region ?? 'XIII',
            'msme_partners' => $partners,
            'msmes_with_lto' => fake()->numberBetween(0, $partners),
        ];
    }
}
