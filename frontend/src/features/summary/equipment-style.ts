import type { ChartConfig } from '@/components/ui/chart'
import { EQUIPMENT_OPERATION, EQUIPMENT_UTILIZATION } from '@/features/entries/fields'

export type View = 'operation' | 'utilization'

/** Status colors: operation reads as a traffic light; utilization runs from dark green (regular) to grey (unused). */
export const COLORS: Record<View, Record<string, string>> = {
  operation: {
    operational: '#13834f',
    under_maintenance: '#e0a11b',
    non_operational: '#d1495b',
    for_decommissioning: '#5b6472',
  },
  utilization: {
    regularly_used: '#13834f',
    occasionally_used: '#5bb98a',
    rarely_used: '#a9d8bd',
    not_currently_used: '#9aa3ad',
  },
}

export const OPTIONS: Record<View, readonly { value: string; label: string }[]> = {
  operation: EQUIPMENT_OPERATION,
  utilization: EQUIPMENT_UTILIZATION,
}

export const equipmentConfig = (view: View) =>
  Object.fromEntries(OPTIONS[view].map((o) => [o.value, { label: o.label, color: COLORS[view][o.value] }])) satisfies ChartConfig
