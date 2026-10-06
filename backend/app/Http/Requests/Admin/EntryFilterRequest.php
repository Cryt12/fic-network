<?php

namespace App\Http\Requests\Admin;

use App\Enums\AssistanceType;
use App\Enums\LtoStatus;
use App\Models\FicEntry;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/**
 * Filters for the superadmin's All Entries table and its Excel report. Both go through
 * filteredQuery(), so the download always matches what's on screen.
 */
class EntryFilterRequest extends FormRequest
{
    public const SORTS = ['newest', 'oldest', 'name', 'region'];

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'user' => ['nullable', 'integer', 'exists:users,id'],
            'region' => ['nullable', Rule::in(array_keys(config('regions')))],
            'lto_status' => ['nullable', Rule::enum(LtoStatus::class)],
            'assistance_type' => ['nullable', Rule::enum(AssistanceType::class)],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'sort' => ['nullable', Rule::in(self::SORTS)],
        ];
    }

    /**
     * @return Builder<FicEntry>
     */
    public function filteredQuery(): Builder
    {
        $filters = $this->validated();
        $timezone = config('fic.timezone');

        return FicEntry::query()
            ->when($filters['search'] ?? null, function (Builder $query, string $search) {
                $like = '%'.addcslashes($search, '\\%_').'%';
                $query->where(fn (Builder $q) => $q
                    ->whereLike('name', $like)
                    ->orWhereLike('host_institution', $like)
                    ->orWhereHas('user', fn (Builder $u) => $u->whereLike('name', $like)->orWhereLike('email', $like)));
            })
            ->when($filters['user'] ?? null, fn (Builder $q, int|string $user) => $q->where('user_id', $user))
            ->when($filters['region'] ?? null, fn (Builder $q, string $region) => $q->where('region', $region))
            ->when($filters['lto_status'] ?? null, fn (Builder $q, string $status) => $q->where('lto_status', $status))
            ->when($filters['assistance_type'] ?? null, fn (Builder $q, string $type) => $q->whereJsonContains('assistance_types', $type))
            // Dates are calendar days in the Philippines, not UTC.
            ->when($filters['from'] ?? null, fn (Builder $q, string $from) => $q->where('created_at', '>=', Carbon::parse($from, $timezone)->startOfDay()->utc()))
            ->when($filters['to'] ?? null, fn (Builder $q, string $to) => $q->where('created_at', '<=', Carbon::parse($to, $timezone)->endOfDay()->utc()))
            ->tap(fn (Builder $q) => match ($filters['sort'] ?? 'newest') {
                'oldest' => $q->oldest()->orderBy('id'),
                'name' => $q->orderBy('name')->orderBy('id'),
                'region' => $q->orderBy('region')->orderBy('name')->orderBy('id'),
                default => $q->latest()->orderByDesc('id'),
            });
    }

    /**
     * The filters in words, for the report's Summary sheet.
     *
     * @return array<string, string>
     */
    public function describe(): array
    {
        $filters = $this->validated();

        return [
            'Search' => $filters['search'] ?? 'None',
            'Submitted by' => isset($filters['user']) ? User::find($filters['user'])->email : 'Anyone',
            'Region' => isset($filters['region']) ? config("regions.{$filters['region']}") : 'All regions',
            'LTO status' => isset($filters['lto_status']) ? LtoStatus::from($filters['lto_status'])->label() : 'All',
            'Type of assistance' => isset($filters['assistance_type']) ? AssistanceType::from($filters['assistance_type'])->label() : 'All',
            'Submitted' => match (true) {
                isset($filters['from'], $filters['to']) => "{$filters['from']} to {$filters['to']}",
                isset($filters['from']) => "From {$filters['from']}",
                isset($filters['to']) => "Up to {$filters['to']}",
                default => 'Any date',
            },
        ];
    }
}
