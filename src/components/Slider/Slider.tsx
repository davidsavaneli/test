import {
  forwardRef,
  useId,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { useFormContext } from '../../form/formContext'
import { Typography } from '../Typography'
import type { ThemeColor } from '../../theme'
// shared field chrome (wrapper / label / helper / required / error / sizes)
import fieldStyles from '../TextField/TextField.module.css'
import styles from './Slider.module.css'

export type SliderSize = 'sm' | 'md' | 'lg'
/** A single value, or a `[start, end]` tuple when `range`. */
export type SliderValue = number | [number, number]

/** A labeled tick under the track. */
export interface SliderMark {
  value: number
  label?: ReactNode
}

export interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max' | 'step' | 'color'
> {
  /** Label rendered above the track. */
  label?: ReactNode
  /** Preset size — drives the track + thumb dimensions and the label/helper font. */
  size?: SliderSize
  /** Marks the field invalid: red focus ring + the `helperText` in the error color. */
  error?: boolean
  /** Helper / validation text under the track. Adopts the error color while `error`. */
  helperText?: ReactNode
  /** Adds a red asterisk after the label. */
  required?: boolean
  /** Stretches the slider to fill its container width. Defaults to `true`. */
  fullWidth?: boolean
  /** Two-thumb range mode — pick a `[start, end]` span (e.g. 5–10). The value becomes a tuple. */
  range?: boolean
  /** Controlled value — a `number`, or a `[start, end]` tuple when `range`. */
  value?: SliderValue
  /** Initial value for uncontrolled use. Defaults to `min` (or `[min, max]` when `range`). */
  defaultValue?: SliderValue
  /** Fires with the next value (a `number`, or a `[start, end]` tuple when `range`). */
  onChange?: (value: SliderValue) => void
  /** Minimum value. Defaults to `0`. */
  min?: number
  /** Maximum value. Defaults to `100`. */
  max?: number
  /** Increment the thumb snaps to (arrow keys + drag). Defaults to `1`. */
  step?: number
  /** Theme palette token that tints the fill + thumb. Defaults to `accent`. */
  color?: ThemeColor
  /** Disables the slider. */
  disabled?: boolean
  /**
   * Show the current value at the end of the label row. Defaults to `true`. Pass a function to format
   * it (receives the `number` or `[start, end]`), or `false` to hide it.
   */
  valueLabel?: boolean | ((value: SliderValue) => ReactNode)
  /** Optional labeled ticks under the track (e.g. `[{ value: 0, label: 'Min' }, …]`). */
  marks?: SliderMark[]
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi)
const toPercent = (v: number, min: number, max: number) =>
  max > min ? ((v - min) / (max - min)) * 100 : 0

/**
 * A range slider — drag (or arrow-key / Home / End) a thumb along the track to pick a number, snapping
 * to `step`. Built on a native `<input type="range">`, so keyboard, dragging, step/min/max, and a11y
 * come for free; the track / fill / thumb are styled with `--tz-*` tokens and tinted by `color`. Pass
 * **`range`** for a two-thumb span (the value becomes a `[start, end]` tuple). Controlled (`value` +
 * `onChange`) or uncontrolled (`defaultValue`); a `name` binds it to a surrounding `<Form>` — the form
 * value is a real `number` (or `[start, end]`), validated with `z.number()` / `z.tuple([…])`.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    label,
    size = 'md',
    error,
    helperText,
    required = false,
    fullWidth = true,
    range = false,
    value,
    defaultValue,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    color = 'accent',
    disabled = false,
    valueLabel = true,
    marks,
    name,
    onBlur,
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

  // Auto-bind to a surrounding <Form> by `name` — the form value is a real number (or tuple); the
  // touched/error state comes from field(), the raw value from values[name] (tuples must not be coerced).
  const form = useFormContext()
  const isFormBound = Boolean(form && name)
  const bound = form && name ? form.field(name) : undefined

  const fallback: SliderValue = range ? [min, max] : min
  const externalValue: SliderValue | undefined =
    value !== undefined
      ? value
      : isFormBound
        ? ((form!.values[name!] as SliderValue | undefined) ?? fallback)
        : undefined
  const isControlled = externalValue !== undefined
  const [internal, setInternal] = useState<SliderValue>(defaultValue ?? fallback)
  const raw = isControlled ? externalValue! : internal

  // Normalize to the active shape (clamped, and — for a range — ordered low ≤ high).
  const tuple = Array.isArray(raw) ? raw : [min, raw]
  const lo = clamp(Math.min(tuple[0], tuple[1]), min, max)
  const hi = clamp(Math.max(tuple[0], tuple[1]), min, max)
  const single = clamp(Array.isArray(raw) ? raw[0] : raw, min, max)

  const resolvedError = error ?? bound?.error ?? false
  const resolvedHelperText = helperText ?? bound?.helperText

  const commit = (next: SliderValue) => {
    if (!isControlled) setInternal(next)
    if (isFormBound) form!.setValue(name!, next)
    onChange?.(next)
  }
  const commitRange = (nextLo: number, nextHi: number) => {
    const l = clamp(nextLo, min, max)
    const h = clamp(nextHi, min, max)
    commit([Math.min(l, h), Math.max(l, h)])
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    bound?.onBlur(event)
    onBlur?.(event)
  }

  const showValue = valueLabel !== false
  const currentValue: SliderValue = range ? [lo, hi] : single
  const renderedValue =
    typeof valueLabel === 'function' ? valueLabel(currentValue) : range ? `${lo} – ${hi}` : single

  const loPct = toPercent(lo, min, max)
  const hiPct = toPercent(hi, min, max)

  return (
    <div
      className={clsx(
        fieldStyles.field,
        fieldStyles[size],
        styles[size],
        fullWidth && fieldStyles.fullWidth,
        resolvedError && fieldStyles.error,
        disabled && fieldStyles.disabled,
        className,
      )}
      style={
        {
          '--tz-btn-rgb': `var(--tz-color-${color}-rgb)`,
          '--tz-slider-fill': `${toPercent(single, min, max)}%`,
          ...style,
        } as CSSProperties
      }
    >
      {(label != null || showValue) && (
        <div className={styles.labelRow}>
          {label != null ? (
            <label htmlFor={id} className={fieldStyles.label}>
              <Typography as="span" variant="bodySmall" color="muted">
                {label}
              </Typography>
              {required && (
                <span className={fieldStyles.required} aria-hidden="true">
                  *
                </span>
              )}
            </label>
          ) : (
            <span />
          )}
          {showValue && (
            <Typography as="span" variant="bodySmall" className={styles.value}>
              {renderedValue}
            </Typography>
          )}
        </div>
      )}

      {range ? (
        <div className={clsx(styles.track, styles.rangeTrack)}>
          <span className={styles.rail} aria-hidden />
          <span
            className={styles.rangeFill}
            aria-hidden
            style={{ left: `${loPct}%`, width: `${hiPct - loPct}%` }}
          />
          {/* start thumb — can't pass the end thumb */}
          <input
            ref={ref}
            id={id}
            name={name}
            type="range"
            min={min}
            max={max}
            step={step}
            value={lo}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              commitRange(Math.min(Number(e.target.value), hi), hi)
            }
            onBlur={handleBlur}
            disabled={disabled}
            className={clsx(styles.input, styles.rangeInput)}
            // end thumb sits on top by default (z 4); raise the start above it (z 5) only when both pile
            // at max, so whichever thumb needs grabbing is always reachable
            style={{ zIndex: lo >= max ? 5 : 3 }}
            aria-label={label != null ? `${String(label)} start` : 'Range start'}
            aria-invalid={resolvedError || undefined}
            aria-describedby={resolvedHelperText != null ? helperId : undefined}
            {...props}
          />
          {/* end thumb — can't pass the start thumb */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={hi}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              commitRange(lo, Math.max(Number(e.target.value), lo))
            }
            onBlur={handleBlur}
            disabled={disabled}
            className={clsx(styles.input, styles.rangeInput)}
            style={{ zIndex: 4 }}
            aria-label={label != null ? `${String(label)} end` : 'Range end'}
            aria-invalid={resolvedError || undefined}
            aria-describedby={resolvedHelperText != null ? helperId : undefined}
          />
        </div>
      ) : (
        <div className={clsx(styles.track, marks != null && marks.length > 0 && styles.hasMarks)}>
          <input
            ref={ref}
            id={id}
            name={name}
            type="range"
            min={min}
            max={max}
            step={step}
            value={single}
            onChange={(e: ChangeEvent<HTMLInputElement>) => commit(Number(e.target.value))}
            onBlur={handleBlur}
            disabled={disabled}
            className={styles.input}
            aria-invalid={resolvedError || undefined}
            aria-describedby={resolvedHelperText != null ? helperId : undefined}
            {...props}
          />
          {marks != null && marks.length > 0 && (
            <div className={styles.marks} aria-hidden>
              {marks.map((mark) => (
                <span
                  key={mark.value}
                  className={styles.mark}
                  style={{ left: `${toPercent(mark.value, min, max)}%` }}
                >
                  <span className={styles.tick} />
                  {mark.label != null && <span className={styles.markLabel}>{mark.label}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {resolvedHelperText != null && (
        <Typography
          as="span"
          id={helperId}
          variant="bodySmall"
          color={resolvedError ? 'error' : 'muted'}
          className={fieldStyles.helper}
        >
          {resolvedHelperText}
        </Typography>
      )}
    </div>
  )
})
