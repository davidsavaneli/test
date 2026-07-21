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
import { Button } from '../Button'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Typography } from '../Typography'
import { TimeColumns } from '../DateTimePicker/TimeColumns'
import {
  applyMask,
  localWallToUtc,
  maskFromFormat,
  parseInput,
  parseTime,
  utcToLocalWall,
  type Dayjs,
} from '../DatePicker/dateUtils'
import styles from '../DatePicker/DatePicker.module.css'
import tp from './TimePicker.module.css'

export type TimePickerSize = 'sm' | 'md' | 'lg'

export interface TimePickerProps {
  /** Label rendered above the field. */
  label?: ReactNode
  /** Preset size — control height, font and popover density. */
  size?: TimePickerSize
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
  /** Controlled value — a time string in `valueFormat` (`''` = empty). */
  value?: string
  /** Initial value for uncontrolled use (in `valueFormat`). */
  defaultValue?: string
  /** Fires with the next time in `valueFormat` (`''` when cleared). */
  onChange?: (value: string) => void
  /**
   * Display + typed-input format (dayjs tokens). Defaults to `'HH:mm:ss'` (or `hh:mm:ss A` when
   * `hour12`; the `:ss` is dropped when `showSeconds` is `false`).
   */
  format?: string
  /**
   * Wire format of `value`/`defaultValue`/`onChange` (dayjs tokens), decoupled from the displayed
   * `format`. Defaults to `'HH:mm:ss[Z]'` when `utc` (the `Z` marks UTC), or `'HH:mm:ss'` when
   * `utc={false}`. Incoming values are parsed **leniently** (this format, then a numeric time — so a
   * backend time like `'09:35:49.6134342'` is accepted, ms-capped — then any ISO-8601 datetime, whose
   * time is used). Only the time-of-day is used; the date is ignored.
   */
  valueFormat?: string
  /**
   * Treat the value as **UTC** and display/edit in the viewer's **local** timezone (default `true`).
   * Set `false` to disable timezone conversion — the field shows and emits the value's exact wall-clock.
   */
  utc?: boolean
  /** 12-hour clock (1–12 + AM/PM) instead of 24-hour (0–23). Defaults to `false`. */
  hour12?: boolean
  /** Minute increment for the minutes column. Defaults to `1`. */
  minuteStep?: number
  /** Show the seconds column + `:ss` in the default format. Defaults to `true`; pass `false` to hide seconds. */
  showSeconds?: boolean
  /** Placeholder shown when empty. Defaults to the lowercased `format`. */
  placeholder?: string
  /** Shows a clear (×) button when a value is set. Defaults to `true`. */
  clearable?: boolean
  /** Form field name — auto-binds to a surrounding `<Form>` (value is the time string). */
  name?: string
  /** Id for the input (label association). */
  id?: string
  className?: string
  style?: CSSProperties
}

function defaultFormatFor(hour12: boolean, showSeconds: boolean): string {
  if (hour12) return showSeconds ? 'hh:mm:ss A' : 'hh:mm A'
  return showSeconds ? 'HH:mm:ss' : 'HH:mm'
}

/** Compares two datetimes by **time of day** only (ignoring the date) at the given precision. */
function sameTime(a: Dayjs, b: Dayjs, unit: 'minute' | 'second'): boolean {
  if (a.hour() !== b.hour() || a.minute() !== b.minute()) return false
  return unit === 'minute' ? true : a.second() === b.second()
}

/**
 * A time-of-day field with a typed, masked input **and** a popover of scrollable time columns
 * (hour / minute / optional second + AM/PM in 12-hour mode) — the time sibling of `DateTimePicker`,
 * with no calendar. The value is a string in `valueFormat` (UTC, with a `Z`, unless `utc={false}`) —
 * incoming values are parsed leniently (a richer backend time is accepted) and the chosen time emitted
 * in that format. Picking keeps the popover open until you click away, press Escape, or hit Done.
 * Supports `hour12`, `minuteStep`, `showSeconds`, and `clearable`. Controlled (`value` + `onChange`) or
 * uncontrolled (`defaultValue`), and binds to a surrounding `<Form>` by `name`. Requires `dayjs`.
 */
export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(function TimePicker(
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
    format: formatProp,
    valueFormat: valueFormatProp,
    utc = true,
    hour12 = false,
    minuteStep = 1,
    showSeconds = true,
    placeholder,
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
  const format = formatProp ?? defaultFormatFor(hour12, showSeconds)
  // UTC time-of-day carries a `Z` ("09:35:00Z"); `utc={false}` emits the bare wall-clock. Override via `valueFormat`.
  const valueFormat = valueFormatProp ?? (utc ? 'HH:mm:ss[Z]' : 'HH:mm:ss')

  // ── value (controlled / form-bound / uncontrolled) — a `valueFormat` time string ────────────────
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
  // when `utc`, parse the UTC time and show it in the viewer's LOCAL time (value stays UTC, emit
  // converts back); when `utc={false}`, show/emit the value's exact wall-clock (no tz conversion)
  const selected = utc
    ? utcToLocalWall(parseTime(currentValue, valueFormat))
    : parseTime(currentValue, valueFormat)

  const resolvedError = error ?? bound?.error ?? false
  const resolvedHelperText = helperText ?? bound?.helperText

  const mask = maskFromFormat(format)
  const timeUnit = /s/.test(format) ? 'second' : 'minute'

  const commit = (next: string) => {
    if (next === currentValue) return // skip redundant onChange / setValue with an unchanged value
    if (!isControlled) setInternal(next)
    if (isFormBound) form!.setValue(name!, next)
    onChange?.(next)
  }

  // emit a time in the wire `valueFormat`, or '' to clear. Re-picking the same time-of-day is a no-op
  const commitTime = (d: Dayjs | null) => {
    if (d && selected && sameTime(d, selected, 'second')) return
    // local-wall → UTC for the wire value (or emit the wall-clock as-is when `utc={false}`)
    commit(d ? (utc ? localWallToUtc(d) : d).format(valueFormat) : '')
  }

  // true when `d` differs from the current value at the input's precision — gates typed-input commits
  const changed = (d: Dayjs) => !selected || !sameTime(d, selected, timeUnit)

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

  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as { current: HTMLInputElement | null }).current = node
    },
    [ref],
  )

  const fieldBlurRef = useRef<(() => void) | undefined>(undefined)
  fieldBlurRef.current = bound ? () => bound.onBlur({} as FocusEvent<HTMLInputElement>) : undefined

  // the floating panel forwards its node here, for the focus-leaves-the-widget check on blur
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const closePopover = useCallback((refocus: boolean) => {
    setOpen(false)
    fieldBlurRef.current?.()
    if (refocus) inputRef.current?.focus()
  }, [])

  const handleInputChange = (raw: string) => {
    const masked = applyMask(raw, mask)
    setInputText(masked)
    if (masked === '') {
      commit('')
      return
    }
    const parsed = parseInput(masked, format)
    if (parsed && changed(parsed)) commitTime(parsed)
  }

  const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    const parsed = parseInput(inputText, format)
    if (inputText === '') {
      commit('')
    } else if (parsed) {
      if (changed(parsed)) commitTime(parsed)
      setInputText(parsed.format(format))
    } else {
      setInputText(selected ? selected.format(format) : '')
    }
    const nextEl = event.relatedTarget as Node | null
    if (nextEl && (popoverRef.current?.contains(nextEl) || triggerRef.current?.contains(nextEl)))
      return
    bound?.onBlur(event)
  }

  const handleTimeChange = (next: Dayjs) => commitTime(next)

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
            aria-label={t('timePicker.clear')}
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
          aria-label={t('timePicker.open')}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={styles.calendarButton}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name="Clock" size={iconSize} />
        </IconButton>
      </div>

      <FloatingPanel
        ref={popoverRef}
        open={open}
        triggerRef={triggerRef}
        onClose={closePopover}
        role="dialog"
        ariaLabel="Choose time"
        trapFocus
        className={styles.popover}
      >
        <TimeColumns
          value={selected}
          onChange={handleTimeChange}
          hour12={hour12}
          minuteStep={minuteStep}
          showSeconds={showSeconds}
          autoFocus
        />
        <div className={tp.footer}>
          <Button size="sm" variant="filled" color="primary" onClick={() => closePopover(true)}>
            {t('common.done')}
          </Button>
        </div>
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
