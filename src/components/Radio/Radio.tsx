import {
  forwardRef,
  useId,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
import { useRadioGroupContext } from './radioContext'
import styles from './Radio.module.css'

export type RadioSize = 'sm' | 'md' | 'lg'

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'color' | 'type' | 'onChange' | 'value'
> {
  /** This option's value — selected when it matches the surrounding `RadioGroup`'s value. */
  value: string
  /** Text shown to the right of the control. */
  label?: ReactNode
  /** Theme palette token for the selected fill. Defaults to `accent` (inherits the group's `color`). */
  color?: ThemeColor
  /** Preset size — circle dimensions and label font. Inherits the group's `size` when omitted. */
  size?: RadioSize
  /** Marks the control invalid — reddens the ring. Inherits the group's `error`. */
  error?: boolean
  /** Controlled selected state for standalone use (inside a `RadioGroup` the group drives this). */
  checked?: boolean
  /** Fires with the next selected state (standalone use). */
  onChange?: (checked: boolean) => void
}

/**
 * A single radio button with a label. The native `<input type="radio">` is visually hidden but fully
 * accessible; a styled circle shows the state, filling with `color` and an inner dot when selected.
 * Designed to live inside a `<RadioGroup>` (which supplies the shared `name`, selection and
 * `size`/`color`/`disabled`/`error` via context), but also works standalone (`checked` + `onChange`).
 * Styling uses `--tz-*` tokens only.
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    value,
    label,
    color,
    size,
    error,
    checked,
    onChange,
    name,
    disabled,
    id: idProp,
    className,
    style,
    ...props
  },
  ref,
) {
  const reactId = useId()
  const id = idProp ?? reactId
  const group = useRadioGroupContext()

  const resolvedColor = color ?? group?.color ?? 'accent'
  const resolvedSize = size ?? group?.size ?? 'md'
  const resolvedError = error ?? group?.error ?? false
  const resolvedDisabled = disabled ?? group?.disabled ?? false
  const resolvedName = name ?? group?.name

  // In a group the selection comes from context; standalone it's controlled (`checked`) or local.
  const [internal, setInternal] = useState(false)
  const isChecked = group ? group.value === value : checked !== undefined ? checked : internal

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (group) {
      group.onChange(value)
      return
    }
    if (checked === undefined) setInternal(event.target.checked)
    onChange?.(event.target.checked)
  }

  return (
    <div
      className={clsx(
        styles.field,
        resolvedError && styles.error,
        resolvedDisabled && styles.disabled,
        className,
      )}
      style={{ '--tz-btn-rgb': `var(--tz-color-${resolvedColor}-rgb)`, ...style } as CSSProperties}
    >
      <label className={clsx(styles.row, styles[resolvedSize])}>
        <input
          ref={ref}
          id={id}
          name={resolvedName}
          type="radio"
          className={styles.input}
          value={value}
          checked={isChecked}
          onChange={handleChange}
          disabled={resolvedDisabled}
          aria-invalid={resolvedError || undefined}
          {...props}
        />
        <span className={styles.circle} aria-hidden="true">
          <span className={styles.dot} />
        </span>
        {label != null && <span className={styles.label}>{label}</span>}
      </label>
    </div>
  )
})
