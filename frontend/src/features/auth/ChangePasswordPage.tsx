import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { TextField } from '@/components/TextField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { useChangePassword, useLogout } from '@/features/auth/api'
import { AuthPanel } from '@/features/auth/AuthLayout'
import { useCurrentUser } from '@/features/auth/current-user'
import { newPasswordSchema, type NewPasswordValues } from '@/features/auth/schemas'
import { applyServerErrors } from '@/lib/form-errors'
import { useDocumentTitle } from '@/lib/use-document-title'

/** Shown after the superadmin resets the account: a new password replaces the temporary one. */
export function ChangePasswordPage() {
  useDocumentTitle('Set a new password')
  const user = useCurrentUser()
  const navigate = useNavigate()
  const change = useChangePassword()
  const logout = useLogout()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', password_confirmation: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      await change.mutateAsync(values)
      toast.success('Password changed. Use your new password from now on.')
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(applyServerErrors(error, form.setError, ['password', 'password_confirmation']))
    }
  })

  const onLogout = async () => {
    await logout.mutateAsync().catch(() => undefined)
    navigate('/login', { replace: true })
  }

  return (
    <AuthPanel
      title="Set a new password"
      subtitle={`Your password was reset by the administrator. Choose a new password for ${user.email} to continue.`}
      footer={
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:text-destructive hover:underline"
        >
          <LogOut className="size-4" aria-hidden />
          Log out instead
        </button>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="gap-5">
          {formError && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <TextField
            id="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            description="At least 8 characters, with a letter and a number."
            autoFocus
            error={errors.password}
            {...form.register('password')}
          />
          <TextField
            id="password_confirmation"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={errors.password_confirmation}
            {...form.register('password_confirmation')}
          />
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save new password'}
          </Button>
        </FieldGroup>
      </form>
    </AuthPanel>
  )
}
