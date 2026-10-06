import { z } from 'zod'

/*
 * THE single place FIC entry fields are defined on the frontend. The entry form,
 * signup step, validation, preview panel, My Entries table and map popup are all
 * built from this file. Mirrors backend/app/Http/Requests/FicEntryRequest.php.
 *
 * Adding a field: one entry in ENTRY_FIELDS (plus the backend migration, request rule
 * and resource). Cross-field rules live in entrySchema below.
 */

export const LTO_STATUSES = [
  { value: 'with_valid_lto', label: 'With valid LTO' },
  { value: 'in_process', label: 'LTO application in process' },
  { value: 'no_lto', label: 'No LTO' },
  { value: 'not_applicable', label: 'Not applicable' },
] as const

export const ASSISTANCE_TYPES = [
  { value: 'product_development', label: 'Product Development / Improvement' },
  { value: 'process_improvement', label: 'Process Improvement / Optimization' },
  { value: 'product_testing', label: 'Product Testing / Analysis' },
  { value: 'sensory_testing', label: 'Sensory / Consumer Testing' },
  { value: 'food_safety', label: 'Food Safety / Regulatory Compliance' },
  { value: 'packaging_labeling', label: 'Packaging / Labeling' },
  { value: 'shelf_life', label: 'Shelf-life / Stability Studies' },
  { value: 'equipment_use', label: 'Use of Equipment / Processing Facilities' },
  { value: 'scale_up', label: 'Scale-up / Production Assistance' },
  { value: 'technology_adoption', label: 'Technology Adoption / Commercialization' },
  { value: 'training', label: 'Training / Technical Assistance' },
  { value: 'other', label: 'Other' },
] as const

type Option = { readonly value: string; readonly label: string }

/** How a field is entered. Some kinds render together (the geotag pair, checkboxes + "other"). */
export type FieldInput =
  | { kind: 'region' }
  | { kind: 'geotag' } // renders the map picker for latitude + longitude
  | { kind: 'geotag-pair' } // longitude: rendered by the latitude's picker
  | { kind: 'text'; maxLength: number }
  | { kind: 'count' }
  | { kind: 'textarea'; maxLength: number }
  | { kind: 'radio'; options: readonly Option[] }
  | { kind: 'checkboxes'; options: readonly Option[]; otherField: string } // otherField: key of its checkboxes-other field
  | { kind: 'checkboxes-other'; maxLength: number } // rendered inside its checkboxes field

export type FieldSection = 'location' | 'about' | 'products' | 'msmes'

export const SECTIONS: Record<FieldSection, { title: string; description: string }> = {
  location: { title: 'Location', description: 'Where the FIC is. Its pin on the map uses these coordinates.' },
  about: { title: 'About the FIC', description: 'The center and the institution that hosts it.' },
  products: { title: 'Products and licensing', description: 'Output so far and License to Operate status.' },
  msmes: { title: 'MSMEs', description: 'Micro, small and medium enterprises the FIC works with.' },
}

type FieldConfig = {
  label: string
  /** Column header in the My Entries table, when the label is too long. */
  shortLabel?: string
  section: FieldSection
  input: FieldInput
  schema: z.ZodType
  description?: string
  /** Where the value appears besides the form. */
  showIn: { popup?: boolean; table?: boolean; preview?: boolean }
}

const count = z
  .number({ error: 'Enter a number (0 if none).' })
  .int('Use a whole number.')
  .min(0, 'Cannot be negative.')
  .max(1_000_000, 'That number is too large.')

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `Enter the ${label}.`).max(max, `Keep it under ${max} characters.`)

export const ENTRY_FIELDS = {
  region: {
    label: 'Region',
    section: 'location',
    input: { kind: 'region' },
    schema: z.string().min(1, 'Select a region.'),
    showIn: { popup: true, table: true, preview: true },
  },
  latitude: {
    label: 'Latitude',
    section: 'location',
    input: { kind: 'geotag' },
    schema: z.number({ error: 'Set the location on the map or enter a latitude.' }).min(-90, 'Latitude must be between -90 and 90.').max(90, 'Latitude must be between -90 and 90.'),
    showIn: { preview: true },
  },
  longitude: {
    label: 'Longitude',
    section: 'location',
    input: { kind: 'geotag-pair' },
    schema: z.number({ error: 'Set the location on the map or enter a longitude.' }).min(-180, 'Longitude must be between -180 and 180.').max(180, 'Longitude must be between -180 and 180.'),
    showIn: { preview: true },
  },
  name: {
    label: 'Name of FIC',
    shortLabel: 'FIC',
    section: 'about',
    input: { kind: 'text', maxLength: 255 },
    schema: requiredText('name of the FIC', 255),
    showIn: { popup: true, table: true, preview: true },
  },
  host_institution: {
    label: 'Host institution (university)',
    shortLabel: 'Host institution',
    section: 'about',
    input: { kind: 'text', maxLength: 255 },
    schema: requiredText('host institution', 255),
    showIn: { popup: true, table: true, preview: true },
  },
  products_developed: {
    label: 'Number of products developed',
    shortLabel: 'Developed',
    section: 'products',
    input: { kind: 'count' },
    schema: count,
    showIn: { table: true, preview: true },
  },
  products_commercialized: {
    label: 'Number of FIC-developed products commercialized',
    shortLabel: 'Commercialized',
    description: 'Adopted by an MSME or a university spin-off company through a technology licensing agreement (TLA).',
    section: 'products',
    input: { kind: 'count' },
    schema: count,
    showIn: { table: true, preview: true },
  },
  lto_status: {
    label: 'License to Operate (LTO) status',
    shortLabel: 'LTO status',
    section: 'products',
    input: { kind: 'radio', options: LTO_STATUSES },
    schema: z.enum(LTO_STATUSES.map((o) => o.value), { error: 'Select the LTO status.' }),
    showIn: { popup: true, table: true, preview: true },
  },
  msmes_needing_fabrication: {
    label: 'Existing MSMEs that require equipment fabrication for shopfloor innovations',
    shortLabel: 'MSMEs needing fabrication',
    description: 'How many.',
    section: 'msmes',
    input: { kind: 'count' },
    schema: count,
    showIn: { preview: true },
  },
  msmes_needing_fabrication_details: {
    label: 'Which MSMEs, and what equipment? (optional)',
    shortLabel: 'Fabrication details',
    section: 'msmes',
    input: { kind: 'textarea', maxLength: 2000 },
    schema: z.string().max(2000, 'Keep it under 2000 characters.'),
    showIn: { preview: true },
  },
  msmes_needing_tech_interventions: {
    label: 'Number of MSMEs that require technology interventions',
    shortLabel: 'MSMEs needing tech interventions',
    section: 'msmes',
    input: { kind: 'count' },
    schema: count,
    showIn: { preview: true },
  },
  msmes_served: {
    label: 'Number of MSMEs served',
    shortLabel: 'MSMEs served',
    section: 'msmes',
    input: { kind: 'count' },
    schema: count,
    showIn: { preview: true },
  },
  assistance_types: {
    label: 'Types of assistance requested by MSMEs from your FIC',
    shortLabel: 'Assistance requested',
    description: 'Select all that apply.',
    section: 'msmes',
    input: { kind: 'checkboxes', options: ASSISTANCE_TYPES, otherField: 'assistance_other' },
    schema: z.array(z.enum(ASSISTANCE_TYPES.map((o) => o.value))),
    showIn: { preview: true },
  },
  assistance_other: {
    label: 'Other type of assistance',
    section: 'msmes',
    input: { kind: 'checkboxes-other', maxLength: 255 },
    schema: z.string().max(255, 'Keep it under 255 characters.'),
    showIn: {},
  },
} satisfies Record<string, FieldConfig>

export type EntryFieldKey = keyof typeof ENTRY_FIELDS

export const ENTRY_FIELD_KEYS = Object.keys(ENTRY_FIELDS) as EntryFieldKey[]

/** Optional free-text fields: the API returns null when they're empty. */
export type OptionalTextKey = {
  [K in EntryFieldKey]: (typeof ENTRY_FIELDS)[K]['input']['kind'] extends 'textarea' | 'checkboxes-other' ? K : never
}[EntryFieldKey]

type Shape = { [K in EntryFieldKey]: (typeof ENTRY_FIELDS)[K]['schema'] }
const shape = Object.fromEntries(ENTRY_FIELD_KEYS.map((key) => [key, ENTRY_FIELDS[key].schema])) as Shape

export const entrySchema = z.object(shape).superRefine((entry, ctx) => {
  if (entry.products_commercialized > entry.products_developed) {
    ctx.addIssue({
      code: 'custom',
      path: ['products_commercialized'],
      message: 'Products commercialized cannot be more than products developed.',
    })
  }
  if (entry.assistance_types.includes('other') && entry.assistance_other.trim() === '') {
    ctx.addIssue({ code: 'custom', path: ['assistance_other'], message: 'Describe the other type of assistance.' })
  }
})

export type EntryValues = z.infer<typeof entrySchema>

/** Empty form. Counts start blank (not 0) so nobody submits a guess by accident. */
export const EMPTY_ENTRY = {
  region: '',
  name: '',
  host_institution: '',
  msmes_needing_fabrication_details: '',
  assistance_types: [],
  assistance_other: '',
} satisfies Partial<EntryValues>

export const fieldsInSection = (section: FieldSection) =>
  ENTRY_FIELD_KEYS.filter((key) => ENTRY_FIELDS[key].section === section)

export const fieldsShownIn = (place: keyof FieldConfig['showIn']) =>
  ENTRY_FIELD_KEYS.filter((key) => (ENTRY_FIELDS[key].showIn as FieldConfig['showIn'])[place])

export function shortLabel(key: EntryFieldKey): string {
  const config: FieldConfig = ENTRY_FIELDS[key]
  return config.shortLabel ?? config.label
}

export function optionLabel(options: readonly Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value
}
