<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One infographic generated through OpenRouter. Created "pending" by the superadmin, then filled
 * in by App\Jobs\GenerateImageReport.
 */
#[Fillable(['model', 'options', 'figures', 'system_prompt', 'prompt'])]
class ImageReport extends Model
{
    public const PENDING = 'pending';

    public const SUCCEEDED = 'succeeded';

    public const FAILED = 'failed';

    /** A pending report older than this was never picked up (or the worker died). */
    public const STALE_AFTER_MINUTES = 10;

    protected $attributes = ['status' => self::PENDING];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => 'array',
            'figures' => 'array',
            'cost_usd' => 'float',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Marks pending reports that nothing is working on as failed, so the page stops waiting. */
    public static function failStale(): void
    {
        static::query()
            ->where('status', self::PENDING)
            ->where('created_at', '<', now()->subMinutes(self::STALE_AFTER_MINUTES))
            ->update([
                'status' => self::FAILED,
                'error' => 'Nothing picked this report up. Make sure the fic-queue service is running, then try again.',
                'completed_at' => now(),
            ]);
    }
}
