import { z } from 'zod'

const count = z
  .number({ error: 'Enter a number (0 if none).' })
  .int('Use a whole number.')
  .min(0, 'Cannot be negative.')
  .max(1_000_000, 'That number is too large.')

/** Mirrors backend MsmeReportRequest. */
export const msmeReportSchema = z
  .object({
    msme_partners: count,
    msmes_with_lto: count,
  })
  .refine((v) => v.msmes_with_lto <= v.msme_partners, {
    path: ['msmes_with_lto'],
    message: "This can't be more than the number of Food MSME partners.",
  })

export type MsmeReportValues = z.infer<typeof msmeReportSchema>

export const MSME_REPORT_FIELDS = ['msme_partners', 'msmes_with_lto'] as const
