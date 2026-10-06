import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, CircleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm, type Path } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { TextField } from '@/components/TextField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { useRegister } from '@/features/auth/api'
import { AuthPanel } from '@/features/auth/AuthLayout'
import { ACCOUNT_FIELDS, registerSchema, type RegisterValues } from '@/features/auth/schemas'
import { EntryFields } from '@/features/entries/EntryFields'
import { EMPTY_ENTRY, fieldsInSection, type FieldSection } from '@/features/entries/fields'
import { applyServerErrors, scrollToFirstError } from '@/lib/form-errors'
import { useRevalidateErrors } from '@/lib/use-revalidate-errors'
import { cn } from '@/lib/utils'
import { useDocumentTitle } from '@/lib/use-document-title'

type Step = {
  title: string
  subtitle: string
  /** Entry sections from fields.ts shown on this step; none = the account step. */
  sections: FieldSection[]
}

const STEPS: Step[] = [
  { title: 'Account', subtitle: 'Sign up to put your Food Innovation Center on the map.', sections: [] },
  { title: 'Location', subtitle: 'Pick your region and pin where your FIC is.', sections: ['location'] },
  { title: 'FIC details', subtitle: 'Tell the network about your FIC. You can edit this later.', sections: ['about', 'products', 'msmes'] },
]

const fieldsOfStep = (step: Step): Path<RegisterValues>[] =>
  step.sections.length === 0
    ? [...ACCOUNT_FIELDS]
    : step.sections.flatMap((section) => fieldsInSection(section).map((key) => `entry.${key}` as Path<RegisterValues>))

const ALL_FIELDS = STEPS.flatMap(fieldsOfStep)

export function RegisterPage() {
  useDocumentTitle('Create an account')
  const navigate = useNavigate()
  const register = useRegister()
  const [stepIndex, setStepIndex] = useState(0)
  const [formError, setFormError] = useState<string | null>(null)
  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', password_confirmation: '', entry: EMPTY_ENTRY },
  })
  const { errors } = form.formState
  useRevalidateErrors(form)

  const goTo = (index: number) => {
    setStepIndex(index)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const next = async () => {
    if (await form.trigger(fieldsOfStep(step))) goTo(stepIndex + 1)
    else scrollToFirstError()
  }

  const submit = form.handleSubmit(
    async (values) => {
      setFormError(null)
      try {
        const user = await register.mutateAsync(values)
        toast.success(`Welcome, ${user.name}. Your FIC is on the map.`)
        navigate('/', { replace: true })
      } catch (error) {
        setFormError(applyServerErrors(error, form.setError, ALL_FIELDS))
        // Send them back to the first step that has a server-side error.
        const firstBad = STEPS.findIndex((s) => fieldsOfStep(s).some((f) => form.getFieldState(f).error))
        if (firstBad !== -1 && firstBad !== stepIndex) goTo(firstBad)
        scrollToFirstError()
      }
    },
    () => scrollToFirstError(),
  )

  return (
    <AuthPanel
      title="Create an account"
      subtitle={step.subtitle}
      footer={
        stepIndex === 0 && (
          <>
            Already registered?{' '}
            <Link to="/login" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
              Log in
            </Link>
          </>
        )
      }
    >
      <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Signup steps">
        {STEPS.map((s, i) => (
          <li key={s.title} aria-current={i === stepIndex ? 'step' : undefined} className="flex flex-col gap-1.5">
            <span className={cn('h-1 rounded-full transition-colors duration-300', i <= stepIndex ? 'bg-primary' : 'bg-border')} />
            <span className={cn('text-xs', i === stepIndex ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              {i + 1}. {s.title}
            </span>
          </li>
        ))}
      </ol>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (isLast) void submit(event)
          else void next()
        }}
      >
        {formError && (
          <Alert variant="destructive" className="mb-6">
            <CircleAlert />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div key={stepIndex} className="auth-panel-enter">
          {step.sections.length === 0 ? (
            <FieldGroup className="gap-5">
              <TextField
                id="name"
                label="Name"
                autoComplete="name"
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
            </FieldGroup>
          ) : (
            <EntryFields form={form} sections={step.sections} prefix="entry." />
          )}
        </div>

        <div className="mt-6 flex gap-2">
          {stepIndex > 0 && (
            <Button type="button" variant="outline" size="lg" onClick={() => goTo(stepIndex - 1)} disabled={register.isPending}>
              <ArrowLeft data-icon="inline-start" />
              Back
            </Button>
          )}
          <Button type="submit" size="lg" className="flex-1" disabled={register.isPending}>
            {isLast ? (register.isPending ? 'Creating account...' : 'Create account') : 'Continue'}
            {!isLast && <ArrowRight data-icon="inline-end" />}
          </Button>
        </div>
      </form>
    </AuthPanel>
  )
}
