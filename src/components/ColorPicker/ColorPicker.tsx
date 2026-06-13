import {
  forwardRef,
  useCallback,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { useFormContext } from '../../form/formContext'
import { FloatingPanel } from '../FloatingPanel/FloatingPanel'
import { Typography } from '../Typography'
import { ColorPickerPanel } from './ColorPickerPanel'
import { formatColor, parseColor } from './colorUtils'
import styles from './ColorPicker.module.css'

export type ColorPickerSize = 'sm' | 'md' | 'lg'

/** Popover width (px). */
const POPOVER_WIDTH = 232

export interface ColorPickerProps {
  /** Label rendered above the field. */
  label?: ReactNode
  /** Preset size — control height, swatch and font. */
  size?: ColorPickerSize
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
  /** Controlled value — a CSS color string: `#rrggbb` hex, or `rgba(r, g, b, a)` when translucent. */
  value?: string
  /** Initial value for uncontrolled use (hex or `rgb()`/`rgba()`). */
  defaultValue?: string
  /** Fires with the next color: `#rrggbb` when opaque, `rgba(r, g, b, a)` when not (or `''` when cleared). */
  onChange?: (color: string) => void
  /** Quick-pick swatches shown in the popover. Defaults to a curated palette. */
  swatches?: string[]
  /** Form field name — auto-binds to a surrounding `<Form>` (value is the hex string). */
  name?: string
  /** Placeholder shown in the trigger when no color is set. Omit to show nothing. */
  placeholder?: string
  /** Id for the trigger (label association). */
  id?: string
  className?: string
  style?: CSSProperties
}

/**
 * A color field with a beautiful popover picker: a saturation/value square, a hue slider, an alpha
 * (opacity) slider, a color input, quick-pick swatches and a clear button. The input accepts hex
 * (`#rgb`/`#rrggbb`/`#rrggbbaa`) or `rgb()`/`rgba()`, and the value comes back as `#rrggbb` when
 * fully opaque or `rgba(r, g, b, a)` when translucent. Clicking the trigger opens the popover, which
 * — like `Dropdown` — is portaled to `<body>`, opens below (flips above only when it would
 * overflow), locks page scroll and re-positions on scroll/resize. Controlled (`value` + `onChange`)
 * or uncontrolled (`defaultValue`), and binds to a surrounding `<Form>` by `name` (its form value is
 * the color string; validate with e.g. `z.string().regex(/^#[0-9a-f]{6}$/i, 'Pick a color')`, or a
 * looser pattern if you allow `rgba()`). Styling uses `--tz-*` tokens (the spectrum gradients and
 * the alpha checkerboard are the unavoidable exceptions).
 */
export const ColorPicker = forwardRef<HTMLButtonElement, ColorPickerProps>(function ColorPicker(
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
    swatches,
    name,
    placeholder,
    id: idProp,
    className,
    style,
  },
  ref,
) {
  const reactId = useId()
  const id = idProp ?? reactId
  const helperId = `${id}-helper`

  // Auto-bind to a surrounding <Form> by `name` — the form value is the hex string.
  const form = useFormContext()
  const isFormBound = Boolean(form && name)
  const bound = form && name ? form.field(name) : undefined

  const externalValue: string | undefined =
    value !== undefined
      ? value
      : isFormBound
        ? ((form!.values[name!] as string | undefined) ?? '')
        : undefined
  const isControlled = externalValue !== undefined
  const [internal, setInternal] = useState<string>(defaultValue ?? '')
  const currentColor = isControlled ? externalValue! : internal
  const parsed = parseColor(currentColor || '')
  // canonical string for the value (`#rrggbb` when opaque, `rgba(...)` when not), null when unset
  const displayValue = parsed ? formatColor(parsed) : null
  // hex shows uppercase in the trigger; rgba() stays as-is
  const displayText = displayValue
    ? displayValue[0] === '#'
      ? displayValue.toUpperCase()
      : displayValue
    : null

  const resolvedError = error ?? bound?.error ?? false
  const resolvedHelperText = helperText ?? bound?.helperText

  const commit = (color: string) => {
    if (!isControlled) setInternal(color)
    if (isFormBound) form!.setValue(name!, color)
    onChange?.(color)
  }

  // ── popover (positioning / scroll-lock / dismiss come from FloatingPanel) ──────────────────────
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)

  const setTriggerRef = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as { current: HTMLButtonElement | null }).current = node
    },
    [ref],
  )

  const closePopover = useCallback((refocus: boolean) => {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }, [])

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

      <button
        ref={setTriggerRef}
        id={id}
        name={name}
        type="button"
        className={clsx(styles.control, open && styles.open)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={resolvedError || undefined}
        aria-describedby={resolvedHelperText != null ? helperId : undefined}
        aria-label={label || parsed || placeholder ? undefined : 'Pick a color'}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={clsx(styles.value, !parsed && styles.placeholder)}>
          {displayText ?? placeholder}
        </span>
        <span
          className={clsx(styles.preview, !parsed && styles.previewEmpty)}
          style={parsed ? ({ '--cp-fill': displayValue } as CSSProperties) : undefined}
          aria-hidden="true"
        />
      </button>

      <FloatingPanel
        ref={popoverRef}
        open={open}
        triggerRef={triggerRef}
        onClose={closePopover}
        role="dialog"
        ariaLabel="Color picker"
        width={POPOVER_WIDTH}
      >
        <ColorPickerPanel value={currentColor} onChange={commit} swatches={swatches} />
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
