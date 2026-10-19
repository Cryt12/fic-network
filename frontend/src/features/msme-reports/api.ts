import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Paginated } from '@/features/entries/api'
import type { MsmeReportValues } from '@/features/msme-reports/schema'
import { api } from '@/lib/api'

/** A Focal's Food MSME partner report (backend MsmeReportResource). */
export type MsmeReport = MsmeReportValues & {
  id: number
  region: string
  region_name: string
  created_at: string
  updated_at: string
}

/** The whole region's running totals: every Focal's reports in it, added up. */
export type RegionTotals = { region: string; region_name: string; msme_partners: number; msmes_with_lto: number }

const keys = {
  all: ['msme-reports'] as const,
  mine: (page: number) => ['msme-reports', 'mine', page] as const,
  detail: (id: number) => ['msme-reports', 'detail', id] as const,
}

export function useMyMsmeReports(page: number) {
  return useQuery({
    queryKey: keys.mine(page),
    queryFn: () => api<Paginated<MsmeReport> & { region_totals: RegionTotals }>(`/my/msme-reports?page=${page}`),
    placeholderData: keepPreviousData,
  })
}

export function useMsmeReport(id: number | null) {
  return useQuery({
    queryKey: keys.detail(id ?? 0),
    queryFn: async () => (await api<{ data: MsmeReport }>(`/msme-reports/${id}`)).data,
    enabled: id !== null,
  })
}

/** A report changes the Focal's list and the Dashboard totals (the summary query lives under "entries"). */
function useInvalidate() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([queryClient.invalidateQueries({ queryKey: keys.all }), queryClient.invalidateQueries({ queryKey: ['entries', 'summary'] })])
}

export function useCreateMsmeReport() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (values: MsmeReportValues) => (await api<{ data: MsmeReport }>('/msme-reports', { method: 'POST', body: values })).data,
    onSuccess: invalidate,
  })
}

export function useUpdateMsmeReport(id: number) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (values: MsmeReportValues) =>
      (await api<{ data: MsmeReport }>(`/msme-reports/${id}`, { method: 'PUT', body: values })).data,
    onSuccess: invalidate,
  })
}

export function useDeleteMsmeReport() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/msme-reports/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}
