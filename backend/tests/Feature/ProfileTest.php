<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_member_edits_their_profile(): void
    {
        $user = User::factory()->create(['name' => 'Old Name', 'role' => 'user']);

        $this->actingAs($user)->patchJson('/api/profile', [
            'first_name' => ' Maria ', 'middle_name' => '', 'last_name' => 'Santos',
            'organization' => 'Caraga State University', 'position' => 'Food Technologist',
            'contact_number' => '+63 917 123 4567', 'bio' => 'Runs the pilot plant.',
            'role' => 'superadmin', 'region' => 'NCR', 'email' => 'taken@example.com', // ignored
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Maria Santos')
            ->assertJsonPath('data.middle_name', null)
            ->assertJsonPath('data.organization', 'Caraga State University')
            ->assertJsonPath('data.contact_number', '+63 917 123 4567')
            ->assertJsonPath('data.role', 'user');

        $this->assertSame($user->getOriginal('email'), $user->fresh()->email);
    }

    public function test_profile_details_are_validated(): void
    {
        $this->actingAs(User::factory()->create())
            ->patchJson('/api/profile', ['first_name' => '', 'last_name' => 'X', 'contact_number' => 'call me', 'bio' => str_repeat('a', 501)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['first_name', 'contact_number', 'bio']);
    }

    public function test_a_focal_keeps_their_dost_details_and_region(): void
    {
        $focal = User::factory()->focal()->create(['region' => 'XIII']);

        $this->actingAs($focal)
            ->patchJson('/api/profile', ['first_name' => 'Liza', 'last_name' => 'Ocampo', 'position' => '', 'dost_unit' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['position', 'dost_unit', 'age']);

        $this->patchJson('/api/profile', ['first_name' => 'Liza', 'last_name' => 'Ocampo', 'age' => 41, 'position' => 'SRS II', 'dost_unit' => 'FOS', 'region' => 'NCR'])
            ->assertOk()
            ->assertJsonPath('data.position', 'SRS II')
            ->assertJsonPath('data.region', 'XIII'); // can't move regions
    }

    public function test_changing_the_login_email_needs_the_current_password(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);
        $user = User::factory()->create(['email' => 'me@example.com', 'password' => 'Current-pass-1']);

        $this->actingAs($user)->patchJson('/api/profile/email', ['email' => 'new@example.com', 'current_password' => 'wrong'])
            ->assertJsonValidationErrors(['current_password' => 'incorrect']);
        $this->patchJson('/api/profile/email', ['email' => 'TAKEN@example.com', 'current_password' => 'Current-pass-1'])
            ->assertJsonValidationErrors(['email']);

        $this->patchJson('/api/profile/email', ['email' => 'New@Example.com', 'current_password' => 'Current-pass-1'])
            ->assertOk()
            ->assertJsonPath('data.email', 'new@example.com');
    }

    public function test_the_superadmin_email_is_not_changed_here(): void
    {
        $admin = User::factory()->superadmin()->create(['password' => 'Current-pass-1']);

        $this->actingAs($admin)->patchJson('/api/profile/email', ['email' => 'other@example.com', 'current_password' => 'Current-pass-1'])->assertForbidden();
    }

    public function test_a_photo_is_re_encoded_and_replaces_the_old_one(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $first = $this->actingAs($user)->post('/api/profile/photo', ['photo' => UploadedFile::fake()->image('me.jpg', 1600, 1200)], ['Accept' => 'application/json'])
            ->assertOk()
            ->json('data.avatar_url');
        $this->assertStringStartsWith('/storage/avatars/', $first);
        $path = $user->fresh()->avatar_path;
        Storage::disk('public')->assertExists($path);
        $this->assertStringEndsWith('.webp', $path);
        [$width, $height] = getimagesizefromstring(Storage::disk('public')->get($path));
        $this->assertSame([512, 384], [$width, $height]); // scaled down

        $this->post('/api/profile/photo', ['photo' => UploadedFile::fake()->image('new.png', 200, 200)], ['Accept' => 'application/json'])->assertOk();
        Storage::disk('public')->assertMissing($path); // old photo removed

        $this->deleteJson('/api/profile/photo')->assertOk()->assertJsonPath('data.avatar_url', null);
        $this->assertCount(0, Storage::disk('public')->allFiles('avatars'));
    }

    public function test_photos_are_validated(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $headers = ['Accept' => 'application/json'];

        $this->actingAs($user)->post('/api/profile/photo', ['photo' => UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf')], $headers)
            ->assertJsonValidationErrors(['photo']);
        $this->post('/api/profile/photo', ['photo' => UploadedFile::fake()->image('huge.jpg', 800, 800)->size(2100)], $headers)
            ->assertJsonValidationErrors(['photo' => '2 MB']);
        $this->post('/api/profile/photo', ['photo' => UploadedFile::fake()->create('evil.svg', 1, 'image/svg+xml')], $headers)
            ->assertJsonValidationErrors(['photo']);

        $this->assertNull($user->fresh()->avatar_path);
    }

    public function test_guests_cannot_touch_profiles(): void
    {
        $this->patchJson('/api/profile', ['first_name' => 'A', 'last_name' => 'B'])->assertUnauthorized();
        $this->postJson('/api/profile/photo')->assertUnauthorized();
    }
}
