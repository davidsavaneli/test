import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { useFormContext } from '../../form/formContext'
import { FloatingPanel } from '../FloatingPanel/FloatingPanel'
import { Icon } from '../Icon'
import { Typography } from '../Typography'
import {
  clamp01,
  contrastOn,
  formatColor,
  hexToHsv,
  hsvToRgb,
  parseColor,
  rgbToHex,
  rgbToHsv,
  type HSV,
} from './colorUtils'
import styles from './ColorPicker.module.css'

export type ColorPickerSize = 'sm' | 'md' | 'lg'

/** A pleasant default palette shown as quick-pick swatches in the popover. */
const DEFAULT_SWATCHES = [
  '#13404e',
  '#039aa1',
  '#00a854',
  '#0ea5e9',
  '#6366f1',
  '#7c3aed',
  '#f04134',
  '#f59e0b',
  '#ffbf00',
  '#10b981',
  '#64748b',
  '#0f172a',
  '#ffffff',
]

const FALLBACK_HSV: HSV = hexToHsv('#13404e')

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
    swatches = DEFAULT_SWATCHES,
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

  // ── working HSV + alpha (HSV keeps hue stable while dragging at grey/black; alpha is the opacity) ─
  const [hsv, setHsv] = useState<HSV>(parsed ? rgbToHsv(parsed) : FALLBACK_HSV)
  const hsvRef = useRef(hsv)
  hsvRef.current = hsv
  const [alpha, setAlpha] = useState<number>(parsed?.a ?? 1)
  const alphaRef = useRef(alpha)
  alphaRef.current = alpha

  // re-derive HSV + alpha only when the value changes from OUTSIDE our own edits (prop/preset/input)
  useEffect(() => {
    if (!parsed) return
    const cur = formatColor({ ...hsvToRgb(hsvRef.current), a: alphaRef.current })
    if (displayValue !== cur) {
      setHsv(rgbToHsv(parsed))
      setAlpha(parsed.a)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayValue])

  const applyHsv = (next: HSV) => {
    setHsv(next)
    commit(formatColor({ ...hsvToRgb(next), a: alphaRef.current }))
  }

  const applyAlpha = (next: number) => {
    setAlpha(next)
    commit(formatColor({ ...hsvToRgb(hsvRef.current), a: next }))
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

  // ── drag (SV square + hue slider) ─────────────────────────────────────────────────────────────
  const drag =
    (onMove: (clientX: number, clientY: number, rect: DOMRect) => void) =>
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      const el = event.currentTarget
      const move = (clientX: number, clientY: number) =>
        onMove(clientX, clientY, el.getBoundingClientRect())
      move(event.clientX, event.clientY)
      const onPointerMove = (e: PointerEvent) => move(e.clientX, e.clientY)
      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
      }
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
    }

  const onSvDown = drag((x, y, rect) => {
    const s = clamp01((x - rect.left) / rect.width)
    const v = clamp01(1 - (y - rect.top) / rect.height)
    applyHsv({ ...hsvRef.current, s, v })
  })

  const onHueDown = drag((x, _y, rect) => {
    const h = clamp01((x - rect.left) / rect.width) * 360
    applyHsv({ ...hsvRef.current, h })
  })

  const onAlphaDown = drag((x, _y, rect) => {
    applyAlpha(clamp01((x - rect.left) / rect.width))
  })

  // ── color input (accepts hex / rgb() / rgba()) + clear ──────────────────────────────────────────
  const [colorDraft, setColorDraft] = useState('')
  useEffect(() => {
    setColorDraft(displayValue ?? '')
  }, [displayValue, open])

  const onColorInput = (raw: string) => {
    setColorDraft(raw)
    const p = parseColor(raw)
    if (p) {
      setHsv(rgbToHsv(p))
      setAlpha(p.a)
      commit(formatColor(p))
    }
  }

  const handleClear = () => {
    commit('')
    setHsv(FALLBACK_HSV)
    setAlpha(1)
  }

  // working color (hsv + alpha): the current swatch + the SV thumb (opaque) + the alpha track base
  const workingColor = formatColor({ ...hsvToRgb(hsv), a: alpha })
  const solidHex = rgbToHex(hsvToRgb(hsv))
  const cur = hsvToRgb(hsv)
  const cpRgb = `${Math.round(cur.r)}, ${Math.round(cur.g)}, ${Math.round(cur.b)}`

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
        className={styles.popover}
        style={{ '--cp-hue': hsv.h } as CSSProperties}
      >
        <div className={styles.sv} onPointerDown={onSvDown}>
          <span
            className={styles.svThumb}
            style={{
              left: `${hsv.s * 100}%`,
              top: `${(1 - hsv.v) * 100}%`,
              background: solidHex,
            }}
          />
        </div>

        <div className={styles.hue} onPointerDown={onHueDown}>
          <span className={styles.hueThumb} style={{ left: `${(hsv.h / 360) * 100}%` }} />
        </div>

        <div
          className={styles.alpha}
          onPointerDown={onAlphaDown}
          style={{ '--cp-rgb': cpRgb } as CSSProperties}
        >
          <span className={styles.alphaThumb} style={{ left: `${alpha * 100}%` }} />
        </div>

        <div className={styles.hexRow}>
          <span
            className={styles.currentSwatch}
            style={{ '--cp-fill': workingColor } as CSSProperties}
          />
          <span className={styles.hexField}>
            <input
              className={styles.hexInput}
              value={colorDraft}
              spellCheck={false}
              maxLength={28}
              aria-label="Color value"
              onChange={(e) => onColorInput(e.target.value)}
            />
          </span>
        </div>

        <div className={styles.swatches}>
          {/* "no color" — clears the field (the diagonal-stripe swatch) */}
          <button
            type="button"
            className={clsx(styles.swatch, styles.swatchClear)}
            aria-label="No color"
            aria-pressed={!parsed}
            onClick={handleClear}
          >
            {!parsed && <Icon name="TickCircle" size="sm" />}
          </button>
          {swatches.map((sw) => {
            const p = parseColor(sw)
            if (!p) return null
            const swHex = formatColor({ r: p.r, g: p.g, b: p.b, a: 1 })
            const selected = displayValue === swHex
            return (
              <button
                key={sw}
                type="button"
                className={styles.swatch}
                style={{ background: swHex, color: contrastOn(swHex) }}
                aria-label={swHex}
                aria-pressed={selected}
                onClick={() => {
                  setHsv(rgbToHsv(p))
                  commit(formatColor({ r: p.r, g: p.g, b: p.b, a: alphaRef.current }))
                }}
              >
                {selected && <Icon name="TickCircle" size="sm" />}
              </button>
            )
          })}
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
