import { CircleAlert, Download, ExternalLink, ImageOff, LoaderCircle, Sparkles, Trash2, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/ErrorState'
import { Page } from '@/components/Page'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useCreateImageReport, useDeleteImageReport, useImageReports, type ImageReport, type ImageReportOptions } from '@/features/image-reports/api'
import { number } from '@/features/summary/chart-style'
import { errorMessage } from '@/lib/api'
import { formatExact, formatRelative } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useDocumentTitle } from '@/lib/use-document-title'

// Scrollytelling reads top to bottom, so tall shapes come first; wide ones flow left to right.
const SHAPES: { value: ImageReportOptions['aspect_ratio']; label: string }[] = [
  { value: '9:16', label: 'Tall 9:16: scrollytelling (recommended)' },
  { value: '3:4', label: 'Portrait 3:4: print, poster' },
  { value: '1:1', label: 'Square 1:1: social media' },
  { value: '16:9', label: 'Landscape 16:9: slides, web' },
  { value: '4:3', label: 'Landscape 4:3' },
]

const RESOLUTIONS: { value: ImageReportOptions['resolution']; label: string }[] = [
  { value: '1K', label: '1K: quick draft, cheapest' },
  { value: '2K', label: '2K: recommended' },
  { value: '4K', label: '4K: print quality, costs more' },
]

const DETAILS: { value: ImageReportOptions['detail']; label: string; hint: string }[] = [
  { value: 'highlights', label: 'Highlights', hint: 'Headline numbers and top regions. Fewer numbers, fewer mistakes.' },
  { value: 'full', label: 'Highlights + regional table', hint: 'Adds a table of every region with FICs. Check it carefully: AI often misdraws tables.' },
]

export function ImageReportPage() {
  useDocumentTitle('Generate Image Report')
  const { data, isPending, isError, error, refetch } = useImageReports(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const reports = data?.data ?? []
  const selected = reports.find((r) => r.id === selectedId) ?? reports[0] ?? null

  return (
    <Page title="Generate Image Report" className="max-w-[1400px]">
      <p className="-mt-6 mb-8 max-w-[75ch] text-sm text-muted-foreground">
        Turns the Dashboard numbers into a publication infographic, drawn by an AI image model through OpenRouter as a Sequential Flow / Scrollytelling story:
        numbered chapters the reader follows one after another. Only nationwide and regional totals are sent, never names or emails.
      </p>

      {isPending ? (
        <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]" aria-busy="true" aria-label="Loading">
          <Skeleton className="h-[30rem]" />
          <Skeleton className="aspect-video" />
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} className="py-16" />
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="flex flex-col gap-4 lg:sticky lg:top-4">
            {!data.meta.configured && (
              <Alert>
                <CircleAlert />
                <AlertTitle>OpenRouter isn't set up yet</AlertTitle>
                <AlertDescription>
                  Add your key as <code className="font-mono text-xs">OPENROUTER_API_KEY=...</code> in <code className="font-mono text-xs">backend/.env</code>, then restart
                  the backend and the fic-queue service.
                </AlertDescription>
              </Alert>
            )}
            <GenerateForm
              models={data.meta.models}
              disabled={!data.meta.configured || reports.some((r) => r.status === 'pending') || data.meta.used_today >= data.meta.daily_limit}
              usage={`${data.meta.used_today} of ${data.meta.daily_limit} used today`}
              onCreated={(report) => setSelectedId(report.id)}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            {selected ? <ReportView key={selected.id} report={selected} /> : <NoReports />}
            {reports.length > 1 && <History reports={reports} selectedId={selected?.id ?? null} onSelect={setSelectedId} />}
          </div>
        </div>
      )}
    </Page>
  )
}

function GenerateForm({
  models,
  disabled,
  usage,
  onCreated,
}: {
  models: { id: string; label: string }[]
  disabled: boolean
  usage: string
  onCreated: (report: ImageReport) => void
}) {
  const create = useCreateImageReport()
  const [options, setOptions] = useState<ImageReportOptions>({
    model: models[0]?.id ?? '',
    aspect_ratio: '9:16',
    resolution: '2K',
    detail: 'highlights',
    instructions: '',
  })
  const set = <K extends keyof ImageReportOptions>(key: K, value: ImageReportOptions[K]) => setOptions((o) => ({ ...o, [key]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      onCreated(await create.mutateAsync(options))
      toast.success('Generating your image report. This usually takes 30 to 90 seconds.')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 rounded-lg border bg-card p-5">
      <OptionSelect id="model" label="AI model" value={options.model} options={models.map((m) => ({ value: m.id, label: m.label }))} onChange={(v) => set('model', v)} />
      <OptionSelect id="shape" label="Shape" value={options.aspect_ratio} options={SHAPES} onChange={(v) => set('aspect_ratio', v)} />
      <OptionSelect id="resolution" label="Resolution" value={options.resolution} options={RESOLUTIONS} onChange={(v) => set('resolution', v)} />

      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Content</legend>
        {DETAILS.map((d) => (
          <label
            key={d.value}
            className={cn(
              'flex cursor-pointer gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
              options.detail === d.value ? 'border-primary bg-accent/50' : 'hover:bg-muted/60',
            )}
          >
            <input type="radio" name="detail" value={d.value} checked={options.detail === d.value} onChange={() => set('detail', d.value)} className="mt-0.5 accent-primary" />
            <span>
              <span className="block font-medium">{d.label}</span>
              <span className="block text-muted-foreground">{d.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="grid gap-1.5">
        <Label htmlFor="instructions">Extra instructions (optional)</Label>
        <Textarea
          id="instructions"
          rows={3}
          maxLength={1000}
          value={options.instructions}
          onChange={(e) => set('instructions', e.target.value)}
          placeholder="e.g. Make it brighter, emphasize Mindanao, use a portrait poster layout"
        />
      </div>

      <div className="flex flex-col gap-2 border-t pt-4">
        <Button type="submit" size="lg" disabled={disabled || create.isPending || !options.model}>
          {create.isPending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Sparkles data-icon="inline-start" />}
          Generate image report
        </Button>
        <p className="text-center text-xs text-muted-foreground">{usage}. Each image is charged to your OpenRouter account.</p>
      </div>
    </form>
  )
}

function OptionSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={id} className="w-full min-w-0 *:data-[slot=select-value]:block *:data-[slot=select-value]:truncate">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function useElapsedSeconds(since: string, running: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [running])
  return Math.max(0, Math.round((now - new Date(since).getTime()) / 1000))
}

function ReportView({ report }: { report: ImageReport }) {
  const elapsed = useElapsedSeconds(report.created_at, report.status === 'pending')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const remove = useDeleteImageReport()
  const meta = `${report.options.aspect_ratio} · ${report.options.resolution} · ${report.model_label.split(':')[0]} · ${formatExact(report.created_at)}`

  const onDelete = async () => {
    try {
      await remove.mutateAsync(report.id)
      toast.success('Image report deleted.')
      setConfirmDelete(false)
    } catch (error) {
      toast.error(`Couldn't delete it. ${errorMessage(error)}`)
    }
  }

  return (
    <section aria-label="Selected image report" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            {report.status === 'pending' ? 'Generating...' : report.status === 'failed' ? "Couldn't generate this report" : 'Image report'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {meta}
            {report.cost_usd !== null && ` · cost $${report.cost_usd.toFixed(3)}`}
          </p>
        </div>
        {report.status !== 'pending' && (
          <div className="flex flex-wrap gap-2">
            {report.image_url && (
              <>
                <Button asChild variant="outline" size="sm">
                  <a href={report.image_url} target="_blank" rel="noreferrer">
                    <ExternalLink data-icon="inline-start" />
                    Full size
                  </a>
                </Button>
                <Button asChild size="sm">
                  <a href={`${report.image_url}?download=1`}>
                    <Download data-icon="inline-start" />
                    Download
                  </a>
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 data-icon="inline-start" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {report.status === 'pending' ? (
        <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/40 text-center" role="status">
          <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden />
          <p className="font-medium">Drawing your infographic</p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {elapsed}s so far. It usually takes 30 to 90 seconds; you can leave this page and come back.
          </p>
        </div>
      ) : report.status === 'failed' ? (
        <Alert variant="destructive">
          <ImageOff />
          <AlertTitle>No image</AlertTitle>
          <AlertDescription>{report.error}</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Tall (scrollytelling) images are capped at the screen height; Full size shows every pixel. */}
          <a href={report.image_url ?? undefined} target="_blank" rel="noreferrer" className="flex justify-center overflow-hidden rounded-lg border bg-muted">
            <img src={report.image_url ?? undefined} alt="Generated OneFIC infographic" className="h-auto max-h-[80vh] w-auto max-w-full" />
          </a>
          <Alert className="border-amber-300 bg-amber-50 text-amber-900 *:data-[slot=alert-description]:text-amber-900">
            <TriangleAlert />
            <AlertTitle>Check every number before publishing</AlertTitle>
            <AlertDescription>
              AI image models can misspell names or change numbers. Compare the image with the exact figures below. If something is off, generate again (each try
              costs money).
            </AlertDescription>
          </Alert>
        </>
      )}

      {report.status !== 'pending' && <Figures report={report} />}

      <AlertDialog open={confirmDelete} onOpenChange={(open) => !remove.isPending && setConfirmDelete(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this image report?</AlertDialogTitle>
            <AlertDialogDescription>The image is removed from the server. Download it first if you still need it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={(event) => {
                event.preventDefault()
                void onDelete()
              }}
            >
              {remove.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

/** The exact numbers the model was given, to check the image against. */
function Figures({ report }: { report: ImageReport }) {
  const f = report.figures
  const ranked = (rows: { region: string; value: number }[]) => rows.map((r) => `${r.region}: ${number.format(r.value)}`).join('; ')
  const items: [string, string][] = [
    ['FICs nationwide', `${number.format(f.fics)}, in ${f.regions_with_fics} of ${f.regions_total} regions`],
    ['Products developed', number.format(f.products_developed)],
    ['Products commercialized', `${number.format(f.products_commercialized)}${f.commercialization_rate ? ` (${f.commercialization_rate})` : ''}`],
    ['Most FICs', ranked(f.top_fics)],
    ['Most products developed', ranked(f.top_developed)],
    ['Most commercialized', ranked(f.top_commercialized)],
    ['Most requested assistance', f.top_assistance.map((a) => `${a.type}: ${a.fics}`).join('; ')],
    ...(f.equipment.units > 0
      ? ([
          [
            'FIC equipment',
            `${number.format(f.equipment.units)} units of ${f.equipment.types} types, ${number.format(f.equipment.operational)} operational`,
          ],
        ] as [string, string][])
      : []),
    ...(f.personnel && f.personnel.reported_by > 0
      ? ([
          [
            'FIC personnel',
            `${number.format(f.personnel.fulltime)} full-time, ${number.format(f.personnel.associate)} associate (from ${f.personnel.reported_by} of ${f.fics} FICs)`,
          ],
        ] as [string, string][])
      : []),
    ...(f.msme_partners > 0
      ? ([['Food MSME partners', `${number.format(f.msme_partners)}, ${number.format(f.msmes_with_lto)} with LTO`]] as [string, string][])
      : []),
  ]

  return (
    <details className="group rounded-lg border bg-card" open={report.status === 'succeeded'}>
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold marker:hidden">
        Exact figures given to the model <span className="font-normal text-muted-foreground">(as of {formatExact(report.created_at)})</span>
      </summary>
      <div className="border-t px-4 py-3">
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_minmax(0,1fr)]">
          {items.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium tabular-nums">{value || 'None'}</dd>
            </div>
          ))}
        </dl>
        {f.regions.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-md border">
            <table className="w-full text-sm tabular-nums">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Region</th>
                  <th className="px-3 py-2 text-right font-medium">FICs</th>
                  <th className="px-3 py-2 text-right font-medium">Developed</th>
                  <th className="px-3 py-2 text-right font-medium">Commercialized</th>
                </tr>
              </thead>
              <tbody>
                {f.regions.map((r) => (
                  <tr key={r.region} className="border-t">
                    <td className="px-3 py-1.5">{r.region}</td>
                    <td className="px-3 py-1.5 text-right">{r.fics}</td>
                    <td className="px-3 py-1.5 text-right">{number.format(r.developed)}</td>
                    <td className="px-3 py-1.5 text-right">{number.format(r.commercialized)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {report.system_prompt && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Show the system prompt (design technique and rules)</summary>
            <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">{report.system_prompt}</pre>
          </details>
        )}
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Show the request (data and story chapters)</summary>
          <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">{report.prompt}</pre>
        </details>
      </div>
    </details>
  )
}

function History({ reports, selectedId, onSelect }: { reports: ImageReport[]; selectedId: number | null; onSelect: (id: number) => void }) {
  return (
    <section aria-labelledby="history-heading">
      <h2 id="history-heading" className="mb-3 text-base font-semibold tracking-tight">
        Earlier reports
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {reports.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onSelect(r.id)}
              aria-pressed={r.id === selectedId}
              className={cn(
                'block w-full overflow-hidden rounded-lg border bg-card text-left outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/50',
                r.id === selectedId && 'ring-2 ring-primary',
              )}
            >
              <span className="flex aspect-video items-center justify-center bg-muted">
                {r.image_url ? (
                  <img src={r.image_url} alt="" loading="lazy" className="size-full object-contain" />
                ) : r.status === 'pending' ? (
                  <LoaderCircle className="size-5 animate-spin text-muted-foreground" aria-hidden />
                ) : (
                  <ImageOff className="size-5 text-muted-foreground" aria-hidden />
                )}
              </span>
              <span className="block px-2.5 py-2 text-xs">
                <span className="block font-medium">{r.status === 'failed' ? 'Failed' : r.status === 'pending' ? 'Generating' : `${r.options.aspect_ratio} · ${r.options.resolution}`}</span>
                <span className="block text-muted-foreground">{formatRelative(r.created_at)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function NoReports() {
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-6 text-center">
      <Sparkles className="size-7 text-primary" aria-hidden />
      <p className="font-medium">No image reports yet</p>
      <p className="max-w-sm text-sm text-muted-foreground">Pick your options and click Generate image report. The finished infographic shows up here.</p>
    </div>
  )
}
