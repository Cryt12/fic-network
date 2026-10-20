<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EmailChangeRequest;
use App\Http\Requests\ProfileRequest;
use App\Http\Resources\UserResource;
use App\Support\AvatarImage;
use Illuminate\Http\Request;

/**
 * My Profile: every account edits its own details, photo and login email. (Passwords change
 * through AuthController::changePassword.) Always the signed-in user, never another account.
 */
class ProfileController extends Controller
{
    public function update(ProfileRequest $request): UserResource
    {
        $user = $request->user();
        $details = collect($request->validated())->map(fn ($value) => is_string($value) ? (trim($value) === '' ? null : trim($value)) : $value);

        $user->fill($details->all());
        $user->name = collect([$user->first_name, $user->middle_name, $user->last_name])->filter()->implode(' ');
        $user->save();

        return new UserResource($user);
    }

    public function updateEmail(EmailChangeRequest $request): UserResource
    {
        $user = $request->user();
        $user->forceFill(['email' => $request->validated('email')])->save();

        return new UserResource($user);
    }

    public function updateAvatar(Request $request): UserResource
    {
        $request->validate(
            ['photo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048', 'dimensions:min_width=32,min_height=32,max_width=8000,max_height=8000']],
            [
                'photo.max' => 'The photo must be 2 MB or smaller.',
                'photo.mimes' => 'Use a JPG, PNG or WebP photo.',
                'photo.image' => 'Use a JPG, PNG or WebP photo.',
                'photo.dimensions' => 'The photo must be between 32 and 8000 pixels wide and tall.',
            ],
        );

        $user = $request->user();
        $old = $user->avatar_path;
        $user->forceFill(['avatar_path' => AvatarImage::store($request->file('photo'))])->save();
        AvatarImage::delete($old);

        return new UserResource($user);
    }

    public function destroyAvatar(Request $request): UserResource
    {
        $user = $request->user();
        AvatarImage::delete($user->avatar_path);
        $user->forceFill(['avatar_path' => null])->save();

        return new UserResource($user);
    }
}
