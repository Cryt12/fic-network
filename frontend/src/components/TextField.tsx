import { Eye, EyeOff } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import type { FieldError as FormFieldError } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type TextFieldProps = ComponentProps<typeof Input> & {
  id: string
  label: string
  description?: string
  error?: FormFieldError
}

/** Label above, helper text and error below, all wired up for screen readers. Passwords get a show/hide button. */
export function TextField({ id, label, description, error, type, className, ...inputProps }: TextFieldProps) {
  const [revealed, setRevealed] = useState(false)
  const describedBy = [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ')
  const isPassword = type === 'password'

  const input = (
    <Input
      id={id}
      type={isPassword && revealed ? 'text' : type}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy || undefined}
      className={isPassword ? 'pr-10' : className}
      {...inputProps}
    />
  )

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {isPassword ? (
        // The width classes go on the wrapper, so the button stays inside the box.
        <div className={cn('relative w-full', className)}>
          {input}
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={revealed}
            aria-controls={id}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {revealed ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
      ) : (
        input
      )}
      {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
      <FieldError id={`${id}-error`} errors={error ? [error] : undefined} />
    </Field>
  )
}
