import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type RegionSummary = {
  code: string
  name: string
  fics: number
  products_developed: number
  products_commercialized: number
  /** FICs in this region whose MSMEs requested each assistance type, keyed by type (every type present). */
  assistance: Record<string, number>
  /** Equipment items listed by the region's FICs, per status (every status present). */
  equipment: { operation: Record<string, number>; utilization: Record<string, number> }
  /** Food MSME partners reported by the region's DOST FIC Focal accounts (all reports added up). */
  msme_partners: number
  msmes_with_lto: number
}

/** How many FICs report MSMEs requesting one type of assistance. */
export type AssistanceSummary = {
  type: string
  label: string
  fics: number
}

export type Summary = {
  national: { fics: number; products_developed: number; products_commercialized: number; regions_with_fics: number; equipment: number; msme_partners: number; msmes_with_lto: number }
  /** Every region, in the official order, including those with no FICs. */
  regions: RegionSummary[]
  /** Every assistance type, in form order, including those nobody requested. */
  assistance: AssistanceSummary[]
  /** Every equipment type listed nationwide, most units first (names grouped ignoring case and spacing). */
  equipment_types: EquipmentTypeSummary[]
}

export type EquipmentTypeSummary = {
  name: string
  total: number
  operation: Record<string, number>
  utilization: Record<string, number>
}

export function useSummary() {
  return useQuery({
    queryKey: ['entries', 'summary'], // under "entries" so any entry change refreshes it
    queryFn: async () => (await api<{ data: Summary }>('/summary')).data,
  })
}
