import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, ImageUp, LoaderCircle, Trash2 } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Page } from '@/components/Page'
import { TextField } from '@/components/TextField'
import { UserAvatar } from '@/components/UserAvatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import type { User } from '@/features/auth/api'
import { useCurrentUser } from '@/features/auth/current-user'
import { useChangeMyPassword, useRemovePhoto, useUpdateDetails, useUpdateEmail, useUploadPhoto } from '@/features/profile/api'
import {
  DETAIL_FIELDS,
  detailsFrom,
  detailsSchema,
  emailSchema,
  focalDetailsSchema,
  passwordSchema,
  type DetailsValues,
  type EmailValues,
  type PasswordValues,
} from '@/features/profile/schema'
import { errorMessage } from '@/lib/api'
import { applyServerErrors } from '@/lib/form-errors'
import { formatExact } from '@/lib/time'
import { useDocumentTitle } from '@/lib/use-document-title'

const BIO_MAX = 500

export function ProfilePage() {
  useDocumentTitle('My Profile')
  const user = useCurrentUser()

  return (
    <Page title="My Profile" className="max-w-4xl">
      <p className="-mt-6 mb-8 text-sm text-muted-foreground">
        {user.role_label}
        {user.region_name && ` · ${user.region_name}`} · Member since {formatExact(user.created_at)}
      </p>

      <PhotoSection user={user} />
      <DetailsSection user={user} />
      <EmailSection user={user} />
      <PasswordSection />
    </Page>
  )
}

function Section({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-x-10 gap-y-5 border-t py-8 first:border-t-0 first:pt-0 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

function SaveRow({ pending, disabled, label = 'Save changes' }: { pending: boolean; disabled?: boolean; label?: string }) {
  return (
    <div className="flex justify-end">
      <Button type="submit" disabled={pending || disabled}>
        {pending && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
        {pending ? 'Saving...' : label}
      </Button>
    </div>
  )
}

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const PHOTO_MAX_BYTES = 2 * 1024 * 1024

function PhotoSection({ user }: { user: User }) {
  const input = useRef<HTMLInputElement>(null)
  const upload = useUploadPhoto()
  const remove = useRemovePhoto()
  const busy = upload.isPending || remove.isPending

  const onFile = async (file: File | undefined) => {
    if (input.current) input.current.value = '' // choosing the same file again still triggers a change
    if (!file) return
    // Checked here for a quick answer; the server checks again and re-encodes the image.
    if (!PHOTO_TYPES.includes(file.type)) return toast.error('Use a JPG, PNG or WebP photo.')
    if (file.size > PHOTO_MAX_BYTES) return toast.error('The photo must be 2 MB or smaller.')
    try {
      await upload.mutateAsync(file)
      toast.success('Profile photo updated.')
    } catch (error) {
      toast.error(`Couldn't upload the photo. ${errorMessage(error)}`)
    }
  }

  const onRemove = async () => {
    try {
      await remove.mutateAsync(undefined)
      toast.success('Profile photo removed.')
    } catch (error) {
      toast.error(`Couldn't remove the photo. ${errorMessage(error)}`)
    }
  }

  return (
    <Section title="Profile photo" description="Shown in the menu and to the superadmin. JPG, PNG or WebP, up to 2 MB.">
      <div className="flex flex-wrap items-center gap-5">
        <UserAvatar name={user.name} url={user.avatar_url} size="lg" />
        <div className="flex flex-wrap gap-2">
          <input ref={input} type="file" accept={PHOTO_TYPES.join(',')} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void onFile(e.target.files?.[0])} />
          <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
            {upload.isPending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <ImageUp data-icon="inline-start" />}
            {upload.isPending ? 'Uploading...' : user.avatar_url ? 'Change photo' : 'Upload photo'}
          </Button>
          {user.avatar_url && (
            <Button type="button" variant="ghost" disabled={busy} onClick={onRemove} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 data-icon="inline-start" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </Section>
  )
}

function DetailsSection({ user }: { user: User }) {
  const focal = user.is_focal
  const update = useUpdateDetails()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<DetailsValues>({ resolver: zodResolver(focal ? focalDetailsSchema : detailsSchema), defaultValues: detailsFrom(user) })
  const { errors, isDirty, isSubmitting } = form.formState
  const bioLength = useWatch({ control: form.control, name: 'bio' }).length

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    const { organization, dost_unit, age, ...common } = values
    try {
      const saved = await update.mutateAsync(focal ? { ...common, dost_unit, age } : { ...common, organization })
      form.reset(detailsFrom(saved))
      toast.success('Profile saved.')
    } catch (error) {
      setFormError(applyServerErrors(error, form.setError, DETAIL_FIELDS))
    }
  })

  return (
    <Section title="Profile details" description="Your name appears across OneFIC, including on your FIC entries.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FormError message={formError} />
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField id="first_name" label="First name" autoComplete="given-name" error={errors.first_name} {...form.register('first_name')} />
          <TextField id="middle_name" label="Middle name" description="Optional" autoComplete="additional-name" error={errors.middle_name} {...form.register('middle_name')} />
          <TextField id="last_name" label="Last name" autoComplete="family-name" error={errors.last_name} {...form.register('last_name')} />
        </div>

        {focal ? (
          <>
            <div className="grid gap-5 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <TextField id="age" label="Age" type="number" inputMode="numeric" min={18} max={100} error={errors.age} {...form.register('age', { valueAsNumber: true })} />
              <TextField id="position" label="Position" autoComplete="organization-title" error={errors.position} {...form.register('position')} />
            </div>
            <TextField id="dost_unit" label="DOST unit / division" error={errors.dost_unit} {...form.register('dost_unit')} />
            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
              <p className="text-muted-foreground">Region</p>
              <p className="font-medium">{user.region_name ?? 'Not set'}</p>
              <p className="mt-1 text-xs text-muted-foreground">Your entries count toward this region. To change it, ask the OneFIC superadmin.</p>
            </div>
          </>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="organization"
              label="Organization"
              description="Optional, e.g. your university or agency"
              autoComplete="organization"
              error={errors.organization}
              {...form.register('organization')}
            />
            <TextField
              id="position"
              label="Position / designation"
              description="Optional"
              autoComplete="organization-title"
              error={errors.position}
              {...form.register('position')}
            />
          </div>
        )}

        <TextField
          id="contact_number"
          label="Contact number"
          description="Optional, e.g. +63 917 123 4567"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="max-w-xs"
          error={errors.contact_number}
          {...form.register('contact_number')}
        />

        <Field data-invalid={errors.bio ? true : undefined}>
          <FieldLabel htmlFor="bio">Short bio</FieldLabel>
          <Textarea id="bio" rows={4} maxLength={BIO_MAX} aria-invalid={errors.bio ? true : undefined} aria-describedby="bio-count" {...form.register('bio')} />
          <FieldDescription id="bio-count" className="tabular-nums">
            Optional. {bioLength}/{BIO_MAX} characters
          </FieldDescription>
          <FieldError errors={errors.bio ? [errors.bio] : undefined} />
        </Field>

        <SaveRow pending={isSubmitting} disabled={!isDirty} />
      </form>
    </Section>
  )
}

function EmailSection({ user }: { user: User }) {
  const update = useUpdateEmail()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<EmailValues>({ resolver: zodResolver(emailSchema), defaultValues: { email: user.email, current_password: '' } })
  const { errors, isSubmitting } = form.formState
  const changed = useWatch({ control: form.control, name: 'email' }).trim().toLowerCase() !== user.email

  if (user.is_superadmin) {
    return (
      <Section title="Login email" description="The email you log in with.">
        <p className="font-medium">{user.email}</p>
        <p className="mt-1 text-sm text-muted-foreground">The superadmin email is set in the server settings (SUPERADMIN_EMAIL in the backend .env), not here.</p>
      </Section>
    )
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      const saved = await update.mutateAsync(values)
      form.reset({ email: saved.email, current_password: '' })
      toast.success(`Login email changed to ${saved.email}.`)
    } catch (error) {
      setFormError(applyServerErrors(error, form.setError, ['email', 'current_password']))
    }
  })

  return (
    <Section title="Login email" description="The email you log in with. Changing it needs your current password.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FormError message={formError} />
        <TextField id="email" label="Email" type="email" autoComplete="email" className="max-w-md" error={errors.email} {...form.register('email')} />
        {changed && (
          <TextField
            id="email_current_password"
            label="Current password"
            type="password"
            autoComplete="current-password"
            className="max-w-md"
            error={errors.current_password}
            {...form.register('current_password')}
          />
        )}
        <SaveRow pending={isSubmitting} disabled={!changed} label="Change email" />
      </form>
    </Section>
  )
}

function PasswordSection() {
  const change = useChangeMyPassword()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', password: '', password_confirmation: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      await change.mutateAsync(values)
      form.reset()
      toast.success('Password changed. Any other devices signed in to your account were signed out.')
    } catch (error) {
      setFormError(applyServerErrors(error, form.setError, ['current_password', 'password', 'password_confirmation']))
    }
  })

  return (
    <Section title="Password" description="At least 8 characters, with a letter and a number. Other devices are signed out when you change it.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FormError message={formError} />
        <TextField
          id="current_password"
          label="Current password"
          type="password"
          autoComplete="current-password"
          className="max-w-md"
          error={errors.current_password}
          {...form.register('current_password')}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id="new_password" label="New password" type="password" autoComplete="new-password" error={errors.password} {...form.register('password')} />
          <TextField
            id="new_password_confirmation"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={errors.password_confirmation}
            {...form.register('password_confirmation')}
          />
        </div>
        <SaveRow pending={isSubmitting} label="Change password" />
      </form>
    </Section>
  )
}
