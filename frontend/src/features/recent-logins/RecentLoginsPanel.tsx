import { useQuery } from '@tanstack/react-query'
import { RotateCw, UsersRound } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { api, errorMessage } from '@/lib/api'
import { formatExact, formatRelative, useNow } from '@/lib/time'

type RecentLogin = {
  id: number
  /** Masked by the API ("DOST***"); the full name never reaches the browser. */
  masked_name: string
  logged_in_at: string
}

const recentLoginsQuery = {
  queryKey: ['recent-logins'],
  queryFn: async () => (await api<{ data: RecentLogin[] }>('/recent-logins')).data,
  refetchInterval: 30_000,
} as const

export function RecentLoginsPanel() {
  const { data, isPending, isError, error, refetch, isRefetching } = useQuery(recentLoginsQuery)
  const now = useNow(30_000)

  useEffect(() => {
    // One toast id, so a failing 30-second poll doesn't stack up toasts.
    if (isError) toast.error(`Couldn't load recent logins. ${errorMessage(error)}`, { id: 'recent-logins-error' })
  }, [isError, error])

  return (
    <section aria-labelledby="recent-logins-heading" className="flex h-full min-h-0 flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 px-4">
        <h2 id="recent-logins-heading" className="text-sm font-semibold tracking-tight">
          Recently logged in
        </h2>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        {isPending ? (
          <LoadingRows />
        ) : isError && !data ? (
          <div className="flex flex-col items-start gap-3 px-4 py-6 text-sm">
            <p className="text-muted-foreground">The list couldn't be loaded.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
              <RotateCw data-icon="inline-start" className={isRefetching ? 'animate-spin' : undefined} />
              Try again
            </Button>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-start gap-2 px-4 py-6">
            <UsersRound className="size-5 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Nobody has logged in yet. New logins show up here.</p>
          </div>
        ) : (
          <ol className="px-2 pb-3">
            {data.map((login) => (
              <li key={login.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60">
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
                  aria-hidden
                >
                  {login.masked_name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{login.masked_name}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <time
                      dateTime={login.logged_in_at}
                      tabIndex={0}
                      className="shrink-0 rounded-sm text-xs text-muted-foreground tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {formatRelative(login.logged_in_at, now)}
                    </time>
                  </TooltipTrigger>
                  <TooltipContent side="left">{formatExact(login.logged_in_at)}</TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ol>
        )}
      </ScrollArea>
    </section>
  )
}

function LoadingRows() {
  return (
    <div className="flex flex-col gap-1 px-4 py-2" aria-busy="true" aria-label="Loading recent logins">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
  )
}
