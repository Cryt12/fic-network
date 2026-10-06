<?php

namespace Database\Factories;

use App\Enums\LoginFailure;
use App\Models\FailedLoginAttempt;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FailedLoginAttempt>
 */
class FailedLoginAttemptFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'email' => fn (array $attributes) => User::find($attributes['user_id'])?->email ?? fake()->safeEmail(),
            'reason' => LoginFailure::WrongPassword,
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
            'attempted_at' => fake()->dateTimeBetween('-3 days'),
        ];
    }
}
