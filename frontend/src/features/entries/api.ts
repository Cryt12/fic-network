import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ENTRY_FIELD_KEYS, type EntryValues, type OptionalTextKey } from '@/features/entries/fields'

/** An entry as the API returns it (backend FicEntryResource). Optional text comes back as null. */
export type FicEntry = Omit<EntryValues, OptionalTextKey> & { [K in OptionalTextKey]: string | null } & {
  id: number
  region_name: string
  is_mine: boolean
  created_at: string
  updated_at: string
}

/** A map pin (backend MapMarkerResource). */
export type MapMarker = Pick<FicEntry, 'id' | 'latitude' | 'longitude' | 'name' | 'host_institution' | 'region_name' | 'lto_status' | 'is_mine'>

export type Region = { code: string; name: string }

export type Paginated<T> = {
  data: T[]
  meta: { current_page: number; last_page: number; total: number; per_page: number; from: number | null; to: number | null }
}

export const entryKeys = {
  all: ['entries'] as const,
  mine: (page: number, search: string) => ['entries', 'mine', { page, search }] as const,
  detail: (id: number) => ['entries', 'detail', id] as const,
  markers: ['entries', 'markers'] as const,
}

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: async () => (await api<{ data: Region[] }>('/regions')).data,
    staleTime: Infinity,
  })
}

export function useMyEntries(page: number, search: string) {
  return useQuery({
    queryKey: entryKeys.mine(page, search),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.set('search', search)
      return api<Paginated<FicEntry>>(`/my/entries?${params}`)
    },
    placeholderData: keepPreviousData,
  })
}

export function useEntry(id: number | null) {
  return useQuery({
    queryKey: entryKeys.detail(id ?? 0),
    queryFn: async () => (await api<{ data: FicEntry }>(`/entries/${id}`)).data,
    enabled: id !== null,
  })
}

export function useMapMarkers() {
  return useQuery({
    queryKey: entryKeys.markers,
    queryFn: async () => (await api<{ data: MapMarker[] }>('/map/markers')).data,
  })
}

/** Any change to an entry can affect My Entries, the map and the detail view. */
function useInvalidateEntries() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: entryKeys.all })
}

export function useCreateEntry() {
  const invalidate = useInvalidateEntries()
  return useMutation({
    mutationFn: async (values: EntryValues) => (await api<{ data: FicEntry }>('/entries', { method: 'POST', body: values })).data,
    onSuccess: invalidate,
  })
}

export function useUpdateEntry(id: number) {
  const invalidate = useInvalidateEntries()
  return useMutation({
    mutationFn: async (values: EntryValues) =>
      (await api<{ data: FicEntry }>(`/entries/${id}`, { method: 'PUT', body: values })).data,
    onSuccess: invalidate,
  })
}

export function useDeleteEntry() {
  const invalidate = useInvalidateEntries()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/entries/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

/** API entry -> form values (nulls become empty strings for the inputs). */
export function toFormValues(entry: FicEntry): EntryValues {
  return Object.fromEntries(ENTRY_FIELD_KEYS.map((key) => [key, entry[key] ?? ''])) as EntryValues
}
