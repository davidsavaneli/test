import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { useT } from '../../theme'
import { useFormContext } from '../../form/formContext'
import { FloatingPanel } from '../FloatingPanel/FloatingPanel'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Typography } from '../Typography'
import { Calendar } from './Calendar'
import {
  applyMask,
  formatValue,
  maskFromFormat,
  parseISO,
  parseInput,
  parseValue,
  today,
  toISO,
  type Dayjs,
} from './dateUtils'
import styles from './DatePicker.module.css'

export type DatePickerSize = 'sm' | 'md' | 'lg'

export interface DatePickerProps {
  /** Label rendered above the field. */
  label?: ReactNode
  /** Preset size — control height, font and calendar density. */
  size?: DatePickerSize
  /** Marks the field invalid: red border/ring + the `helperText` in the error color. */
  error?: boolean
  /** Helper / validation text under the field. Adopts the error color while `error`. */
  helperText?: ReactNode
  /** Adds a red asterisk after the label. */
  required?: boolean
  /** Stretches the field to fill its container width. Defaults to `true`. */
  fullWidth?: boolean
  /** Disables the field. */
  disabled?: boolean
  /** Controlled value — a date string in `valueFormat` (default ISO datetime; `''` = empty). */
  value?: string
  /** Initial value for uncontrolled use (in `valueFormat`). */
  defaultValue?: string
  /** Fires with the next date in `valueFormat` (`''` when cleared). */
  onChange?: (value: string) => void
  /** Display + typed-input format (dayjs tokens; should be numeric for the typed mask). Defaults to `'DD/MM/YYYY'`. */
  format?: string
  /**
   * Wire format of `value`/`defaultValue`/`onChange` (dayjs tokens), decoupled from the displayed
   * `format`. Defaults to the ISO datetime `'YYYY-MM-DDTHH:mm:ss'`. Incoming values are parsed
   * **leniently** (this format, then any ISO-8601 string — so a backend datetime like
   * `'2026-06-10T09:35:49.6134342'` is accepted), while `onChange` emits in exactly this format at the
   * **start of the UTC day** (e.g. `'2026-06-10T00:00:00'`). Pass `'YYYY-MM-DD'` for a plain date.
   */
  valueFormat?: string
  /** Placeholder shown when empty. Defaults to the lowercased `format` (e.g. `"dd/mm/yyyy"`). */
  placeholder?: string
  /** Earliest selectable date (ISO `'YYYY-MM-DD'`). */
  min?: string
  /** Latest selectable date (ISO `'YYYY-MM-DD'`). */
  max?: string
  /** Disables specific dates — receives each day as an ISO `'YYYY-MM-DD'` string. */
  disabledDate?: (date: string) => boolean
  /** First day of the week: 0 = Sunday … 6 = Saturday. Defaults to `1` (Monday). */
  weekStartsOn?: number
  /** Shows a clear (×) button when a date is set. Defaults to `true`. */
  clearable?: boolean
  /** Form field name — auto-binds to a surrounding `<Form>` (value is the ISO date string). */
  name?: string
  /** Id for the input (label association). */
  id?: string
  className?: string
  style?: CSSProperties
}

/**
 * A date field with a typed, masked input **and** a calendar popover. The input accepts typing in
 * `format` (default `DD/MM/YYYY`, masked) and parses strictly; the calendar icon opens a
 * `Dropdown`-style popover (portaled, flips, scroll-locked — shared via `useFloatingPanel`) with a
 * keyboard-navigable month grid + year picker. All calendar math runs in **UTC** so the date never
 * drifts with the viewer's timezone; the value is a string in `valueFormat` (default ISO datetime
 * `'YYYY-MM-DDTHH:mm:ss'`) — incoming values are parsed leniently (a richer backend datetime is
 * accepted) and emitted at the start of the UTC day. Supports `min`/`max`, `disabledDate`,
 * `weekStartsOn`, and
 * `clearable`. Controlled (`value` + `onChange`) or
 * uncontrolled (`defaultValue`), and binds to a surrounding `<Form>` by `name` (validate with e.g.
 * `z.string().min(1, 'Required')`). Token-only styling. Requires the `dayjs` peer dependency.
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  {
    label,
    size = 'md',
    error,
    helperText,
    required = false,
    fullWidth = true,
    disabled = false,
    value,
    defaultValue,
    onChange,
    format = 'DD/MM/YYYY',
    valueFormat = 'YYYY-MM-DDTHH:mm:ss',
    placeholder,
    min,
    max,
    disabledDate,
    weekStartsOn = 1,
    clearable = true,
    name,
    id: idProp,
    className,
    style,
  },
  ref,
) {
  const t = useT()
  const reactId = useId()
  const id = idProp ?? reactId
  const helperId = `${id}-helper`
  const labelId = `${id}-label`

  // ── value (controlled / form-bound / uncontrolled) — ISO 'YYYY-MM-DD' ──────────────────────────
  const form = useFormContext()
  const isFormBound = Boolean(form && name)
  const bound = isFormBound ? form!.field(name!) : undefined
  const externalValue =
    value !== undefined
      ? value
      : isFormBound
        ? ((form!.values[name!] as string | undefined) ?? '')
        : undefined
  const isControlled = value !== undefined || isFormBound
  const [internal, setInternal] = useState<string>(defaultValue ?? '')
  const currentValue = isControlled ? externalValue! : internal
  const selected = parseValue(currentValue, valueFormat)

  const resolvedError = error ?? bound?.error ?? false
  const resolvedHelperText = helperText ?? bound?.helperText

  const minDate = parseISO(min)
  const maxDate = parseISO(max)
  const mask = maskFromFormat(format)

  const commit = (next: string) => {
    if (next === currentValue) return // skip redundant onChange / setValue with an unchanged value
    if (!isControlled) setInternal(next)
    if (isFormBound) form!.setValue(name!, next)
    onChange?.(next)
  }

  // emit a chosen day in the wire `valueFormat` (start of the UTC day), or '' to clear
  const commitDate = (d: Dayjs | null) => commit(d ? formatValue(d, valueFormat) : '')

  // true when `d` is a different calendar day than the current value — gates commits so a no-op
  // round-trip (e.g. focusing then blurring) never rewrites an unchanged value's time to midnight
  const dayChanged = (d: Dayjs) => !selected || !d.isSame(selected, 'day')

  // input display text (kept in sync with the committed value; free while typing an incomplete date)
  const [inputText, setInputText] = useState<string>(() =>
    selected ? selected.format(format) : '',
  )
  useEffect(() => {
    setInputText(selected ? selected.format(format) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue, format, valueFormat])

  // ── popover ────────────────────────────────────────────────────────────────────────────────────
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState<Dayjs>(() => selected ?? today())

  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as { current: HTMLInputElement | null }).current = node
    },
    [ref],
  )

  // keep the form's blur handler live for the stable closePopover (`bound` is recreated each render)
  const fieldBlurRef = useRef<(() => void) | undefined>(undefined)
  fieldBlurRef.current = bound ? () => bound.onBlur({} as FocusEvent<HTMLInputElement>) : undefined

  // the floating panel forwards its node here, for the focus-leaves-the-widget check on blur
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const closePopover = useCallback((refocus: boolean) => {
    setOpen(false)
    fieldBlurRef.current?.()
    if (refocus) inputRef.current?.focus()
  }, [])

  // when opening, sync the calendar to the selected date (or today)
  useEffect(() => {
    if (open) setViewMonth(selected ?? today())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleInputChange = (raw: string) => {
    const masked = applyMask(raw, mask)
    setInputText(masked)
    if (masked === '') {
      commit('') // emptying the field clears the value
      return
    }
    const parsed = parseInput(masked, format)
    // commit only a complete, valid, in-range, enabled date that changes the day
    if (parsed && !isOutOfRange(parsed) && dayChanged(parsed)) commitDate(parsed)
  }

  const isOutOfRange = (d: Dayjs): boolean => {
    if (minDate && d.isBefore(minDate, 'day')) return true
    if (maxDate && d.isAfter(maxDate, 'day')) return true
    return Boolean(disabledDate && disabledDate(toISO(d)))
  }

  const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    // re-format from the committed value (drops half-typed / invalid text); fires the form's touched
    const parsed = parseInput(inputText, format)
    if (inputText === '') {
      commit('') // an emptied field stays cleared (don't restore the old date)
    } else if (parsed && !isOutOfRange(parsed)) {
      if (dayChanged(parsed)) commitDate(parsed)
      setInputText(parsed.format(format))
    } else {
      setInputText(selected ? selected.format(format) : '')
    }
    // only mark touched when focus leaves the whole widget (not into the popover)
    const nextEl = event.relatedTarget as Node | null
    if (nextEl && (popoverRef.current?.contains(nextEl) || triggerRef.current?.contains(nextEl)))
      return
    bound?.onBlur(event)
  }

  const handleSelect = (iso: string) => {
    const picked = parseISO(iso)
    if (picked && dayChanged(picked)) commitDate(picked) // re-picking the same day preserves its value
    closePopover(true)
  }

  const iconSize: 'sm' | 'md' = size === 'sm' ? 'sm' : 'md'

  return (
    <div
      className={clsx(
        styles.field,
        styles[size],
        fullWidth && styles.fullWidth,
        resolvedError && styles.error,
        disabled && styles.disabled,
        className,
      )}
      style={style}
    >
      {label != null && (
        <label htmlFor={id} className={styles.label}>
          <Typography as="span" variant="bodySmall" color="muted">
            {label}
          </Typography>
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div ref={triggerRef} className={clsx(styles.control, open && styles.open)}>
        <input
          ref={setInputRef}
          id={id}
          name={name}
          className={styles.input}
          value={inputText}
          placeholder={placeholder ?? format.toLowerCase()}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="off"
          aria-invalid={resolvedError || undefined}
          aria-describedby={resolvedHelperText != null ? helperId : undefined}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleInputBlur}
        />

        {clearable && currentValue !== '' && !disabled && (
          <button
            type="button"
            className={styles.clear}
            aria-label={t('datePicker.clear')}
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              commit('')
              setInputText('')
              inputRef.current?.focus()
            }}
          >
            <Icon name="CloseCircle" size="sm" />
          </button>
        )}

        <IconButton
          type="button"
          variant="text"
          color="primary"
          size={size}
          disabled={disabled}
          aria-label={t('datePicker.open')}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={styles.calendarButton}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name="Calendar3" size={iconSize} />
        </IconButton>
      </div>

      <FloatingPanel
        ref={popoverRef}
        open={open}
        triggerRef={triggerRef}
        onClose={closePopover}
        role="dialog"
        ariaLabel="Choose date"
        trapFocus
        className={styles.popover}
      >
        <Calendar
          value={selected}
          month={viewMonth}
          onMonthChange={setViewMonth}
          onSelect={handleSelect}
          min={minDate}
          max={maxDate}
          disabledDate={disabledDate}
          weekStartsOn={weekStartsOn}
          autoFocus
          labelId={labelId}
        />
      </FloatingPanel>

      {resolvedHelperText != null && (
        <Typography
          as="span"
          id={helperId}
          variant="bodySmall"
          color={resolvedError ? 'error' : 'muted'}
          className={styles.helper}
        >
          {resolvedHelperText}
        </Typography>
      )}
    </div>
  )
})
