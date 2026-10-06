import { z } from 'zod'
import { entrySchema } from '@/features/entries/fields'

// Mirrors backend/app/Http/Requests/Auth/*Request.php and Password::defaults() in AppServiceProvider.

const email = z.email('Enter a valid email address.').max(255)

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.').max(255),
})

const accountShape = {
  name: z.string().trim().min(1, 'Enter your name.').max(255),
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

export const ACCOUNT_FIELDS = Object.keys(accountShape) as (keyof typeof accountShape)[]

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
