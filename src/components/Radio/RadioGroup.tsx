import {
  forwardRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { useFormContext } from '../../form/formContext'
import type { ThemeColor } from '../../theme'
import { Typography } from '../Typography'
import { Radio, type RadioSize } from './Radio'
import { RadioGroupContext, type RadioGroupContextValue } from './radioContext'
import styles from './Radio.module.css'

export type RadioOrientation = 'vertical' | 'horizontal'

/** A single option for the data-driven `options` prop. */
export interface RadioOption {
  value: string
  label?: ReactNode
  disabled?: boolean
}

export interface RadioGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** Group label rendered above the options. */
  label?: ReactNode
  /** Controlled selected value. */
  value?: string
  /** Initial value for uncontrolled use. */
  defaultValue?: string
  /** Fires with the newly-selected value. */
  onChange?: (value: string) => void
  /** Shared input `name` for the radios (also the `<Form>` binding key). */
  name?: string
  /** Data-driven options — an alternative to passing `<Radio>` children. */
  options?: RadioOption[]
  /** Stack direction of the options. Defaults to `vertical`. */
  orientation?: RadioOrientation
  /** Preset size for every radio. Defaults to `md`. */
  size?: RadioSize
  /** Brand palette token for the selected fill. Defaults to `medium`. */
  color?: ThemeColor
  /** Marks the group invalid — reddens the radio rings (no message text, like `Checkbox`). */
  error?: boolean
  /** Adds a red asterisk after the label. */
  required?: boolean
  /** Disables every radio in the group. */
  disabled?: boolean
  /** `<Radio>` children (used when `options` is not given). */
  children?: ReactNode
}

/**
 * Groups radio buttons so exactly one is selected. Supplies the shared `name`, selection and
 * `size`/`color`/`disabled`/`error` to its `<Radio>` children via context — pass them as `children`
 * or, for the common case, via the data-driven `options` prop. Controlled (`value` + `onChange`) or
 * uncontrolled (`defaultValue`), and binds to a surrounding `<Form>` by `name` (its form value is a
 * `string`; validate with e.g. `z.string().min(1)`). `error` reddens the radio rings (no message text,
 * like `Checkbox`). `role="radiogroup"`; styling uses `--tz-*` tokens.
 */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  {
    label,
    value,
    defaultValue,
    onChange,
    name,
    options,
    orientation = 'vertical',
    size = 'md',
    color = 'medium',
    error,
    required = false,
    disabled = false,
    children,
    className,
    style,
    ...props
  },
  ref,
) {
  // Auto-bind to a surrounding <Form> by `name` — the form value is the selected string.
  const form = useFormContext()
  const isFormBound = Boolean(form && name)
  const bound = form && name ? form.field(name) : undefined

  const externalValue: string | undefined =
    value !== undefined
      ? value
      : isFormBound
        ? (form!.values[name!] as string | undefined)
        : undefined
  const isControlled = externalValue !== undefined
  const [internal, setInternal] = useState<string | undefined>(defaultValue)
  const currentValue = isControlled ? externalValue : internal

  const resolvedError = error ?? bound?.error ?? false

  const handleChange = (next: string) => {
    if (!isControlled) setInternal(next)
    if (isFormBound) form!.setValue(name!, next)
    onChange?.(next)
  }

  const ctx: RadioGroupContextValue = {
    name,
    value: currentValue,
    onChange: handleChange,
    size,
    color,
    disabled,
    error: resolvedError,
  }

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-invalid={resolvedError || undefined}
      className={clsx(styles.group, className)}
      style={style as CSSProperties}
      {...props}
    >
      {label != null && (
        <span className={styles.groupLabel}>
          <Typography as="span" variant="bodySmall" color="muted">
            {label}
          </Typography>
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </span>
      )}

      <div className={clsx(styles.options, orientation === 'horizontal' && styles.horizontal)}>
        <RadioGroupContext.Provider value={ctx}>
          {options
            ? options.map((option) => (
                <Radio
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  disabled={option.disabled}
                />
              ))
            : children}
        </RadioGroupContext.Provider>
      </div>
    </div>
  )
})
