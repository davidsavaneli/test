import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { useFormContext } from '../../form/formContext'
import { useFloatingPanel } from '../../hooks/useFloatingPanel'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Typography } from '../Typography'
import { Calendar } from '../DatePicker/Calendar'
import {
  applyMask,
  localWallToUtc,
  maskFromFormat,
  parseISO,
  parseInput,
  parseValue,
  today,
  toISO,
  utcToLocalWall,
  type Dayjs,
} from '../DatePicker/dateUtils'
import styles from '../DatePicker/DatePicker.module.css'
import dt from './DateTimePicker.module.css'
import { TimeColumns } from './TimeColumns'

export type DateTimePickerSize = 'sm' | 'md' | 'lg'

export interface DateTimePickerProps {
  /** Label rendered above the field. */
  label?: ReactNode
  /** Preset size — control height, font and calendar density. */
  size?: DateTimePickerSize
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
  /** Controlled value — a datetime string in `valueFormat` (default ISO datetime; `''` = empty). */
  value?: string
  /** Initial value for uncontrolled use (in `valueFormat`). */
  defaultValue?: string
  /** Fires with the next datetime in `valueFormat` (`''` when cleared). */
  onChange?: (value: string) => void
  /**
   * Display + typed-input format (dayjs tokens). Defaults to `'DD/MM/YYYY HH:mm:ss'` (or `hh:mm:ss A`
   * when `hour12`; the `:ss` is dropped when `showSeconds` is `false`).
   */
  format?: string
  /**
   * Wire format of `value`/`defaultValue`/`onChange` (dayjs tokens), decoupled from the displayed
   * `format`. Defaults to the ISO datetime `'YYYY-MM-DDTHH:mm:ss[Z]'` when `utc` (the `Z` marks the
   * value as UTC, e.g. `'2026-06-10T09:35:00Z'`), or `'YYYY-MM-DDTHH:mm:ss'` (no `Z`) when `utc={false}`.
   * Incoming values are parsed **leniently** (this format, then any ISO-8601 string — so a backend
   * datetime like `'2026-06-10T09:35:49.6134342'` with or without `Z` is accepted).
   */
  valueFormat?: string
  /**
   * Treat the value as **UTC** and display/edit in the viewer's **local** timezone (default `true`).
   * Set `false` to disable timezone conversion entirely — the field shows and emits the value's exact
   * wall-clock (what you pick is what's sent, no UTC shift).
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
  /** Earliest selectable date (ISO date or datetime; day-level bound on the calendar). */
  min?: string
  /** Latest selectable date (ISO date or datetime; day-level bound on the calendar). */
  max?: string
  /** Disables specific dates — receives each day as an ISO `'YYYY-MM-DD'` string. */
  disabledDate?: (date: string) => boolean
  /** First day of the week: 0 = Sunday … 6 = Saturday. Defaults to `1` (Monday). */
  weekStartsOn?: number
  /** Shows a clear (×) button when a value is set. Defaults to `true`. */
  clearable?: boolean
  /** Form field name — auto-binds to a surrounding `<Form>` (value is the datetime string). */
  name?: string
  /** Id for the input (label association). */
  id?: string
  className?: string
  style?: CSSProperties
}

function defaultFormatFor(hour12: boolean, showSeconds: boolean): string {
  const time = hour12
    ? showSeconds
      ? 'hh:mm:ss A'
      : 'hh:mm A'
    : showSeconds
      ? 'HH:mm:ss'
      : 'HH:mm'
  return `DD/MM/YYYY ${time}`
}

/**
 * A datetime field with a typed, masked input **and** a popover combining the keyboard-navigable
 * `Calendar` (date) with scrollable time columns (hour / minute / optional second + AM/PM in 12-hour
 * mode). All math runs in **UTC** so the instant never drifts with the viewer's timezone; the value is a
 * string in `valueFormat` (UTC ISO datetime with a `Z` by default, or no `Z` when `utc={false}`) — incoming values are parsed
 * leniently (a richer backend datetime is accepted) and the chosen instant is emitted in that format.
 * Picking a date keeps the time and vice-versa, and the popover stays open until you click away,
 * press Escape, or hit Done. Supports `hour12`, `minuteStep`, `showSeconds`, `min`/`max`,
 * `disabledDate`, `weekStartsOn`, and `clearable`. Controlled (`value` + `onChange`) or uncontrolled
 * (`defaultValue`), and binds to a surrounding `<Form>` by `name`. Requires the `dayjs` peer dependency.
 */
export const DateTimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>(
  function DateTimePicker(
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
    const reactId = useId()
    const id = idProp ?? reactId
    const helperId = `${id}-helper`
    const labelId = `${id}-label`
    const format = formatProp ?? defaultFormatFor(hour12, showSeconds)
    // when the value is UTC, the wire string carries a `Z` ("…09:35:00Z"); `utc={false}` emits the
    // bare wall-clock (no zone designator). Override either via `valueFormat`.
    const valueFormat = valueFormatProp ?? (utc ? 'YYYY-MM-DDTHH:mm:ss[Z]' : 'YYYY-MM-DDTHH:mm:ss')

    // ── value (controlled / form-bound / uncontrolled) — a `valueFormat` datetime string ────────────
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
    // when `utc`, parse the UTC value and show it in the viewer's LOCAL time (value stays UTC, emit
    // converts back); when `utc={false}`, show/emit the value's exact wall-clock (no tz conversion)
    const toDisplay = (instant: Dayjs | null) => (utc ? utcToLocalWall(instant) : instant)
    const selected = toDisplay(parseValue(currentValue, valueFormat))

    const resolvedError = error ?? bound?.error ?? false
    const resolvedHelperText = helperText ?? bound?.helperText

    const minDate = toDisplay(parseValue(min, valueFormat))
    const maxDate = toDisplay(parseValue(max, valueFormat))
    const mask = maskFromFormat(format)
    // precision the user can actually type — driven by the display `format`, not just `showSeconds`
    const timeUnit = /s/.test(format) ? 'second' : 'minute'

    const commit = (next: string) => {
      if (next === currentValue) return // skip redundant onChange / setValue with an unchanged value
      if (!isControlled) setInternal(next)
      if (isFormBound) form!.setValue(name!, next)
      onChange?.(next)
    }

    // emit a datetime in the wire `valueFormat` (time preserved), or '' to clear. Re-picking the same
    // instant is a no-op (string equality alone would leak a spurious emit for sub-second source values)
    const commitDateTime = (d: Dayjs | null) => {
      if (d && selected && d.isSame(selected, 'second')) return
      // local-wall → UTC for the wire value (or emit the wall-clock as-is when `utc={false}`)
      commit(d ? (utc ? localWallToUtc(d) : d).format(valueFormat) : '')
    }

    // true when `d` differs from the current value at the input's precision — gates typed-input commits
    // so a no-op round-trip (focus/blur) never rewrites an unchanged value's finer time
    const changed = (d: Dayjs) => !selected || !d.isSame(selected, timeUnit)

    // input display text (kept in sync with the committed value; free while typing an incomplete value)
    const [inputText, setInputText] = useState<string>(() =>
      selected ? selected.format(format) : '',
    )
    useEffect(() => {
      setInputText(selected ? selected.format(format) : '')
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentValue, format, valueFormat])

    // ── popover ──────────────────────────────────────────────────────────────────────────────────
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

    const fieldBlurRef = useRef<(() => void) | undefined>(undefined)
    fieldBlurRef.current = bound
      ? () => bound.onBlur({} as FocusEvent<HTMLInputElement>)
      : undefined

    const closePopover = useCallback((refocus: boolean) => {
      setOpen(false)
      fieldBlurRef.current?.()
      if (refocus) inputRef.current?.focus()
    }, [])

    const {
      popoverRef,
      position: pos,
      visible,
    } = useFloatingPanel({ open, triggerRef, onClose: closePopover })

    useEffect(() => {
      if (open) setViewMonth(selected ?? today())
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const isOutOfRange = (d: Dayjs): boolean => {
      if (minDate && d.isBefore(minDate, 'day')) return true
      if (maxDate && d.isAfter(maxDate, 'day')) return true
      return Boolean(disabledDate && disabledDate(toISO(d)))
    }

    const handleInputChange = (raw: string) => {
      const masked = applyMask(raw, mask)
      setInputText(masked)
      if (masked === '') {
        commit('') // emptying the field clears the value
        return
      }
      const parsed = parseInput(masked, format)
      if (parsed && !isOutOfRange(parsed) && changed(parsed)) commitDateTime(parsed)
    }

    const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
      const parsed = parseInput(inputText, format)
      if (inputText === '') {
        commit('') // an emptied field stays cleared
      } else if (parsed && !isOutOfRange(parsed)) {
        if (changed(parsed)) commitDateTime(parsed)
        setInputText(parsed.format(format))
      } else {
        setInputText(selected ? selected.format(format) : '')
      }
      const nextEl = event.relatedTarget as Node | null
      if (nextEl && (popoverRef.current?.contains(nextEl) || triggerRef.current?.contains(nextEl)))
        return
      bound?.onBlur(event)
    }

    // picking a day keeps the current time; picking a time keeps the current day — the popover stays open
    const handleSelectDate = (iso: string) => {
      const date = parseISO(iso)
      if (!date) return
      const base = selected ?? today()
      commitDateTime(date.hour(base.hour()).minute(base.minute()).second(base.second()))
    }
    const handleTimeChange = (next: Dayjs) => commitDateTime(next)

    // trap Tab within the dialog popover so focus can't strand on the scroll-locked page behind it
    const handlePopoverKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Tab') return
      const panel = popoverRef.current
      if (!panel) return
      const focusables = panel.querySelectorAll<HTMLElement>(
        'button:not([tabindex="-1"]):not(:disabled), [tabindex="0"]',
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
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
              aria-label="Clear value"
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
            aria-label="Open date and time picker"
            aria-haspopup="dialog"
            aria-expanded={open}
            className={styles.calendarButton}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name="Calendar3" size={iconSize} />
          </IconButton>
        </div>

        {open &&
          createPortal(
            <div
              ref={popoverRef}
              className={clsx(styles.popover, dt.popover)}
              role="dialog"
              aria-modal="true"
              aria-label="Choose date and time"
              data-open={visible ? 'true' : 'false'}
              data-side={pos?.side ?? 'bottom'}
              onKeyDown={handlePopoverKeyDown}
              style={
                {
                  position: 'fixed',
                  top: pos?.top ?? 0,
                  left: pos?.left ?? 0,
                  maxHeight: pos?.maxHeight,
                  visibility: pos ? 'visible' : 'hidden',
                } as CSSProperties
              }
            >
              <div className={dt.body}>
                <Calendar
                  value={selected}
                  month={viewMonth}
                  onMonthChange={setViewMonth}
                  onSelect={handleSelectDate}
                  min={minDate}
                  max={maxDate}
                  disabledDate={disabledDate}
                  weekStartsOn={weekStartsOn}
                  autoFocus
                  labelId={labelId}
                />
                <div className={dt.divider} aria-hidden="true" />
                <TimeColumns
                  value={selected}
                  onChange={handleTimeChange}
                  hour12={hour12}
                  minuteStep={minuteStep}
                  showSeconds={showSeconds}
                />
              </div>
              <div className={dt.footer}>
                <Button
                  size="sm"
                  variant="filled"
                  color="primary"
                  onClick={() => closePopover(true)}
                >
                  Done
                </Button>
              </div>
            </div>,
            document.body,
          )}

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
  },
)
