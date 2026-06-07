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
import styles from './Checkbox.module.css'

export type CheckboxSize = 'sm' | 'md' | 'lg'

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'color' | 'type' | 'onChange'
> {
  /** Text shown to the right of the box. */
  label?: ReactNode
  /** Brand palette token used for the checked fill. Defaults to `medium`. */
  color?: ThemeColor
  /** Preset size — box dimensions and label font. */
  size?: CheckboxSize
  /** Marks the field invalid — reddens the box only (no helper text). */
  error?: boolean
  /** Adds a red asterisk after the label. */
  required?: boolean
  /** Controlled checked state. */
  checked?: boolean
  /** Initial checked state for uncontrolled use. Defaults to `false`. */
  defaultChecked?: boolean
  /** Fires with the next checked state. */
  onChange?: (checked: boolean) => void
}

/**
 * A checkbox with a label. The native `<input type="checkbox">` is visually hidden but fully
 * accessible (keyboard + screen reader); a styled box shows the state, filled with `color` and a
 * CSS checkmark when checked. Controlled (`checked` + `onChange`) or uncontrolled (`defaultChecked`),
 * and — like the other fields — binds to a surrounding `<Form>` by `name` (its form value is a
 * `boolean`). `error` reddens the box (no message text). Styling uses `--tz-*` tokens only.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    label,
    color = 'medium',
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
          className={styles.input}
          checked={isChecked}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          aria-invalid={resolvedError || undefined}
          {...props}
        />
        <span className={styles.box} aria-hidden="true">
          <span className={styles.check} />
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
