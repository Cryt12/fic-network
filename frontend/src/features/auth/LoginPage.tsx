import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { TextField } from '@/components/TextField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { useLogin } from '@/features/auth/api'
import { AuthPanel } from '@/features/auth/AuthLayout'
import { loginSchema, type LoginValues } from '@/features/auth/schemas'
import { ApiError, errorMessage } from '@/lib/api'
import { useDocumentTitle } from '@/lib/use-document-title'

export function LoginPage() {
  useDocumentTitle('Log in')
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login.mutateAsync(values)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? '/', { replace: true })
    } catch (error) {
      // Wrong credentials come back as a 422 on "email"; show them as one message, not a field error.
      setFormError(
        error instanceof ApiError && error.status === 422
          ? (Object.values(error.errors)[0]?.[0] ?? error.message)
          : errorMessage(error),
      )
      form.resetField('password')
    }
  })

  return (
    <AuthPanel
      title="Log in"
      subtitle="Food Innovation Centers across the Philippines, on one map."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
            Create an account
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
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus
            error={errors.email}
            {...form.register('email')}
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password}
            {...form.register('password')}
          />
          <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Logging in...' : 'Log in'}
          </Button>
        </FieldGroup>
      </form>
    </AuthPanel>
  )
}
