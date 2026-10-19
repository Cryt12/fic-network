import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ErrorState } from '@/components/ErrorState'
import { Page } from '@/components/Page'
import { Skeleton } from '@/components/ui/skeleton'
import { NotFoundPage } from '@/app/NotFoundPage'
import { useCreateMsmeReport, useMsmeReport, useUpdateMsmeReport } from '@/features/msme-reports/api'
import { MsmeReportForm } from '@/features/msme-reports/MsmeReportForm'
import { ApiError } from '@/lib/api'
import { useDocumentTitle } from '@/lib/use-document-title'

export function NewMsmeReportPage() {
  useDocumentTitle('Add New Entry')
  const navigate = useNavigate()
  const create = useCreateMsmeReport()

  return (
    <Page title="Add New Entry" className="max-w-xl">
      <MsmeReportForm
        submitLabel="Save entry"
        onSubmit={async (values) => {
          await create.mutateAsync(values)
          toast.success('Entry saved. It now counts toward your region on the Dashboard.')
          navigate('/msme-reports')
        }}
      />
    </Page>
  )
}

export function EditMsmeReportPage() {
  useDocumentTitle('Edit Entry')
  const navigate = useNavigate()
  const id = Number(useParams().id)
  const report = useMsmeReport(Number.isInteger(id) ? id : null)
  const update = useUpdateMsmeReport(id)

  // Someone else's report (or a deleted one) looks like it doesn't exist. The API refuses edits anyway.
  if (report.error instanceof ApiError && (report.error.status === 403 || report.error.status === 404)) {
    return <NotFoundPage />
  }

  return (
    <Page title="Edit Entry" className="max-w-xl">
      {report.isPending ? (
        <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading entry">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-40" />
        </div>
      ) : report.isError ? (
        <ErrorState error={report.error} onRetry={() => report.refetch()} />
      ) : (
        <MsmeReportForm
          defaultValues={{ msme_partners: report.data.msme_partners, msmes_with_lto: report.data.msmes_with_lto }}
          submitLabel="Save changes"
          onSubmit={async (values) => {
            await update.mutateAsync(values)
            toast.success('Changes saved.')
            navigate('/msme-reports')
          }}
        />
      )}
    </Page>
  )
}
