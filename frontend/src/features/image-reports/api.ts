import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Paginated } from '@/features/entries/api'
import { api } from '@/lib/api'

export type ImageReportOptions = {
  model: string
  aspect_ratio: '16:9' | '4:3' | '1:1' | '3:4' | '9:16'
  resolution: '1K' | '2K' | '4K'
  detail: 'highlights' | 'full'
  instructions: string
}

type Ranked = { region: string; value: number }

/** The exact numbers the prompt gave the model (backend ImageReportPrompt::figures). */
export type ReportFigures = {
  fics: number
  regions_with_fics: number
  regions_total: number
  products_developed: number
  products_commercialized: number
  commercialization_rate: string | null
  regions_without_fics: string[]
  top_fics: Ranked[]
  top_developed: Ranked[]
  top_commercialized: Ranked[]
  top_assistance: { type: string; fics: number }[]
  equipment: { units: number; types: number; operational: number; top_types: { name: string; units: number }[] }
  msme_partners: number
  msmes_with_lto: number
  /** Missing on reports made before personnel was tracked. */
  personnel?: { fulltime: number; associate: number; reported_by: number }
  regions: { region: string; fics: number; developed: number; commercialized: number }[]
}

export type ImageReport = {
  id: number
  status: 'pending' | 'succeeded' | 'failed'
  model: string
  model_label: string
  options: Omit<ImageReportOptions, 'model'>
  figures: ReportFigures
  /** The design technique and accuracy rules (Sequential Flow / Scrollytelling). */
  system_prompt: string | null
  prompt: string
  error: string | null
  cost_usd: number | null
  image_url: string | null
  created_by: string | null
  created_at: string
  completed_at: string | null
}

type ReportsPage = Paginated<ImageReport> & {
  meta: Paginated<ImageReport>['meta'] & {
    configured: boolean
    models: { id: string; label: string }[]
    daily_limit: number
    used_today: number
  }
}

const keys = { all: ['image-reports'] as const, page: (page: number) => ['image-reports', page] as const }

/** Polls every 3 seconds while a report is being generated. */
export function useImageReports(page: number) {
  return useQuery({
    queryKey: keys.page(page),
    queryFn: () => api<ReportsPage>(`/admin/image-reports?page=${page}`),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => (query.state.data?.data.some((r) => r.status === 'pending') ? 3000 : false),
  })
}

export function useCreateImageReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (options: ImageReportOptions) =>
      (await api<{ data: ImageReport }>('/admin/image-reports', { method: 'POST', body: options })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  })
}

export function useDeleteImageReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/admin/image-reports/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  })
}
