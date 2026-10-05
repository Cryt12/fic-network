import { z } from 'zod'

// Mirrors backend/app/Http/Requests/Auth/*Request.php and Password::defaults() in AppServiceProvider.

const email = z.email('Enter a valid email address.').max(255)

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.').max(255),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name.').max(255),
    email,
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .max(255)
      .regex(/\p{L}/u, 'Include at least one letter.')
      .regex(/\p{N}/u, 'Include at least one number.'),
    password_confirmation: z.string(),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Passwords do not match.',
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
