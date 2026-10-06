import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api'
import type { FicEntry, Paginated } from '@/features/entries/api'

/** An entry as the superadmin sees it: every field plus who submitted it. */
export type AdminEntry = FicEntry & { owner: { id: number; name: string; email: string } }

export type EntryTotals = {
  entries: number
  products_developed: number
  products_commercialized: number
  msmes_served: number
  msmes_needing_fabrication: number
  msmes_needing_tech_interventions: number
}

/** Matches backend EntryFilterRequest. Empty strings mean "no filter". */
export type EntryFilters = {
  search: string
  /** User id: only entries this member submitted. */
  user: string
  region: string
  lto_status: string
  assistance_type: string
  from: string
  to: string
}

export const FILTER_KEYS = ['search', 'user', 'region', 'lto_status', 'assistance_type', 'from', 'to'] as const satisfies readonly (keyof EntryFilters)[]

export function filterQuery(filters: EntryFilters, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams(extra)
  for (const key of FILTER_KEYS) if (filters[key]) params.set(key, filters[key])
  return params.toString()
}

export function useAdminEntries(filters: EntryFilters, page: number) {
  return useQuery({
    queryKey: ['admin', 'entries', filters, page],
    queryFn: () => api<Paginated<AdminEntry> & { totals: EntryTotals }>(`/admin/entries?${filterQuery(filters, { page: String(page) })}`),
    placeholderData: keepPreviousData,
  })
}

/** Downloads the Excel report for the current filters (same session cookie as every API call). */
export async function downloadReport(filters: EntryFilters): Promise<void> {
  const response = await fetch(`/api/admin/entries/export?${filterQuery(filters)}`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json' },
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new ApiError(response.status, body?.message ?? "Couldn't generate the report.")
  }

  const filename = /filename="?([^";]+)"?/.exec(response.headers.get('Content-Disposition') ?? '')?.[1] ?? 'fic-entries-report.xlsx'
  const url = URL.createObjectURL(await response.blob())
  const link = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export type AdminUser = {
  id: number
  name: string
  email: string
  role: 'user' | 'superadmin'
  is_superadmin: boolean
  created_at: string
  entries_count: number
  logins_count: number
  failed_logins_count: number
  last_login_at: string | null
  last_failed_login_at: string | null
}

export type UserSort = 'newest' | 'name' | 'last_login' | 'failed_logins'

export type UserFilters = { search: string; role: string; sort: UserSort }

export function useAdminUsers(filters: UserFilters, page: number) {
  return useQuery({
    queryKey: ['admin', 'users', filters, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), sort: filters.sort })
      if (filters.search) params.set('search', filters.search)
      if (filters.role) params.set('role', filters.role)
      return api<Paginated<AdminUser>>(`/admin/users?${params}`)
    },
    placeholderData: keepPreviousData,
  })
}

export function useAdminUser(id: number) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: async () => (await api<{ data: AdminUser }>(`/admin/users/${id}`)).data,
  })
}

/** One row of a user's login history: a successful login or a failed attempt. */
export type LoginEvent = {
  key: string
  result: 'success' | 'wrong_password' | 'locked_out' | 'unknown_email'
  at: string
  ip_address: string | null
  user_agent: string | null
}

/** Laravel's plain paginator shape (not wrapped in a resource). */
type SimplePage<T> = { data: T[]; current_page: number; last_page: number; total: number; from: number | null; to: number | null }

export function useLoginHistory(id: number, page: number) {
  return useQuery({
    queryKey: ['admin', 'users', id, 'logins', page],
    queryFn: () => api<SimplePage<LoginEvent>>(`/admin/users/${id}/login-history?page=${page}`),
    placeholderData: keepPreviousData,
  })
}
