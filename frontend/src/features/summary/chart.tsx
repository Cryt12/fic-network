import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { number } from '@/features/summary/chart-style'

export function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-[3px]" style={{ background: color }} aria-hidden />
      {label}
    </li>
  )
}

/** One thin bar from the baseline, rounded at the data end, with its value printed after it. */
export function Bar({ value, max, color, tooltip }: { value: number; max: number; color: string; tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* The whole row is the hover target, bigger than the bar itself. */}
        <div className="flex h-5 cursor-default items-center gap-2 rounded-sm" tabIndex={0} aria-label={tooltip}>
          {value > 0 && (
            <span
              className="h-3 rounded-r-[4px] transition-[filter] hover:brightness-110"
              style={{ width: `calc((100% - 3rem) * ${value / max})`, background: color, minWidth: 3 }}
              aria-hidden
            />
          )}
          <span className="text-xs font-medium text-foreground tabular-nums">{number.format(value)}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

