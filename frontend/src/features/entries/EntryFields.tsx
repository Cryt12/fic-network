import { Info, LoaderCircle, RotateCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, get, useWatch, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form'
import { TextField } from '@/components/TextField'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { usePlaceLocation, usePlaces, useRegions } from '@/features/entries/api'
import { ENTRY_FIELDS, SECTIONS, dependentPlaceFields, fieldsInSection, type EntryFieldKey, type FieldSection } from '@/features/entries/fields'
import { GeotagPicker, type MapFocus } from '@/features/map/GeotagPicker'
import { REGION_BOUNDS } from '@/features/map/region-bounds'

type EntryFieldsProps<T extends FieldValues> = {
  form: UseFormReturn<T>
  sections: FieldSection[]
  /** Where the entry lives in the form values: "" for the entry form, "entry." inside signup. */
  prefix?: '' | 'entry.'
}

/** Renders FIC entry inputs straight from fields.ts, section by section. */
export function EntryFields<T extends FieldValues>({ form, sections, prefix = '' }: EntryFieldsProps<T>) {
  return (
    <div className="flex flex-col gap-10">
      {sections.map((section) => (
        <FieldSet key={section}>
          <FieldLegend className="text-base font-semibold tracking-tight">{SECTIONS[section].title}</FieldLegend>
          <FieldDescription className="-mt-2">{SECTIONS[section].description}</FieldDescription>
          <div className="flex flex-col gap-6">
            {fieldsInSection(section).map((key) => (
              <EntryInput key={key} form={form} fieldKey={key} prefix={prefix} />
            ))}
          </div>
        </FieldSet>
      ))}
    </div>
  )
}

type EntryInputProps<T extends FieldValues> = {
  form: UseFormReturn<T>
  fieldKey: EntryFieldKey
  prefix: string
}

function EntryInput<T extends FieldValues>({ form, fieldKey, prefix }: EntryInputProps<T>) {
  const config = ENTRY_FIELDS[fieldKey]
  const name = `${prefix}${fieldKey}` as Path<T>
  const id = name.replace('.', '-')
  const error = get(form.formState.errors, name)
  const description = 'description' in config ? config.description : undefined

  switch (config.input.kind) {
    case 'geotag-pair':
    case 'checkboxes-other':
      return null // rendered by their partner field

    case 'text':
      return (
        <TextField id={id} label={config.label} maxLength={config.input.maxLength} description={description} error={error} {...form.register(name)} />
      )

    case 'count':
      return (
        <TextField
          id={id}
          label={config.label}
          description={description}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          className="max-w-40 tabular-nums"
          error={error}
          {...form.register(name, { valueAsNumber: true })}
        />
      )

    case 'textarea':
      return (
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor={id}>{config.label}</FieldLabel>
          <Textarea id={id} rows={3} maxLength={config.input.maxLength} aria-invalid={error ? true : undefined} {...form.register(name)} />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={error ? [error] : undefined} />
        </Field>
      )

    case 'region':
      return <RegionSelect form={form} name={name} id={id} label={config.label} error={error} prefix={prefix} />

    case 'place':
      return (
        <PlaceSelect
          form={form}
          prefix={prefix}
          fieldKey={fieldKey}
          id={id}
          label={config.label}
          parent={config.input.parent}
          error={error}
        />
      )

    case 'geotag':
      return <GeotagField form={form} prefix={prefix} />

    case 'radio': {
      const { options } = config.input
      return (
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <FieldSet data-invalid={error ? true : undefined}>
              <FieldLegend variant="label">{config.label}</FieldLegend>
              <RadioGroup value={field.value ?? ''} onValueChange={field.onChange} aria-invalid={error ? true : undefined} className="gap-2.5">
                {options.map((option) => (
                  <Field key={option.value} orientation="horizontal">
                    <RadioGroupItem value={option.value} id={`${id}-${option.value}`} />
                    <FieldLabel htmlFor={`${id}-${option.value}`} className="font-normal">
                      {option.label}
                    </FieldLabel>
                  </Field>
                ))}
              </RadioGroup>
              <FieldError errors={error ? [error] : undefined} />
            </FieldSet>
          )}
        />
      )
    }

    case 'checkboxes': {
      const { options, otherField } = config.input
      const otherName = `${prefix}${otherField}` as Path<T>
      const otherError = get(form.formState.errors, otherName)
      return (
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => {
            const selected: string[] = field.value ?? []
            const toggle = (value: string, on: boolean) => {
              field.onChange(on ? [...selected, value] : selected.filter((v) => v !== value))
              // Ticking "Other" moves focus to its text box (but never on page load).
              if (value === 'other' && on) requestAnimationFrame(() => document.getElementById(`${id}-other-text`)?.focus())
            }
            return (
              <FieldSet data-invalid={error ? true : undefined}>
                <FieldLegend variant="label">{config.label}</FieldLegend>
                {description && <FieldDescription className="-mt-1.5">{description}</FieldDescription>}
                <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {options.map((option) => (
                    <Field key={option.value} orientation="horizontal">
                      <Checkbox
                        id={`${id}-${option.value}`}
                        checked={selected.includes(option.value)}
                        onCheckedChange={(checked) => toggle(option.value, checked === true)}
                      />
                      <FieldLabel htmlFor={`${id}-${option.value}`} className="font-normal">
                        {option.label}
                      </FieldLabel>
                    </Field>
                  ))}
                </div>
                {selected.includes('other') && (
                  <Field data-invalid={otherError ? true : undefined} className="sm:max-w-md">
                    <FieldLabel htmlFor={`${id}-other-text`}>{ENTRY_FIELDS[otherField as EntryFieldKey].label}</FieldLabel>
                    <Input id={`${id}-other-text`} aria-invalid={otherError ? true : undefined} {...form.register(otherName)} />
                    <FieldError errors={otherError ? [otherError] : undefined} />
                  </Field>
                )}
                <FieldError errors={error ? [error] : undefined} />
              </FieldSet>
            )
          }}
        />
      )
    }
  }
}

/** Picking a region/province/... clears the choices below it, which no longer fit. */
function clearDependents<T extends FieldValues>(form: UseFormReturn<T>, prefix: string, key: string) {
  for (const dependent of dependentPlaceFields(key)) {
    form.setValue(`${prefix}${dependent}` as Path<T>, '' as never, { shouldDirty: true })
  }
}

/**
 * Latitude + longitude via the map picker. The map follows the address fields (region,
 * then province, city, barangay), and choosing a barangay drops the pin there.
 */
function GeotagField<T extends FieldValues>({ form, prefix }: { form: UseFormReturn<T>; prefix: string }) {
  const path = (key: string) => `${prefix}${key}` as Path<T>
  const [region, province, city, barangay, latitude, longitude] = useWatch({
    control: form.control,
    name: [path('region'), path('province_code'), path('city_code'), path('barangay_code'), path('latitude'), path('longitude')],
  }) as [string?, string?, string?, string?, number?, number?]

  const deepest = barangay || city || province || ''
  const location = usePlaceLocation(deepest)
  const [note, setNote] = useState<string | null>(null)

  const setPoint = (lat: number | undefined, lng: number | undefined) => {
    // Only revalidate after a submit attempt, like every other field.
    const options = { shouldValidate: form.formState.isSubmitted, shouldDirty: true }
    form.setValue(path('latitude'), lat as never, options)
    form.setValue(path('longitude'), lng as never, options)
  }

  const focus = useMemo<MapFocus | null>(() => {
    if (deepest && location.data) {
      const { latitude: lat, longitude: lng, bounds } = location.data
      return { key: deepest, bounds: bounds ?? undefined, point: barangay && !location.data.approximate ? [lat, lng] : undefined }
    }
    // Nothing deeper found (yet, or at all): frame the region.
    if (region && (!deepest || location.isError || location.data === null)) {
      return { key: `region:${region}:${deepest}`, bounds: REGION_BOUNDS[region] }
    }
    return null
  }, [deepest, barangay, region, location.data, location.isError])

  // Choosing a barangay fills in the coordinates (not on page load, where the saved pin wins).
  const filledFor = useRef(barangay && latitude !== undefined ? barangay : '')
  useEffect(() => {
    if (!barangay) {
      filledFor.current = ''
      setNote(null)
      return
    }
    if (filledFor.current === barangay || deepest !== barangay || location.isPending) return
    filledFor.current = barangay

    if (location.data) {
      setPoint(location.data.latitude, location.data.longitude)
      setNote(
        location.data.approximate
          ? "This barangay isn't on OpenStreetMap yet, so the pin is at the center of its city or municipality. Drag it to the exact spot."
          : 'Pin placed at the barangay. Drag it to the exact spot if needed.',
      )
    } else {
      setNote("Couldn't find this barangay on the map. Click the map to place the pin.")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to the lookup result only
  }, [barangay, deepest, location.data, location.isPending])

  return (
    <FieldSet>
      <FieldLegend variant="label">Geotag (latitude and longitude)</FieldLegend>
      <GeotagPicker
        latitude={latitude}
        longitude={longitude}
        focus={focus}
        errors={{ latitude: get(form.formState.errors, path('latitude')), longitude: get(form.formState.errors, path('longitude')) }}
        onChange={(lat, lng) => {
          setNote(null)
          setPoint(lat, lng)
        }}
      />
      {deepest && location.isFetching && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          Finding it on the map...
        </p>
      )}
      {note && !location.isFetching && (
        <p className="flex items-start gap-2 text-sm text-muted-foreground" role="status">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {note}
        </p>
      )}
    </FieldSet>
  )
}

type PlaceSelectProps<T extends FieldValues> = {
  form: UseFormReturn<T>
  prefix: string
  fieldKey: EntryFieldKey
  id: string
  label: string
  parent: string
  error?: { message?: string }
}

/** Province, city/municipality or barangay: options come from the field above it. */
function PlaceSelect<T extends FieldValues>({ form, prefix, fieldKey, id, label, parent, error }: PlaceSelectProps<T>) {
  const name = `${prefix}${fieldKey}` as Path<T>
  const parentValue = (useWatch({ control: form.control, name: `${prefix}${parent}` as Path<T> }) as string | undefined) ?? ''
  const places = usePlaces(parent === 'region' ? { region: parentValue } : { parent: parentValue }, parentValue !== '')
  const parentLabel = ENTRY_FIELDS[parent as EntryFieldKey].label.toLowerCase()

  const placeholder = !parentValue
    ? `Select a ${parentLabel} first`
    : places.isPending
      ? 'Loading...'
      : `Select a ${label.split(' /')[0].toLowerCase()}`

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Select
            value={field.value || ''}
            onValueChange={(value) => {
              field.onChange(value)
              clearDependents(form, prefix, fieldKey)
            }}
            disabled={!parentValue || !places.data}
          >
            <SelectTrigger id={id} aria-invalid={error ? true : undefined} className="w-full sm:max-w-md" onBlur={field.onBlur}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {places.data?.map((place) => (
                <SelectItem key={place.code} value={place.code}>
                  {place.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {places.isError && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              Couldn't load the list.
              <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => places.refetch()}>
                <RotateCw data-icon="inline-start" />
                Try again
              </Button>
            </p>
          )}
          <FieldError errors={error ? [error] : undefined} />
        </Field>
      )}
    />
  )
}

type RegionSelectProps<T extends FieldValues> = {
  form: UseFormReturn<T>
  prefix: string
  name: Path<T>
  id: string
  label: string
  error?: { message?: string }
}

function RegionSelect<T extends FieldValues>({ form, name, id, label, error, prefix }: RegionSelectProps<T>) {
  const regions = useRegions()

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Select
            value={field.value || undefined}
            onValueChange={(value) => {
              field.onChange(value)
              clearDependents(form, prefix, 'region')
            }}
            disabled={!regions.data}
          >
            <SelectTrigger id={id} aria-invalid={error ? true : undefined} className="w-full sm:max-w-md" onBlur={field.onBlur}>
              <SelectValue placeholder={regions.isPending ? 'Loading regions...' : 'Select a region'} />
            </SelectTrigger>
            <SelectContent>
              {regions.data?.map((region) => (
                <SelectItem key={region.code} value={region.code}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {regions.isError && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              Couldn't load the regions.
              <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => regions.refetch()}>
                <RotateCw data-icon="inline-start" />
                Try again
              </Button>
            </p>
          )}
          <FieldError errors={error ? [error] : undefined} />
        </Field>
      )}
    />
  )
}
