import type { ComponentProps } from 'react'
import type { FieldError as FormFieldError } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type TextFieldProps = ComponentProps<typeof Input> & {
  id: string
  label: string
  description?: string
  error?: FormFieldError
}

/** Label above, helper text and error below, all wired up for screen readers. */
export function TextField({ id, label, description, error, ...inputProps }: TextFieldProps) {
  const describedBy = [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ')

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy || undefined} {...inputProps} />
      {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
      <FieldError id={`${id}-error`} errors={error ? [error] : undefined} />
    </Field>
  )
}
