import { ArrowLeft, ChevronLeft, ChevronRight, FileSpreadsheet, History, LoaderCircle, MapPinOff, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { NotFoundPage } from '@/app/NotFoundPage'
import { downloadReport, useAdminEntries, useAdminUser, useLoginHistory, type AdminUser, type EntryFilters } from '@/features/admin/api'
import { LoginResultBadge } from '@/features/admin/LoginResultBadge'
import { LtoBadge } from '@/features/entries/LtoBadge'
import { ApiError, errorMessage } from '@/lib/api'
import { formatExact, formatRelative } from '@/lib/time'
import { describeUserAgent } from '@/lib/user-agent'
import { cn } from '@/lib/utils'
import { useDocumentTitle } from '@/lib/use-document-title'

export function AdminUserDetailPage() {
  const id = Number(useParams().id)
  const user = useAdminUser(id)
  useDocumentTitle(user.data?.name ?? 'User')

  if (user.error instanceof ApiError && user.error.status === 404) return <NotFoundPage />

  return (
    <main className="relative min-h-0 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8">
        <Link to="/admin/users" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />
          All users
        </Link>

        {user.isPending ? (
          <HeaderSkeleton />
        ) : user.isError ? (
          <ErrorState error={user.error} onRetry={() => user.refetch()} className="py-16" />
        ) : (
          <>
            <UserHeader user={user.data} />
            <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <LoginHistory userId={id} />
              <UserEntries user={user.data} />
            </div>
          </>
        )}
      </div>
    </main>
  )
}

function UserHeader({ user }: { user: AdminUser }) {
  const stats = [
    { label: 'FIC entries', value: String(user.entries_count) },
    { label: 'Successful logins', value: String(user.logins_count) },
    { label: 'Failed attempts', value: String(user.failed_logins_count), alert: user.failed_logins_count > 0 },
    { label: 'Last login', value: user.last_login_at ? formatRelative(user.last_login_at) : 'Never', title: user.last_login_at ? formatExact(user.last_login_at) : undefined },
  ]

  return (
    <header>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
        {user.is_superadmin && (
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            <ShieldCheck />
            Superadmin
          </Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {user.email}
        <span className="mx-2" aria-hidden>
          |
        </span>
        Registered {formatExact(user.created_at)}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y py-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd className={cn('mt-0.5 text-2xl font-semibold tracking-tight tabular-nums', stat.alert && 'text-destructive')} title={stat.title}>
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </header>
  )
}

function LoginHistory({ userId }: { userId: number }) {
  const [page, setPage] = useState(1)
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useLoginHistory(userId, page)

  useEffect(() => {
    if (isError) toast.error(`Couldn't load login history. ${errorMessage(error)}`, { id: 'login-history-error' })
  }, [isError, error])

  return (
    <section aria-labelledby="login-history-heading">
      <h2 id="login-history-heading" className="mb-3 text-base font-semibold tracking-tight">
        Login history
      </h2>

      {isPending ? (
        <RowsSkeleton />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} className="py-10" />
      ) : data.data.length === 0 ? (
        <EmptyState icon={History} title="No login attempts yet" description="Logins and failed attempts will be listed here." />
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-4">When</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>IP address</TableHead>
                  <TableHead className="pr-4">Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((event) => (
                  <TableRow key={event.key}>
                    <TableCell className="pl-4">
                      <span className="block">{formatExact(event.at)}</span>
                      <span className="block text-xs text-muted-foreground">{formatRelative(event.at)}</span>
                    </TableCell>
                    <TableCell>
                      <LoginResultBadge result={event.result} />
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{event.ip_address ?? 'Unknown'}</TableCell>
                    <TableCell className="pr-4 text-muted-foreground">
                      {event.user_agent ? (
                        <Tooltip>
                          <TooltipTrigger className="cursor-default text-left underline decoration-dotted underline-offset-4">
                            {describeUserAgent(event.user_agent)}
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm break-words">{event.user_agent}</TooltipContent>
                        </Tooltip>
                      ) : (
                        'Unknown device'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {data.last_page > 1 && (
            <nav aria-label="Login history pages" className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground tabular-nums">
                {data.from}-{data.to} of {data.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft data-icon="inline-start" />
                  Newer
                </Button>
                <Button variant="outline" size="sm" disabled={page >= data.last_page} onClick={() => setPage(page + 1)}>
                  Older
                  <ChevronRight data-icon="inline-end" />
                </Button>
              </div>
            </nav>
          )}
        </div>
      )}
    </section>
  )
}

const NO_FILTERS: EntryFilters = { search: '', user: '', region: '', lto_status: '', assistance_type: '', from: '', to: '' }

function UserEntries({ user }: { user: AdminUser }) {
  const filters = { ...NO_FILTERS, user: String(user.id) }
  const { data, isPending, isError, error, refetch } = useAdminEntries(filters, 1)
  const [downloading, setDownloading] = useState(false)

  const download = async () => {
    setDownloading(true)
    try {
      await downloadReport(filters)
      toast.success('Report downloaded.')
    } catch (e) {
      toast.error(`Couldn't generate the report. ${errorMessage(e)}`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section aria-labelledby="user-entries-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="user-entries-heading" className="text-base font-semibold tracking-tight">
          FIC entries
        </h2>
        {user.entries_count > 0 && (
          <Button variant="outline" size="sm" onClick={download} disabled={downloading}>
            {downloading ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <FileSpreadsheet data-icon="inline-start" />}
            Excel
          </Button>
        )}
      </div>

      {isPending ? (
        <RowsSkeleton />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} className="py-10" />
      ) : data.data.length === 0 ? (
        <EmptyState icon={MapPinOff} title="No entries" description={`${user.name} hasn't added a FIC yet.`} />
      ) : (
        <>
          <ul className="divide-y rounded-lg border">
            {data.data.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{entry.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.host_institution}
                    <br />
                    {entry.region_name}
                  </p>
                </div>
                <LtoBadge status={entry.lto_status} className="shrink-0" />
              </li>
            ))}
          </ul>
          <Link to={`/admin?user=${user.id}`} className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
            See all fields in All Entries
          </Link>
        </>
      )}
    </section>
  )
}

function HeaderSkeleton() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading user">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-4 w-80" />
      <div className="mt-4 grid grid-cols-4 gap-6 border-y py-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    </div>
  )
}

function RowsSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="h-5" />
      ))}
    </div>
  )
}
