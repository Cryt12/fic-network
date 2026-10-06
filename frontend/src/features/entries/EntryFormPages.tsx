import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ErrorState } from '@/components/ErrorState'
import { Page } from '@/components/Page'
import { Skeleton } from '@/components/ui/skeleton'
import { NotFoundPage } from '@/app/NotFoundPage'
import { toFormValues, useCreateEntry, useEntry, useUpdateEntry } from '@/features/entries/api'
import { EntryForm } from '@/features/entries/EntryForm'
import { EMPTY_ENTRY } from '@/features/entries/fields'
import { ApiError } from '@/lib/api'
import { useDocumentTitle } from '@/lib/use-document-title'

export function NewEntryPage() {
  useDocumentTitle('Add New Entry')
  const navigate = useNavigate()
  const create = useCreateEntry()

  return (
    <Page title="Add New Entry" className="max-w-3xl">
      <EntryForm
        defaultValues={EMPTY_ENTRY}
        submitLabel="Save entry"
        pendingLabel="Saving..."
        onSubmit={async (values) => {
          const entry = await create.mutateAsync(values)
          toast.success(`${entry.name} was added to the map.`)
          navigate('/entries')
        }}
      />
    </Page>
  )
}

export function EditEntryPage() {
  useDocumentTitle('Edit Entry')
  const navigate = useNavigate()
  const id = Number(useParams().id)
  const entry = useEntry(Number.isInteger(id) ? id : null)
  const update = useUpdateEntry(id)

  // Someone else's entry (or a deleted one) looks like it doesn't exist. The API refuses edits anyway.
  if ((entry.data && !entry.data.is_mine) || (entry.error instanceof ApiError && entry.error.status === 404)) {
    return <NotFoundPage />
  }

  return (
    <Page title="Edit Entry" className="max-w-3xl">
      {entry.isPending ? (
        <FormSkeleton />
      ) : entry.isError ? (
        <ErrorState error={entry.error} onRetry={() => entry.refetch()} />
      ) : (
        <EntryForm
          defaultValues={toFormValues(entry.data)}
          submitLabel="Save changes"
          pendingLabel="Saving..."
          onSubmit={async (values) => {
            await update.mutateAsync(values)
            toast.success('Changes saved.')
            navigate('/entries')
          }}
        />
      )}
    </Page>
  )
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading entry">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-9 w-full max-w-md" />
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  )
}
