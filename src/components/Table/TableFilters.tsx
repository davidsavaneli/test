import { useId, useState, type ReactNode } from 'react'
import { useT, type Translator } from '../../theme'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { DatePicker } from '../DatePicker'
import { DateTimePicker } from '../DateTimePicker'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Modal } from '../Modal'
import { MultiSelect } from '../MultiSelect'
import { NumberField } from '../NumberField'
import { RadioGroup } from '../Radio'
import { Select } from '../Select'
import { Slider } from '../Slider'
import { TextField } from '../TextField'
import { TimePicker } from '../TimePicker'
import { Typography } from '../Typography'
import {
  activeFilterCount,
  type TableFilter,
  type TableFilterState,
  type TableFilterValue,
} from './tableFilter'
import styles from './TableFilters.module.css'

/** The three boolean-filter radios, mapped to off / `true` / `false` — labels overridable per filter. */
const boolOptions = (labels: TableFilter['booleanLabels'], t: Translator) => [
  { value: '', label: labels?.any ?? t('common.any') },
  { value: 'true', label: labels?.yes ?? t('common.yes') },
  { value: 'false', label: labels?.no ?? t('common.no') },
]
const boolToStr = (v: TableFilterValue | undefined): string =>
  v === true ? 'true' : v === false ? 'false' : ''
const strToBool = (s: string): boolean | null =>
  s === 'true' ? true : s === 'false' ? false : null

/**
 * A range field — a label over two inputs (From/To, Min/Max). Side by side split by a `–` separator, or
 * **`stacked`** (each on its own line, no separator) for wide inputs that don't fit two-up (dateTimeRange).
 */
function RangeField({
  label,
  from,
  to,
  stacked,
}: {
  label: ReactNode
  from: ReactNode
  to: ReactNode
  stacked?: boolean
}) {
  return (
    <div className={styles.field}>
      <Typography variant="bodySmall" className={styles.rangeLabel}>
        {label}
      </Typography>
      {stacked ? (
        <div className={styles.stack}>
          {from}
          {to}
        </div>
      ) : (
        <div className={styles.row}>
          {from}
          <span className={styles.rangeSep} aria-hidden>
            –
          </span>
          {to}
        </div>
      )}
    </div>
  )
}

/** One field in the filter panel — the control matches the filter's `type`. */
function FilterField({
  filter,
  value,
  onChange,
}: {
  filter: TableFilter
  value: TableFilterValue | undefined
  onChange: (value: TableFilterValue) => void
}) {
  const t = useT()
  const { type, label, options = [], placeholder } = filter

  switch (type) {
    case 'text':
      return (
        <TextField
          label={label}
          placeholder={placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'number':
      return (
        <NumberField
          label={label}
          placeholder={placeholder}
          value={(value as number) ?? null}
          onChange={(v) => onChange(v)}
        />
      )
    case 'numberRange': {
      // two open-bounded inputs (Min / Max — either can be left empty)
      const [min, max] = (value as [number | null, number | null] | undefined) ?? [null, null]
      return (
        <RangeField
          label={label}
          from={
            <NumberField
              placeholder={t('common.min')}
              value={min}
              onChange={(v) => onChange([v, max])}
            />
          }
          to={
            <NumberField
              placeholder={t('common.max')}
              value={max}
              onChange={(v) => onChange([min, v])}
            />
          }
        />
      )
    }
    case 'numberRangeSlider': {
      // two-thumb range slider. Bounds come from the filter def (`min`/`max`/`step`); a thumb at an extent
      // maps back to `null` (open bound) so a full-range slider reads as "not filtering" (no count, no-op).
      const lo = filter.min ?? 0
      const hi = filter.max ?? 100
      const [low, high] = (value as [number | null, number | null] | undefined) ?? [null, null]
      return (
        <Slider
          range
          label={label}
          min={lo}
          max={hi}
          step={filter.step ?? 1}
          value={[low ?? lo, high ?? hi]}
          valueLabel={(v) => {
            const [a, b] = v as [number, number]
            return `${a} – ${b}`
          }}
          onChange={(v) => {
            const [a, b] = v as [number, number]
            onChange([a <= lo ? null : a, b >= hi ? null : b])
          }}
        />
      )
    }
    case 'select':
      return (
        <Select
          label={label}
          placeholder={placeholder}
          options={options}
          value={(value as string) ?? ''}
          onChange={(v) => onChange(v)}
        />
      )
    case 'multiSelect':
      return (
        <MultiSelect
          label={label}
          placeholder={placeholder}
          options={options}
          value={(value as string[]) ?? []}
          onChange={(v) => onChange(v)}
        />
      )
    case 'boolean':
      // tri-state as radios (Any / Yes / No, labels overridable via `booleanLabels`) — all visible at once
      return (
        <RadioGroup
          label={label}
          orientation="horizontal"
          options={boolOptions(filter.booleanLabels, t)}
          value={boolToStr(value)}
          onChange={(v) => onChange(strToBool(v))}
        />
      )
    case 'date':
      return (
        <DatePicker
          label={label}
          value={(value as string) ?? ''}
          onChange={(v) => onChange(v ?? '')}
        />
      )
    case 'dateRange': {
      const [from, to] = (value as [string, string] | undefined) ?? ['', '']
      return (
        <RangeField
          label={label}
          from={
            <DatePicker
              placeholder={t('common.from')}
              value={from}
              onChange={(v) => onChange([v ?? '', to])}
            />
          }
          to={
            <DatePicker
              placeholder={t('common.to')}
              value={to}
              onChange={(v) => onChange([from, v ?? ''])}
            />
          }
        />
      )
    }
    case 'time':
      return (
        <TimePicker
          label={label}
          value={(value as string) ?? ''}
          onChange={(v) => onChange(v ?? '')}
        />
      )
    case 'timeRange': {
      const [from, to] = (value as [string, string] | undefined) ?? ['', '']
      return (
        <RangeField
          label={label}
          from={
            <TimePicker
              placeholder={t('common.from')}
              value={from}
              onChange={(v) => onChange([v ?? '', to])}
            />
          }
          to={
            <TimePicker
              placeholder={t('common.to')}
              value={to}
              onChange={(v) => onChange([from, v ?? ''])}
            />
          }
        />
      )
    }
    case 'dateTime':
      return (
        <DateTimePicker
          label={label}
          value={(value as string) ?? ''}
          onChange={(v) => onChange(v ?? '')}
        />
      )
    case 'dateTimeRange': {
      const [from, to] = (value as [string, string] | undefined) ?? ['', '']
      return (
        <RangeField
          label={label}
          stacked
          from={
            <DateTimePicker
              placeholder={t('common.from')}
              value={from}
              onChange={(v) => onChange([v ?? '', to])}
            />
          }
          to={
            <DateTimePicker
              placeholder={t('common.to')}
              value={to}
              onChange={(v) => onChange([from, v ?? ''])}
            />
          }
        />
      )
    }
    default:
      return null
  }
}

export interface TableFiltersProps {
  /** The declarative filter definitions. */
  filters: TableFilter[]
  /** The committed filter values. */
  value: TableFilterState
  /** Commit new filter values (Apply / Clear). */
  onChange: (value: TableFilterState) => void
}

/**
 * The Table's filter control — a toolbar **Filters** button (with a count `Badge`) that opens a right
 * **drawer** (`Modal placement="right"`) of fields (one per `filter` def). Edits a **draft** committed only
 * on **Apply**; **Clear** resets. A `Modal` (not a popover) so nested `Select` / `DatePicker` popovers work
 * inside it.
 */
export function TableFilters({ filters, value, onChange }: TableFiltersProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<TableFilterState>(value)
  const count = activeFilterCount(filters, value)
  const formId = useId() // links the footer Apply (submit) to the body form, so Enter also applies

  const openPanel = () => {
    setDraft(value) // seed the draft from the committed values each time the panel opens
    setOpen(true)
  }
  const commit = () => {
    onChange(draft)
    setOpen(false)
  }

  return (
    <>
      <Badge content={count} color="primary">
        <IconButton variant="filled" size="sm" aria-label={t('table.filters')} onClick={openPanel}>
          <Icon name="Filter" />
        </IconButton>
      </Badge>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        placement="right"
        size="sm"
        icon="Filter"
        title={t('table.filters')}
        description={t('table.filtersDescription')}
        footer={
          // right-aligned: Clear (reset the draft fields) + Apply (commit). No Cancel — the Modal's × /
          // Escape / backdrop dismiss the drawer, discarding the uncommitted draft.
          <div className={styles.footer}>
            <div className={styles.footerEnd}>
              <Button variant="text" startIcon={<Icon name="Trash" />} onClick={() => setDraft({})}>
                {t('common.clear')}
              </Button>
              {/* submits the body form (`formId`) — so clicking Apply OR pressing Enter in a field commits */}
              <Button type="submit" form={formId} startIcon={<Icon name="Filter" />}>
                {t('common.apply')}
              </Button>
            </div>
          </div>
        }
      >
        <form
          id={formId}
          className={styles.fields}
          onSubmit={(e) => {
            e.preventDefault()
            commit()
          }}
        >
          {filters.map((filter) => (
            <FilterField
              key={filter.key}
              filter={filter}
              value={draft[filter.key]}
              onChange={(v) => setDraft((prev) => ({ ...prev, [filter.key]: v }))}
            />
          ))}
        </form>
      </Modal>
    </>
  )
}
