import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { TextField } from '@/components/TextField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRegisterFocal } from '@/features/auth/api'
import { focalSchema, type FocalValues } from '@/features/auth/schemas'
import { useRegions } from '@/features/entries/api'
import { applyServerErrors, scrollToFirstError } from '@/lib/form-errors'

const FIELDS = [
  'region',
  'first_name',
  'middle_name',
  'last_name',
  'age',
  'position',
  'dost_unit',
  'email',
  'password',
  'password_confirmation',
] as const

/** Signup for a DOST FIC Focal account: a regional office, with view-only access to all FIC data. */
export function FocalSignupForm() {
  const navigate = useNavigate()
  const register = useRegisterFocal()
  const regions = useRegions()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<FocalValues>({
    resolver: zodResolver(focalSchema),
    defaultValues: {
      region: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      position: '',
      dost_unit: '',
      email: '',
      password: '',
      password_confirmation: '',
    },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit(
    async (values) => {
      setFormError(null)
      try {
        const user = await register.mutateAsync(values)
        toast.success(`Welcome, ${user.name}.`)
        navigate('/', { replace: true })
      } catch (error) {
        setFormError(applyServerErrors(error, form.setError, FIELDS))
        scrollToFirstError()
      }
    },
    () => scrollToFirstError(),
  )

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-5">
        {formError && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Controller
          control={form.control}
          name="region"
          render={({ field }) => (
            <Field data-invalid={errors.region ? true : undefined}>
              <FieldLabel htmlFor="focal-region">Region</FieldLabel>
              <Select value={field.value || undefined} onValueChange={field.onChange} disabled={!regions.data}>
                <SelectTrigger id="focal-region" aria-invalid={errors.region ? true : undefined} className="w-full" onBlur={field.onBlur}>
                  <SelectValue placeholder={regions.isPending ? 'Loading regions...' : 'Select your regional office'} />
                </SelectTrigger>
                <SelectContent>
                  {regions.data?.map((region) => (
                    <SelectItem key={region.code} value={region.code}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={errors.region ? [errors.region] : undefined} />
            </Field>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id="first_name" label="First name" autoComplete="given-name" error={errors.first_name} {...form.register('first_name')} />
          <TextField
            id="middle_name"
            label="Middle name (optional)"
            autoComplete="additional-name"
            error={errors.middle_name}
            {...form.register('middle_name')}
          />
        </div>
        <TextField id="last_name" label="Last name" autoComplete="family-name" error={errors.last_name} {...form.register('last_name')} />

        <TextField
          id="age"
          label="Age"
          type="number"
          inputMode="numeric"
          min={18}
          max={100}
          className="max-w-32 tabular-nums"
          error={errors.age}
          {...form.register('age', { valueAsNumber: true })}
        />
        <TextField id="position" label="Position" autoComplete="organization-title" error={errors.position} {...form.register('position')} />
        <TextField id="dost_unit" label="DOST unit / division" error={errors.dost_unit} {...form.register('dost_unit')} />

        <TextField id="focal-email" label="Email" type="email" autoComplete="email" error={errors.email} {...form.register('email')} />
        <TextField
          id="focal-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          description="At least 8 characters, with a letter and a number."
          error={errors.password}
          {...form.register('password')}
        />
        <TextField
          id="focal-password_confirmation"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.password_confirmation}
          {...form.register('password_confirmation')}
        />

        <Button type="submit" size="lg" className="w-full" disabled={register.isPending}>
          {register.isPending ? 'Creating account...' : 'Create Focal account'}
        </Button>
      </FieldGroup>
    </form>
  )
}
