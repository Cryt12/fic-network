<?php

namespace App\Enums;

enum Role: string
{
    case User = 'user';
    case Superadmin = 'superadmin';
}
