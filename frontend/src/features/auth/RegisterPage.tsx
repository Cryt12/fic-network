import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { TextField } from '@/components/TextField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { useRegister } from '@/features/auth/api'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { registerSchema, type RegisterValues } from '@/features/auth/schemas'
import { applyServerErrors } from '@/lib/form-errors'
import { useDocumentTitle } from '@/lib/use-document-title'

const FIELDS = ['name', 'email', 'password', 'password_confirmation'] as const

// Phase 3 adds the FIC details and location steps to this form.
export function RegisterPage() {
  useDocumentTitle('Create an account')
  const navigate = useNavigate()
  const register = useRegister()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', password_confirmation: '' },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      const user = await register.mutateAsync(values)
      toast.success(`Welcome, ${user.name}.`)
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(applyServerErrors(error, form.setError, FIELDS))
    }
  })

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Sign up to put your Food Innovation Center on the Caraga map."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          {formError && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <TextField
            id="name"
            label="Name"
            autoComplete="name"
            autoFocus
            description="Shown to other members as the first few letters only."
            error={errors.name}
            {...form.register('name')}
          />
          <TextField id="email" label="Email" type="email" autoComplete="email" error={errors.email} {...form.register('email')} />
          <TextField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            description="At least 8 characters, with a letter and a number."
            error={errors.password}
            {...form.register('password')}
          />
          <TextField
            id="password_confirmation"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={errors.password_confirmation}
            {...form.register('password_confirmation')}
          />
          <Button type="submit" size="lg" className="w-full" disabled={register.isPending}>
            {register.isPending ? 'Creating account...' : 'Create account'}
          </Button>
        </FieldGroup>
      </form>
    </AuthLayout>
  )
}
