import { z } from 'zod'
import { entrySchema } from '@/features/entries/fields'

// Mirrors backend/app/Http/Requests/Auth/*Request.php and Password::defaults() in AppServiceProvider.

const email = z.email('Enter a valid email address.').max(255)

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.').max(255),
})

const accountShape = {
  first_name: z.string().trim().min(1, 'Enter your first name.').max(100),
  middle_name: z.string().trim().max(100),
  last_name: z.string().trim().min(1, 'Enter your last name.').max(100),
  email,
  password: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .max(255)
    .regex(/\p{L}/u, 'Include at least one letter.')
    .regex(/\p{N}/u, 'Include at least one number.'),
  password_confirmation: z.string(),
}

const passwordsMatch = (values: { password: string; password_confirmation: string }) =>
  values.password === values.password_confirmation
const passwordsMatchError = { path: ['password_confirmation'], message: 'Passwords do not match.' }

/** Signup = account + the user's first FIC entry (fields.ts), nested under "entry". */
export const registerSchema = z
  .object({ ...accountShape, entry: entrySchema })
  .refine(passwordsMatch, passwordsMatchError)

/** DOST FIC Focal signup. Mirrors backend/app/Http/Requests/Auth/FocalRegisterRequest.php. */
export const focalSchema = z
  .object({
    region: z.string().min(1, 'Select your region.'),
    first_name: z.string().trim().min(1, 'Enter your first name.').max(100),
    middle_name: z.string().trim().max(100),
    last_name: z.string().trim().min(1, 'Enter your last name.').max(100),
    age: z.number({ error: 'Enter your age.' }).int('Use a whole number.').min(18, 'You must be at least 18.').max(100, 'Enter a valid age.'),
    position: z.string().trim().min(1, 'Enter your position.').max(150),
    dost_unit: z.string().trim().min(1, 'Enter your DOST unit or division.').max(150),
    email,
    password: accountShape.password,
    password_confirmation: z.string(),
  })
  .refine(passwordsMatch, passwordsMatchError)

export type FocalValues = z.infer<typeof focalSchema>

export const ACCOUNT_FIELDS = Object.keys(accountShape) as (keyof typeof accountShape)[]

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
