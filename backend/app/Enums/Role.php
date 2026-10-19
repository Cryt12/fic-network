<?php

namespace App\Enums;

enum Role: string
{
    case User = 'user';
    /** DOST FIC Focal: a regional office account. Views all FIC data, read-only. */
    case Focal = 'focal';
    case Superadmin = 'superadmin';

    public function label(): string
    {
        return match ($this) {
            self::User => 'FIC member',
            self::Focal => 'DOST FIC Focal',
            self::Superadmin => 'Superadmin',
        };
    }
}
