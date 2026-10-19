<?php

namespace App\Policies;

use App\Models\MsmeReport;
use App\Models\User;

/**
 * Only DOST FIC Focal accounts report MSME partners, for their own region, and only the
 * Focal who added a report can change or delete it. Everyone else sees the totals only.
 */
class MsmeReportPolicy
{
    public function create(User $user): bool
    {
        return $user->isFocal() && $user->region !== null;
    }

    public function update(User $user, MsmeReport $report): bool
    {
        return $user->isFocal() && $user->id === $report->user_id;
    }

    public function delete(User $user, MsmeReport $report): bool
    {
        return $this->update($user, $report);
    }
}
