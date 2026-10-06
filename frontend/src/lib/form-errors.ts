import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError, errorMessage } from '@/lib/api'

/**
 * Puts Laravel 422 errors on their matching form fields. Anything that isn't a
 * field error (429, 500, network) is returned as a message for the form-level alert.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): string | null {
  if (error instanceof ApiError && error.status === 422) {
    let unmatched: string | null = null
    for (const [rawField, messages] of Object.entries(error.errors)) {
      // "assistance_types.0" (an array item) belongs to the "assistance_types" input.
      const field = rawField.replace(/\.\d+$/, '')
      if ((fields as readonly string[]).includes(field)) {
        setError(field as Path<T>, { type: 'server', message: messages[0] })
      } else {
        unmatched ??= messages[0] ?? error.message
      }
    }
    return unmatched
  }
  return errorMessage(error)
}

/** Brings the first invalid input into view (after a server-side 422 on a long form). */
export function scrollToFirstError(): void {
  requestAnimationFrame(() => {
    const invalid = document.querySelector<HTMLElement>('[aria-invalid="true"]')
    invalid?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    invalid?.focus({ preventScroll: true })
  })
}
