<?php

namespace App\Models;

use Database\Factories\MsmeReportFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Food MSME partners in one region, as reported by a DOST FIC Focal account.
 * The region is never fillable: it always comes from the Focal's own profile.
 */
#[Fillable(['msme_partners', 'msmes_with_lto'])]
class MsmeReport extends Model
{
    /** @use HasFactory<MsmeReportFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'msme_partners' => 'integer',
            'msmes_with_lto' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
