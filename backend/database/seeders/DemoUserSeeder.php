<?php

namespace Database\Seeders;

use App\Models\FailedLoginAttempt;
use App\Models\FicEntry;
use App\Models\LoginActivity;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Local-only sample accounts (password: "password") with a few days of logins, the odd
 * wrong password, and one or two FIC entries each, so every screen has data.
 */
class DemoUserSeeder extends Seeder
{
    private const NAMES = [
        'Rosalinda Dumaguing', 'Jericho Balabag', 'Mae Ann Lagura', 'Tess', 'Kristoffer Abellanosa',
        'Precious Gwen Tabañag', 'Ronel Pacatang', 'Lyn', 'Dionisio Ebarle', 'Charmaine Udtohan',
        'Arnel Sumampong', 'Hazel Joy Montecillo',
    ];

    public function run(): void
    {
        foreach (self::NAMES as $i => $name) {
            $user = User::factory()->create([
                'name' => $name,
                'email' => 'demo'.($i + 1).'@fic.local',
            ]);

            LoginActivity::factory()
                ->for($user)
                ->count(fake()->numberBetween(1, 4))
                ->create();

            FailedLoginAttempt::factory()
                ->for($user)
                ->count(fake()->randomElement([0, 0, 1, 2, 4]))
                ->create(['email' => $user->email]);

            FicEntry::factory()
                ->for($user)
                ->count(fake()->numberBetween(1, 2))
                ->create();
        }
    }
}
