<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Creates the single superadmin from SUPERADMIN_* in .env.
 *
 * Safe to re-run. The .env values are the source of truth: re-seeding resets the
 * account's name, password and role to them. That also defuses anyone who managed
 * to register the address as a normal user before it was seeded.
 */
class SuperadminSeeder extends Seeder
{
    public function run(): void
    {
        ['name' => $name, 'email' => $email, 'password' => $password] = config('fic.superadmin');

        if (blank($email) || blank($password)) {
            throw new RuntimeException('Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in .env before seeding.');
        }

        User::firstOrNew(['email' => Str::lower($email)])
            ->forceFill([
                'name' => $name,
                'email' => $email,
                'password' => $password,
                'role' => Role::Superadmin,
            ])
            ->save();
    }
}
