<?php

namespace App\Enums;

/**
 * License to Operate (LTO) status of a FIC.
 */
enum LtoStatus: string
{
    case WithValidLto = 'with_valid_lto';
    case InProcess = 'in_process';
    case NoLto = 'no_lto';
    case NotApplicable = 'not_applicable';

    /** Wording shown to people (reports). Mirrors LTO_STATUSES in the frontend's fields.ts. */
    public function label(): string
    {
        return match ($this) {
            self::WithValidLto => 'With valid LTO',
            self::InProcess => 'LTO application in process',
            self::NoLto => 'No LTO',
            self::NotApplicable => 'Not applicable',
        };
    }
}
