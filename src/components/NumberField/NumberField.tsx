import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { useFormContext } from '../../form/formContext'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Typography } from '../Typography'
// shared field chrome (label/control/helper) AND the `.control .iconButton` styling for the steppers
import fieldStyles from '../TextField/TextField.module.css'

export type NumberFieldSize = 'sm' | 'md' | 'lg'

/** Allowed while typing — digits, an optional leading `-`, and one decimal point. */
const NUMERIC_RE = /^-?\d*\.?\d*$/

/** Parses the display string to a number, treating empty / in-progress input (`""`, `"-"`, `"."`) as null. */
function parseValue(raw: string): number | null {
  if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return null
  const n = Number(raw)
  return Number.isNaN(n) ? null : n
}

function clampValue(n: number, min?: number, max?: number): number {
  if (min != null && n < min) return min
  if (max != null && n > max) return max
  return n
}

/** Kills binary float drift from repeated stepping (e.g. 0.1 + 0.2). */
function roundStep(n: number): number {
  return Math.round(n * 1e6) / 1e6
}

/** Groups the integer part with `separator` for display (e.g. 32345345 → "32.345.345"). */
function groupThousands(value: number, separator: string): string {
  const [intPart, decPart] = String(value).split('.')
  const sign = intPart.startsWith('-') ? '-' : ''
  const digits = sign ? intPart.slice(1) : intPart
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  return decPart != null ? `${sign}${grouped}.${decPart}` : `${sign}${grouped}`
}

/** Counts the "significant" (non-separator) chars — used to keep the caret stable across regrouping. */
function countExcept(s: string, sep: string): number {
  let n = 0
  for (const c of s) if (c !== sep) n++
  return n
}

/** Index just after the `n`-th non-separator char in `str` (where the caret should land after regrouping). */
function positionAfterExcept(str: string, sep: string, n: number): number {
  if (n <= 0) return 0
  let count = 0
  for (let i = 0; i < str.length; i++) {
    if (str[i] !== sep) {
      count += 1
      if (count === n) return i + 1
    }
  }
  return str.length
}

export interface NumberFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max' | 'step' | 'prefix'
> {
  /** Label rendered above the field. */
  label?: ReactNode
  /** Preset size — drives the control height, font size and padding. */
  size?: NumberFieldSize
  /** Marks the field invalid: red border/focus ring + the `helperText` in the error color. */
  error?: boolean
  /** Helper / validation text under the field. Adopts the error color while `error`. */
  helperText?: ReactNode
  /** Adds a red asterisk after the label. */
  required?: boolean
  /** Stretches the field to fill its container width. Defaults to `true`. */
  fullWidth?: boolean
  /** Controlled numeric value (`null` = empty). */
  value?: number | null
  /** Initial value for uncontrolled use (`null` = empty). Defaults to `null`. */
  defaultValue?: number | null
  /** Fires with the parsed numeric value (or `null` when the field is empty). */
  onChange?: (value: number | null) => void
  /** Minimum value — clamps on blur and on the stepper, and disables `−` at the floor. Defaults to `0`; pass a negative `min` to allow negatives. */
  min?: number
  /** Maximum value — clamps on blur and on the stepper, and disables `+` at the ceiling. */
  max?: number
  /** Amount the `+`/`−` buttons add or subtract. Defaults to `1`. */
  step?: number
  /** Hides the `+`/`−` stepper buttons (keyboard entry only). */
  hideStepper?: boolean
  /**
   * Thousands-group separator shown **live** as you type, e.g. `"."` displays `32345345` as
   * `32.345.345` (or `","`). The caret is preserved across regrouping; the `value`/`onChange`/form
   * value stay a plain `number`. Best for integers — with `"."` decimals aren't supported (the dot is
   * the group separator).
   */
  thousandSeparator?: string
}

/**
 * A numeric input with `+`/`−` stepper buttons. Supports `min`/`max` clamping, a `step` amount,
 * controlled (`value` + `onChange`) or uncontrolled (`defaultValue`) use, optional live thousands
 * grouping, and — like `TextField` — binds to a surrounding `<Form>` by `name` (its form value is a
 * real `number`, validated by the Zod schema). `onChange` emits a `number` or `null` (empty). Shares
 * `TextField`'s field chrome, so label, sizing, error and focus styling are identical.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  {
    label,
    size = 'md',
    error,
    helperText,
    required = false,
    fullWidth = true,
    value,
    defaultValue = null,
    onChange,
    min = 0,
    max,
    step = 1,
    hideStepper = false,
    thousandSeparator,
    name,
    onBlur,
    disabled = false,
    id: idProp,
    className,
    style,
    ...props
  },
  ref,
) {
  const reactId = useId()
  const id = idProp ?? reactId
  const helperId = `${id}-helper`

  // Auto-bind to a surrounding <Form> by `name`. The form stores a real number; we use field() for
  // touched/error/helper and read/write the numeric value through values/setValue.
  const form = useFormContext()
  const isFormBound = Boolean(form && name)
  const bound = form && name ? form.field(name) : undefined

  const externalValue: number | null | undefined =
    value !== undefined
      ? value
      : isFormBound
        ? ((form!.values[name!] as number | null | undefined) ?? null)
        : undefined
  const isControlled = externalValue !== undefined
  const [internal, setInternal] = useState<number | null>(defaultValue)
  const numValue: number | null = isControlled ? externalValue! : internal

  // number <-> display string, applying live thousands grouping when `thousandSeparator` is set.
  const toDisplay = (v: number | null): string =>
    v == null ? '' : thousandSeparator != null ? groupThousands(v, thousandSeparator) : String(v)
  const fromDisplay = (raw: string): number | null =>
    parseValue(thousandSeparator != null ? raw.split(thousandSeparator).join('') : raw)

  // The display string mirrors `numValue` but tolerates in-progress input ("-", "1." …).
  const [text, setText] = useState<string>(() => toDisplay(numValue))
  useEffect(() => {
    if (fromDisplay(text) !== numValue) setText(toDisplay(numValue))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numValue]) // re-sync only when the value changes from the outside (stepper, form, reset)

  // Caret restoration after regrouping (the formatted string length changes as separators move).
  const innerRef = useRef<HTMLInputElement>(null)
  const pendingCaret = useRef<number | null>(null)
  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      innerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )
  useLayoutEffect(() => {
    const pos = pendingCaret.current
    if (pos == null) return
    pendingCaret.current = null
    innerRef.current?.setSelectionRange(pos, pos)
  })

  const resolvedError = error ?? bound?.error ?? false
  const resolvedHelperText = helperText ?? bound?.helperText

  const commit = (next: number | null) => {
    if (!isControlled) setInternal(next)
    if (isFormBound) form!.setValue(name!, next)
    onChange?.(next)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const el = event.target
    const raw = el.value

    if (thousandSeparator == null) {
      if (raw !== '' && !NUMERIC_RE.test(raw)) return // reject non-numeric keystrokes
      setText(raw)
      commit(parseValue(raw))
      return
    }

    // Live grouping: strip separators, validate, regroup, and remember where the caret should land.
    const sep = thousandSeparator
    const cleaned = raw.split(sep).join('')
    if (cleaned !== '' && !NUMERIC_RE.test(cleaned)) return
    const caret = el.selectionStart ?? raw.length
    const significantBefore = countExcept(raw.slice(0, caret), sep)
    const next = parseValue(cleaned)
    const formatted = next == null ? cleaned : groupThousands(next, sep)
    setText(formatted)
    commit(next)
    pendingCaret.current = positionAfterExcept(formatted, sep, significantBefore)
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (numValue != null) {
      const clamped = clampValue(numValue, min, max)
      if (clamped !== numValue) commit(clamped)
    }
    bound?.onBlur(event)
    onBlur?.(event)
  }

  const stepBy = (direction: 1 | -1) => {
    const base = numValue ?? min ?? 0
    commit(clampValue(roundStep(base + direction * step), min, max))
  }

  const atMax = max != null && numValue != null && numValue >= max
  const atMin = min != null && numValue != null && numValue <= min

  return (
    <div
      className={clsx(
        fieldStyles.field,
        fieldStyles[size],
        fullWidth && fieldStyles.fullWidth,
        resolvedError && fieldStyles.error,
        disabled && fieldStyles.disabled,
        className,
      )}
      style={style as CSSProperties}
    >
      {label != null && (
        <label htmlFor={id} className={fieldStyles.label}>
          <Typography as="span" variant="bodySmall" color="tertiary">
            {label}
          </Typography>
          {required && (
            <span className={fieldStyles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className={clsx(fieldStyles.control, !hideStepper && fieldStyles.hasRightAdornment)}>
        <input
          ref={setInputRef}
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          className={fieldStyles.input}
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          aria-invalid={resolvedError || undefined}
          aria-describedby={resolvedHelperText != null ? helperId : undefined}
          {...props}
        />
        {!hideStepper && (
          <>
            {/* Filled icon buttons, sized via the shared `.control .iconButton` rule (flush square,
                stretched to the control height, scaled). The minus glyph is nudged for optical centering. */}
            <IconButton
              variant="filled"
              className={fieldStyles.iconButton}
              style={{ marginRight: -2 }}
              disabled={disabled || atMin}
              aria-label="Decrease"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => stepBy(-1)}
            >
              <Icon name="Minus" />
            </IconButton>
            <IconButton
              variant="filled"
              className={fieldStyles.iconButton}
              disabled={disabled || atMax}
              aria-label="Increase"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => stepBy(1)}
            >
              <Icon name="Add" />
            </IconButton>
          </>
        )}
      </div>

      {resolvedHelperText != null && (
        <Typography
          as="span"
          id={helperId}
          variant="bodySmall"
          color={resolvedError ? 'error' : 'tertiary'}
          className={fieldStyles.helper}
        >
          {resolvedHelperText}
        </Typography>
      )}
    </div>
  )
})
