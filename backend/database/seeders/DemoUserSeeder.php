<?php

namespace Database\Seeders;

use App\Models\LoginActivity;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Local-only sample accounts (password: "password") with a few days of logins,
 * so the Recently Logged In panel has something to show.
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
        }
    }
}
