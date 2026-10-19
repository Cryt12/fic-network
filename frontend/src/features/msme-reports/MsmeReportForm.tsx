import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { TextField } from '@/components/TextField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/features/auth/current-user'
import { MSME_REPORT_FIELDS, msmeReportSchema, type MsmeReportValues } from '@/features/msme-reports/schema'
import { applyServerErrors, scrollToFirstError } from '@/lib/form-errors'

type MsmeReportFormProps = {
  defaultValues?: MsmeReportValues
  submitLabel: string
  onSubmit: (values: MsmeReportValues) => Promise<unknown>
}

/** The two numbers a DOST FIC Focal reports for their region. */
export function MsmeReportForm({ defaultValues, submitLabel, onSubmit }: MsmeReportFormProps) {
  const user = useCurrentUser()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<MsmeReportValues>({ resolver: zodResolver(msmeReportSchema), defaultValues })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      await onSubmit(values)
    } catch (error) {
      setFormError(applyServerErrors(error, form.setError, MSME_REPORT_FIELDS))
      scrollToFirstError()
    }
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      {formError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
        <p className="text-muted-foreground">Region</p>
        <p className="font-medium">{user.region_name ?? 'Not set'}</p>
      </div>

      <TextField
        id="msme_partners"
        label="No. of Food MSME partners"
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        className="max-w-40 tabular-nums"
        error={errors.msme_partners}
        {...form.register('msme_partners', { valueAsNumber: true })}
      />
      <TextField
        id="msmes_with_lto"
        label="No. of MSMEs with LTO"
        description="Of the Food MSME partners above, how many hold a License to Operate."
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        className="max-w-40 tabular-nums"
        error={errors.msmes_with_lto}
        {...form.register('msmes_with_lto', { valueAsNumber: true })}
      />

      <p className="text-sm text-muted-foreground">Each entry adds to your region's totals on the Dashboard.</p>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button asChild variant="ghost" size="lg">
          <Link to="/msme-reports">Cancel</Link>
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
