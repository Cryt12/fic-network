import { z } from 'zod'
import type { User } from '@/features/auth/api'

// Mirrors backend ProfileRequest, EmailChangeRequest and ChangePasswordRequest.

const optional = (max: number, message = `Keep it under ${max} characters.`) => z.string().trim().max(max, message)

export const detailsSchema = z.object({
  first_name: z.string().trim().min(1, 'Enter your first name.').max(100),
  middle_name: optional(100),
  last_name: z.string().trim().min(1, 'Enter your last name.').max(100),
  contact_number: optional(30).refine((v) => v === '' || /^\+?[0-9][0-9 ()-]{5,28}$/.test(v), 'Enter a phone number using digits, spaces, dashes or a leading +.'),
  bio: optional(500, 'Keep it under 500 characters.'),
  organization: optional(150),
  position: optional(150),
  dost_unit: optional(150),
  age: z.number({ error: 'Enter your age.' }).int('Use a whole number.').min(18, 'You must be at least 18.').max(100, 'Enter a valid age.').nullable(),
})

/** DOST FIC Focal accounts keep the details they signed up with. */
export const focalDetailsSchema = detailsSchema.extend({
  position: z.string().trim().min(1, 'Enter your position.').max(150),
  dost_unit: z.string().trim().min(1, 'Enter your DOST unit or division.').max(150),
  age: detailsSchema.shape.age.unwrap(),
})

export type DetailsValues = z.infer<typeof detailsSchema>

export const DETAIL_FIELDS = Object.keys(detailsSchema.shape) as (keyof DetailsValues)[]

/**
 * Form values from the account. Accounts made before names were split into parts only have
 * a full name: it is split at the last space as a starting point the owner can correct.
 */
export function detailsFrom(user: User): DetailsValues {
  const words = user.name.trim().split(/\s+/)
  const hasParts = Boolean(user.first_name || user.last_name)
  return {
    first_name: hasParts ? (user.first_name ?? '') : words.slice(0, -1).join(' ') || (words[0] ?? ''),
    middle_name: user.middle_name ?? '',
    last_name: hasParts ? (user.last_name ?? '') : words.length > 1 ? (words.at(-1) ?? '') : '',
    contact_number: user.contact_number ?? '',
    bio: user.bio ?? '',
    organization: user.organization ?? '',
    position: user.position ?? '',
    dost_unit: user.dost_unit ?? '',
    age: user.age,
  }
}

export const emailSchema = z.object({
  email: z.email('Enter a valid email address.').max(255),
  current_password: z.string().min(1, 'Enter your current password.'),
})

export type EmailValues = z.infer<typeof emailSchema>

export const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password.'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .max(255)
      .regex(/\p{L}/u, 'Include at least one letter.')
      .regex(/\p{N}/u, 'Include at least one number.'),
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, { path: ['password_confirmation'], message: 'Passwords do not match.' })
  .refine((v) => v.password !== v.current_password, { path: ['password'], message: 'Choose a password different from your current one.' })

export type PasswordValues = z.infer<typeof passwordSchema>
