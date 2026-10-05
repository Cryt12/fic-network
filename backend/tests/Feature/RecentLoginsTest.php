<?php

namespace Tests\Feature;

use App\Models\LoginActivity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecentLoginsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_see_recent_logins(): void
    {
        $this->getJson('/api/recent-logins')->assertUnauthorized();
    }

    public function test_names_are_masked_and_nothing_identifying_is_sent(): void
    {
        $maria = User::factory()->create(['name' => 'Maria Clara Santos', 'email' => 'maria@example.com']);
        LoginActivity::factory()->for($maria)->create();

        $response = $this->actingAs(User::factory()->create())
            ->getJson('/api/recent-logins')
            ->assertOk()
            ->assertJsonPath('data.0.masked_name', 'Mari***');

        $this->assertSame(['id', 'masked_name', 'logged_in_at'], array_keys($response->json('data.0')));

        $body = $response->getContent();
        $this->assertStringNotContainsString('Maria Clara', $body);
        $this->assertStringNotContainsString('maria@example.com', $body);
    }

    public function test_each_user_appears_once_with_their_latest_login_newest_first(): void
    {
        $ana = User::factory()->create(['name' => 'Analyn Reyes']);
        $ben = User::factory()->create(['name' => 'Benjie Cruz']);

        LoginActivity::factory()->for($ana)->create(['logged_in_at' => now()->subHours(5)]);
        LoginActivity::factory()->for($ben)->create(['logged_in_at' => now()->subHours(3)]);
        $anaLatest = LoginActivity::factory()->for($ana)->create(['logged_in_at' => now()->subHour()]);

        $data = $this->actingAs($ana)->getJson('/api/recent-logins')->assertOk()->json('data');

        $this->assertSame(['Anal***', 'Benj***'], array_column($data, 'masked_name'));
        $this->assertSame($anaLatest->id, $data[0]['id']);
    }

    public function test_only_the_15_most_recent_users_are_returned(): void
    {
        User::factory(18)->create()->each(
            fn (User $user, int $i) => LoginActivity::factory()->for($user)->create(['logged_in_at' => now()->subMinutes($i)]),
        );

        $this->actingAs(User::first())
            ->getJson('/api/recent-logins')
            ->assertOk()
            ->assertJsonCount(15, 'data');
    }
}
