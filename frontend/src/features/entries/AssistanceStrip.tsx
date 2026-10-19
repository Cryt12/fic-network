import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ASSISTANCE_TYPES } from '@/features/entries/fields'
import { DEVELOPED } from '@/features/summary/chart-style'

type AssistanceStripProps = {
  selected: readonly string[]
  /** Text typed for "Other", if ticked. */
  other?: string | null
}

/**
 * A compact graph of one FIC's requested assistance: one segment per type, always in the same
 * order, filled when requested. Hover (or focus) lists the requested types by name.
 */
export function AssistanceStrip({ selected, other }: AssistanceStripProps) {
  const picked = ASSISTANCE_TYPES.filter((type) => selected.includes(type.value))
  const names = picked.map((type) => (type.value === 'other' && other ? `Other: ${other}` : type.label))

  if (picked.length === 0) return <span className="text-muted-foreground">None</span>

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex cursor-default items-center gap-2 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0}>
          <span className="flex gap-[2px]" aria-hidden>
            {ASSISTANCE_TYPES.map((type) => (
              <span
                key={type.value}
                className="h-4 w-2 rounded-[2px]"
                style={{ background: selected.includes(type.value) ? DEVELOPED : 'color-mix(in oklch, var(--muted-foreground) 22%, transparent)' }}
              />
            ))}
          </span>
          <span className="text-xs font-medium text-foreground tabular-nums">
            {picked.length}/{ASSISTANCE_TYPES.length}
          </span>
          <span className="sr-only">types requested: {names.join(', ')}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">
        <div className="flex flex-col gap-1">
          <p className="font-medium">
            {picked.length} of {ASSISTANCE_TYPES.length} types requested
          </p>
          <ul className="list-disc pl-4">
            {names.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
