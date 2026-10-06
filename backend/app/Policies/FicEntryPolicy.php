<?php

namespace App\Policies;

use App\Models\FicEntry;
use App\Models\User;

/**
 * Every member can see every entry (it's a shared network map); only the owner can change it.
 * The superadmin gets no special write access: the brief gives them read access only.
 */
class FicEntryPolicy
{
    public function view(User $user, FicEntry $entry): bool
    {
        return true;
    }

    public function update(User $user, FicEntry $entry): bool
    {
        return $user->id === $entry->user_id;
    }

    public function delete(User $user, FicEntry $entry): bool
    {
        return $user->id === $entry->user_id;
    }
}
