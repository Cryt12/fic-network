<?php

namespace App\Enums;

/**
 * How much a piece of FIC equipment is used.
 */
enum EquipmentUtilization: string
{
    case Regularly = 'regularly_used';
    case Occasionally = 'occasionally_used';
    case Rarely = 'rarely_used';
    case NotCurrently = 'not_currently_used';

    /** Mirrors EQUIPMENT_UTILIZATION in the frontend's fields.ts. */
    public function label(): string
    {
        return match ($this) {
            self::Regularly => 'Regularly used',
            self::Occasionally => 'Occasionally used',
            self::Rarely => 'Rarely used',
            self::NotCurrently => 'Not currently used',
        };
    }
}
