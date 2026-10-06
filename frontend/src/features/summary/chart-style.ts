/*
 * Chart colors (validated with the dataviz palette checker: CVD and normal-vision separation pass).
 * Gold is low-contrast on the light surface, so every bar carries a visible value label and the
 * page has a full table view.
 */
export const DEVELOPED = '#13834f'
export const COMMERCIALIZED = '#e0a11b'

export const number = new Intl.NumberFormat('en-PH')
export const percent = new Intl.NumberFormat('en-PH', { style: 'percent', maximumFractionDigits: 0 })

/** "Region XIII (Caraga)" -> "Caraga"; keeps chart labels short. Full names are in the table. */
export function shortRegion(name: string): string {
  return /\(([^)]+)\)$/.exec(name)?.[1] ?? name.replace(/ Region$/, '')
}
