import {
  forwardRef,
  useId,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { useFormContext } from '../../form/formContext'
import type { ThemeColor } from '../../theme'
import styles from './Switch.module.css'

export type SwitchSize = 'sm' | 'md' | 'lg'

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'color' | 'type' | 'onChange'
> {
  /** Text shown to the right of the switch. */
  label?: ReactNode
  /** Brand palette token used for the "on" fill. Defaults to `medium`. */
  color?: ThemeColor
  /** Preset size — track/thumb dimensions and label font. */
  size?: SwitchSize
  /** Marks the field invalid — reddens the track ring (no helper text). */
  error?: boolean
  /** Adds a red asterisk after the label. */
  required?: boolean
  /** Controlled on/off state. */
  checked?: boolean
  /** Initial state for uncontrolled use. Defaults to `false`. */
  defaultChecked?: boolean
  /** Fires with the next on/off state. */
  onChange?: (checked: boolean) => void
}

/**
 * A toggle switch. The native `<input type="checkbox" role="switch">` is visually hidden but fully
 * accessible (keyboard + screen reader); a styled track + sliding thumb show the state, the track
 * filling with `color` when on. Controlled (`checked` + `onChange`) or uncontrolled (`defaultChecked`),
 * and — like the other fields — binds to a surrounding `<Form>` by `name` (its form value is a
 * `boolean`). `error` reddens the track (no message text). Styling uses `--tz-*` tokens only.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  {
    label,
    color = 'brand',
    size = 'md',
    error,
    required = false,
    checked,
    defaultChecked = false,
    onChange,
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

  // Auto-bind to a surrounding <Form> by `name` — the form value is a boolean.
  const form = useFormContext()
  const isFormBound = Boolean(form && name)
  const bound = form && name ? form.field(name) : undefined

  const externalChecked: boolean | undefined =
    checked !== undefined ? checked : isFormBound ? Boolean(form!.values[name!]) : undefined
  const isControlled = externalChecked !== undefined
  const [internal, setInternal] = useState<boolean>(defaultChecked)
  const isChecked = isControlled ? externalChecked! : internal

  const resolvedError = error ?? bound?.error ?? false

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.checked
    if (!isControlled) setInternal(next)
    if (isFormBound) form!.setValue(name!, next)
    onChange?.(next)
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    bound?.onBlur(event)
    onBlur?.(event)
  }

  return (
    <div
      className={clsx(
        styles.field,
        resolvedError && styles.error,
        disabled && styles.disabled,
        className,
      )}
      style={
        {
          '--tz-btn-rgb': `var(--tz-color-${color}-rgb)`,
          '--tz-btn-on': `var(--tz-color-${color}-contrast, #fff)`,
          ...style,
        } as CSSProperties
      }
    >
      <label className={clsx(styles.row, styles[size])}>
        <input
          ref={ref}
          id={id}
          name={name}
          type="checkbox"
          role="switch"
          className={styles.input}
          checked={isChecked}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          aria-invalid={resolvedError || undefined}
          {...props}
        />
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
        {label != null && (
          <span className={styles.label}>
            {label}
            {required && (
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            )}
          </span>
        )}
      </label>
    </div>
  )
})
