<?php

namespace App\Enums;

/**
 * Operation status of a piece of FIC equipment.
 */
enum EquipmentOperation: string
{
    case Operational = 'operational';
    case UnderMaintenance = 'under_maintenance';
    case NonOperational = 'non_operational';
    case ForDecommissioning = 'for_decommissioning';

    /** Mirrors EQUIPMENT_OPERATION in the frontend's fields.ts. */
    public function label(): string
    {
        return match ($this) {
            self::Operational => 'Operational',
            self::UnderMaintenance => 'Under maintenance',
            self::NonOperational => 'Non-operational',
            self::ForDecommissioning => 'For decommissioning (irreparable)',
        };
    }
}
