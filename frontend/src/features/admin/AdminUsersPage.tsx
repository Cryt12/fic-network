import { ChevronLeft, ChevronRight, Search, ShieldCheck, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Page } from '@/components/Page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAdminUsers, type AdminUser, type UserFilters, type UserSort } from '@/features/admin/api'
import { errorMessage } from '@/lib/api'
import { formatExact, formatRelative } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useDocumentTitle } from '@/lib/use-document-title'

const SORTS: { value: UserSort; label: string }[] = [
  { value: 'newest', label: 'Newest accounts' },
  { value: 'last_login', label: 'Last login' },
  { value: 'failed_logins', label: 'Most failed attempts' },
  { value: 'name', label: 'Name (A to Z)' },
]

const ALL = 'all'

export function AdminUsersPage() {
  useDocumentTitle('Users')
  const [params, setParams] = useSearchParams()
  const filters: UserFilters = {
    search: params.get('search') ?? '',
    role: params.get('role') ?? '',
    sort: (SORTS.find((s) => s.value === params.get('sort'))?.value ?? 'newest') as UserSort,
  }
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [searchText, setSearchText] = useState(filters.search)
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useAdminUsers(filters, page)

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: key !== 'page' })
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (searchText.trim() !== filters.search) update('search', searchText.trim())
    }, 300)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing
  }, [searchText])

  useEffect(() => {
    if (isError) toast.error(`Couldn't load users. ${errorMessage(error)}`, { id: 'admin-users-error' })
  }, [isError, error])

  return (
    <Page title="Users" className="max-w-[1400px]">
      <p className="-mt-6 mb-6 max-w-[65ch] text-sm text-muted-foreground">
        Everyone who created an account, with their logins and failed login attempts.
      </p>

      <section aria-label="Filters" className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-1.5">
          <Label htmlFor="user-search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="user-search" type="search" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Name or email" className="pl-8" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="user-role">Role</Label>
          <Select value={filters.role || ALL} onValueChange={(v) => update('role', v === ALL ? '' : v)}>
            <SelectTrigger id="user-role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All roles</SelectItem>
              <SelectItem value="user">Members</SelectItem>
              <SelectItem value="superadmin">Superadmin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="user-sort">Sort by</Label>
          <Select value={filters.sort} onValueChange={(v) => update('sort', v === 'newest' ? '' : v)}>
            <SelectTrigger id="user-sort" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {isPending ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} className="py-16" />
      ) : data.data.length === 0 ? (
        <EmptyState icon={UsersRound} title="No users found" description="Try a different name or email, or clear the role filter." className="py-10" />
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          <UsersTable users={data.data} />
          {data.meta.last_page > 1 && (
            <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground tabular-nums">
                {data.meta.from}-{data.meta.to} of {data.meta.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => update('page', String(page - 1))}>
                  <ChevronLeft data-icon="inline-start" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= data.meta.last_page} onClick={() => update('page', String(page + 1))}>
                  Next
                  <ChevronRight data-icon="inline-end" />
                </Button>
              </div>
            </nav>
          )}
        </div>
      )}
    </Page>
  )
}

function UsersTable({ users }: { users: AdminUser[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="pl-4">Member</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead className="text-right">Entries</TableHead>
            <TableHead className="text-right">Logins</TableHead>
            <TableHead className="text-right">Failed attempts</TableHead>
            <TableHead className="pr-4">Last login</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="relative">
              <TableCell className="pl-4">
                {/* The whole row is clickable through this link's ::after overlay. */}
                <Link
                  to={`/admin/users/${user.id}`}
                  className="font-medium outline-none after:absolute after:inset-0 hover:underline focus-visible:underline"
                >
                  {user.name}
                </Link>
                {user.is_superadmin && <ShieldCheck className="ml-1.5 inline size-3.5 text-primary" aria-label="Superadmin" />}
                <span className="block text-sm text-muted-foreground">{user.email}</span>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatExact(user.created_at)}</TableCell>
              <TableCell className="text-right tabular-nums">{user.entries_count}</TableCell>
              <TableCell className="text-right tabular-nums">{user.logins_count}</TableCell>
              <TableCell className={cn('text-right tabular-nums', user.failed_logins_count > 0 && 'font-semibold text-destructive')}>
                {user.failed_logins_count}
              </TableCell>
              <TableCell className="pr-4 text-muted-foreground">
                {user.last_login_at ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <time dateTime={user.last_login_at} className="relative z-10">
                        {formatRelative(user.last_login_at)}
                      </time>
                    </TooltipTrigger>
                    <TooltipContent>{formatExact(user.last_login_at)}</TooltipContent>
                  </Tooltip>
                ) : (
                  'Never'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4" aria-busy="true" aria-label="Loading users">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}
