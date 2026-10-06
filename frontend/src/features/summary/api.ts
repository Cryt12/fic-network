import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type RegionSummary = {
  code: string
  name: string
  fics: number
  products_developed: number
  products_commercialized: number
}

export type Summary = {
  national: { fics: number; products_developed: number; products_commercialized: number; regions_with_fics: number }
  /** Every region, in the official order, including those with no FICs. */
  regions: RegionSummary[]
}

export function useSummary() {
  return useQuery({
    queryKey: ['entries', 'summary'], // under "entries" so any entry change refreshes it
    queryFn: async () => (await api<{ data: Summary }>('/summary')).data,
  })
}
