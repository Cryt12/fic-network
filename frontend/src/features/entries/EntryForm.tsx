import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { EntryFields } from '@/features/entries/EntryFields'
import { ENTRY_FIELD_KEYS, entrySchema, type EntryValues, type FieldSection } from '@/features/entries/fields'
import { applyServerErrors, scrollToFirstError } from '@/lib/form-errors'

const SECTIONS: FieldSection[] = ['location', 'about', 'products', 'msmes']

type EntryFormProps = {
  defaultValues: Partial<EntryValues>
  submitLabel: string
  pendingLabel: string
  onSubmit: (values: EntryValues) => Promise<unknown>
}

/** Add / edit form for a FIC entry: every section from fields.ts on one page. */
export function EntryForm({ defaultValues, submitLabel, pendingLabel, onSubmit }: EntryFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<EntryValues>({
    resolver: zodResolver(entrySchema),
    defaultValues,
  })

  const submit = form.handleSubmit(
    async (values) => {
      setFormError(null)
      try {
        await onSubmit(values)
      } catch (error) {
        setFormError(applyServerErrors(error, form.setError, ENTRY_FIELD_KEYS))
        scrollToFirstError()
      }
    },
    () => scrollToFirstError(),
  )

  return (
    <form onSubmit={submit} noValidate>
      {formError && (
        <Alert variant="destructive" className="mb-8">
          <CircleAlert />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <EntryFields form={form} sections={SECTIONS} />

      <div className="sticky bottom-0 -mx-4 mt-10 flex justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <Button asChild variant="ghost" size="lg">
          <Link to="/entries">Cancel</Link>
        </Button>
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  )
}
