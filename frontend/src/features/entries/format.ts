import type { FicEntry } from '@/features/entries/api'
import { ENTRY_FIELDS, optionLabel, type EntryFieldKey, type EntryValues } from '@/features/entries/fields'

const numberFormat = new Intl.NumberFormat('en-PH')

/** A field's value for display, driven by its kind in fields.ts. */
export function formatField(entry: Pick<FicEntry, 'region_name'> & Partial<FicEntry>, key: EntryFieldKey): string {
  const input = ENTRY_FIELDS[key].input
  const value = entry[key]

  switch (input.kind) {
    case 'region':
      return entry.region_name
    case 'equipment': {
      const items = (value as EntryValues['equipment'] | undefined) ?? []
      if (items.length === 0) return 'None listed'
      return items
        .map((item) => `${item.name}: ${optionLabel(input.operation, item.operation_status)}, ${optionLabel(input.utilization, item.utilization_status)}, ${item.capacity} per batch`)
        .join('\n')
    }
    case 'place':
      return entry[input.level] ?? 'Not set'
    case 'geotag':
    case 'geotag-pair':
      return typeof value === 'number' ? String(Number(value.toFixed(7))) : ''
    case 'count':
      // Null only on entries made before a count field existed (e.g. FIC personnel).
      return typeof value === 'number' ? numberFormat.format(value) : 'Not reported yet'
    case 'radio':
      return optionLabel(input.options, String(value ?? ''))
    case 'checkboxes': {
      const selected = (value as string[] | undefined) ?? []
      if (selected.length === 0) return 'None selected'
      return selected
        .map((v) => (v === 'other' && entry[input.otherField as EntryFieldKey] ? `Other: ${entry[input.otherField as EntryFieldKey]}` : optionLabel(input.options, v)))
        .join(', ')
    }
    default:
      return typeof value === 'string' && value.trim() !== '' ? value : 'None'
  }
}
