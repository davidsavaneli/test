import {
  forwardRef,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { useFormContext } from '../../form/formContext'
import { Icon } from '../Icon'
import { Typography } from '../Typography'
// shared field chrome (wrapper / label / helper / required / error / sizes)
import fieldStyles from '../TextField/TextField.module.css'
import styles from './SwatchPicker.module.css'

export type SwatchPickerSize = 'sm' | 'md' | 'lg'

export interface SwatchPickerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** The color values to render as selectable swatches (any CSS color — hex / `rgb()` / …). */
  colors: string[]
  /** The selected color (controlled) — matched case-insensitively against `colors`; `null` = none. */
  value?: string | null
  /** Initial selected color (uncontrolled). */
  defaultValue?: string | null
  /** Fires with the clicked color. */
  onChange?: (color: string) => void
  /**
   * Swatch size — `sm` 30 / `md` 36 / `lg` 42 px, each with its own corner radius and tick size
   * (12/16/20). Defaults to `md`. All three are per-size CSS vars in the module.
   */
  size?: SwatchPickerSize
  /** Per-color accessible labels (falls back to the color value itself). */
  labels?: Record<string, string>
  /** Label rendered above the swatches. */
  label?: ReactNode
  /** Marks the field invalid — reddens the label/asterisk and shows `helperText` in the error color. */
  error?: boolean
  /** Helper / validation text under the swatches. Adopts the error color while `error`. */
  helperText?: ReactNode
  /** Adds a red asterisk after the label. */
  required?: boolean
  /** Form field name — auto-binds to a surrounding `<Form>` (the form value is the color string). */
  name?: string
}

/**
 * A grid of selectable color **swatches** (rounded tiles) — pick one from a fixed palette. The selected
 * swatch shows a centered white **`TickCircle`** icon. Unlike `ColorPicker` (a field + full popover
 * picker), this is a lightweight primitive for a **preset** set of colors — e.g. an accent-color chooser.
 * Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`); binds to a surrounding `<Form>` by
 * `name` (the form value is the color string — validate with e.g. `z.string().min(1, 'Pick a color')`),
 * and shares the field family's `label` / `error` + `helperText` / `required` chrome.
 *
 * Swatch fills are arbitrary CSS colors (fed via an inline `--sw` var), not `--tz-*` tokens — a
 * deliberate exception, like `ColorPicker`'s spectrum. a11y: `role="radiogroup"` (labelled by `label`
 * or `aria-label`) with `role="radio"` + `aria-checked` swatches; the group carries `name` for the
 * form's scroll-to-error.
 */
export const SwatchPicker = forwardRef<HTMLDivElement, SwatchPickerProps>(function SwatchPicker(
  {
    colors,
    value,
    defaultValue = null,
    onChange,
    size = 'md',
    labels,
    label,
    error,
    helperText,
    required = false,
    name,
    className,
    'aria-label': ariaLabel,
    ...props
  },
  ref,
) {
  const id = useId()
  const labelId = `${id}-label`
  const helperId = `${id}-helper`

  // Auto-bind to a surrounding <Form> by `name` — the form value is the color string.
  const form = useFormContext()
  const isFormBound = Boolean(form && name)
  const bound = form && name ? form.field(name) : undefined

  const externalValue: string | null | undefined =
    value !== undefined
      ? value
      : isFormBound
        ? ((form!.values[name!] as string | null | undefined) ?? null)
        : undefined
  const isControlled = externalValue !== undefined
  const [internal, setInternal] = useState<string | null>(defaultValue)
  const selected = isControlled ? externalValue! : internal
  const active = (selected ?? '').toLowerCase()

  const resolvedError = error ?? bound?.error ?? false
  const resolvedHelperText = helperText ?? bound?.helperText

  const pick = (color: string) => {
    if (!isControlled) setInternal(color)
    if (isFormBound) form!.setValue(name!, color)
    onChange?.(color)
  }

  // roving tabindex (ARIA radiogroup): only the selected swatch — or the first, if none — is tabbable;
  // arrows move selection between swatches (wrapping), Home/End jump to the ends
  const swatchRefs = useRef<(HTMLButtonElement | null)[]>([])
  const selectedIndex = colors.findIndex((c) => c.toLowerCase() === active)
  const tabbableIndex = selectedIndex >= 0 ? selectedIndex : 0
  const onSwatchKey = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    let target = index
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        target = (index + 1) % colors.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        target = (index - 1 + colors.length) % colors.length
        break
      case 'Home':
        target = 0
        break
      case 'End':
        target = colors.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    pick(colors[target])
    swatchRefs.current[target]?.focus()
  }

  return (
    <div
      ref={ref}
      className={clsx(
        fieldStyles.field,
        fieldStyles[size],
        resolvedError && fieldStyles.error,
        className,
      )}
      {...props}
    >
      {label != null && (
        <label id={labelId} className={fieldStyles.label}>
          <Typography as="span" variant="bodySmall" color="muted">
            {label}
          </Typography>
          {required && (
            <span className={fieldStyles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div
        role="radiogroup"
        aria-labelledby={label != null ? labelId : undefined}
        aria-label={label == null ? ariaLabel : undefined}
        aria-invalid={resolvedError || undefined}
        aria-describedby={resolvedHelperText != null ? helperId : undefined}
        className={clsx(styles.swatches, styles[size])}
        // name + tabIndex are load-bearing for the form's scroll-to-error
        {...(name ? { name, tabIndex: -1 } : {})}
      >
        {colors.map((color, index) => {
          const isSelected = color.toLowerCase() === active
          return (
            <button
              key={color}
              ref={(el) => {
                swatchRefs.current[index] = el
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={labels?.[color] ?? color}
              tabIndex={index === tabbableIndex ? 0 : -1}
              className={styles.swatch}
              style={{ '--sw': color } as CSSProperties}
              onClick={() => pick(color)}
              onKeyDown={(e) => onSwatchKey(e, index)}
            >
              {isSelected ? (
                <Icon
                  name="TickCircle"
                  style={{ width: 'var(--sw-icon)', height: 'var(--sw-icon)' }}
                />
              ) : null}
            </button>
          )
        })}
      </div>
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
