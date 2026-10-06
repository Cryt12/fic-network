<?php

namespace App\Enums;

/**
 * Types of assistance MSMEs request from a FIC ("select all that apply").
 */
enum AssistanceType: string
{
    case ProductDevelopment = 'product_development';
    case ProcessImprovement = 'process_improvement';
    case ProductTesting = 'product_testing';
    case SensoryTesting = 'sensory_testing';
    case FoodSafety = 'food_safety';
    case PackagingLabeling = 'packaging_labeling';
    case ShelfLife = 'shelf_life';
    case EquipmentUse = 'equipment_use';
    case ScaleUp = 'scale_up';
    case TechnologyAdoption = 'technology_adoption';
    case Training = 'training';
    case Other = 'other';

    /** Wording shown to people (reports). Mirrors ASSISTANCE_TYPES in the frontend's fields.ts. */
    public function label(): string
    {
        return match ($this) {
            self::ProductDevelopment => 'Product Development / Improvement',
            self::ProcessImprovement => 'Process Improvement / Optimization',
            self::ProductTesting => 'Product Testing / Analysis',
            self::SensoryTesting => 'Sensory / Consumer Testing',
            self::FoodSafety => 'Food Safety / Regulatory Compliance',
            self::PackagingLabeling => 'Packaging / Labeling',
            self::ShelfLife => 'Shelf-life / Stability Studies',
            self::EquipmentUse => 'Use of Equipment / Processing Facilities',
            self::ScaleUp => 'Scale-up / Production Assistance',
            self::TechnologyAdoption => 'Technology Adoption / Commercialization',
            self::Training => 'Training / Technical Assistance',
            self::Other => 'Other',
        };
    }
}
