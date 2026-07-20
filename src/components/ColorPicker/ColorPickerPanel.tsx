import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { clsx } from 'clsx'
import { Icon } from '../Icon'
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

/** A pleasant default palette shown as quick-pick swatches. */
export const DEFAULT_SWATCHES = [
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

export interface ColorPickerPanelProps {
  /** Current color — a CSS color string (`#rrggbb`, `rgba(...)`, or `''` when unset). */
  value: string
  /** Fires with the next color: `#rrggbb` when opaque, `rgba(r, g, b, a)` when translucent, `''` when cleared. */
  onChange: (color: string) => void
  /** Quick-pick swatches. Defaults to a curated palette. */
  swatches?: string[]
  /** Show the leading "no color" swatch that clears the value. Defaults to `true`. */
  clearable?: boolean
}

/**
 * The color-picking surface — a saturation/value square, hue + alpha sliders, a color input and
 * quick-pick swatches. Controlled by a single color `string` (`value` / `onChange`), so it drops into
 * any popover. Working state is kept as HSV + alpha (hue survives dragging at grey/black), re-derived
 * from `value` only on external changes. Used by `ColorPicker` (the field) and the `RichTextEditor`
 * text-color control. Token-styled except the spectrum gradients + alpha checkerboard (literal colors).
 */
export function ColorPickerPanel({
  value,
  onChange,
  swatches = DEFAULT_SWATCHES,
  clearable = true,
}: ColorPickerPanelProps) {
  const parsed = parseColor(value || '')
  // canonical string for the value (`#rrggbb` when opaque, `rgba(...)` when not), null when unset
  const displayValue = parsed ? formatColor(parsed) : null

  // working HSV + alpha (HSV keeps hue stable while dragging at grey/black; alpha is the opacity)
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
    onChange(formatColor({ ...hsvToRgb(next), a: alphaRef.current }))
  }

  const applyAlpha = (next: number) => {
    setAlpha(next)
    onChange(formatColor({ ...hsvToRgb(hsvRef.current), a: next }))
  }

  // drag (SV square + hue/alpha sliders)
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

  // keyboard control — arrows nudge, Home/End jump to the extents (mirrors Calendar/TimeColumns a11y)
  const SV_STEP = 0.01
  const onSvKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const { h, s, v } = hsvRef.current
    let ns = s
    let nv = v
    switch (event.key) {
      case 'ArrowLeft':
        ns = clamp01(s - SV_STEP)
        break
      case 'ArrowRight':
        ns = clamp01(s + SV_STEP)
        break
      case 'ArrowUp':
        nv = clamp01(v + SV_STEP)
        break
      case 'ArrowDown':
        nv = clamp01(v - SV_STEP)
        break
      default:
        return
    }
    event.preventDefault()
    applyHsv({ h, s: ns, v: nv })
  }
  const onHueKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const { h } = hsvRef.current
    let nh = h
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        nh = Math.max(0, h - 1)
        break
      case 'ArrowRight':
      case 'ArrowUp':
        nh = Math.min(360, h + 1)
        break
      case 'Home':
        nh = 0
        break
      case 'End':
        nh = 360
        break
      default:
        return
    }
    event.preventDefault()
    applyHsv({ ...hsvRef.current, h: nh })
  }
  const onAlphaKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    let na = alphaRef.current
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        na = clamp01(alphaRef.current - 0.01)
        break
      case 'ArrowRight':
      case 'ArrowUp':
        na = clamp01(alphaRef.current + 0.01)
        break
      case 'Home':
        na = 0
        break
      case 'End':
        na = 1
        break
      default:
        return
    }
    event.preventDefault()
    applyAlpha(na)
  }

  // color input (accepts hex / rgb() / rgba()) + clear
  const [colorDraft, setColorDraft] = useState('')
  useEffect(() => {
    setColorDraft(displayValue ?? '')
  }, [displayValue])

  const onColorInput = (raw: string) => {
    setColorDraft(raw)
    const p = parseColor(raw)
    if (p) {
      setHsv(rgbToHsv(p))
      setAlpha(p.a)
      onChange(formatColor(p))
    }
  }

  const handleClear = () => {
    onChange('')
    setHsv(FALLBACK_HSV)
    setAlpha(1)
  }

  // working color (hsv + alpha): the current swatch + the SV thumb (opaque) + the alpha track base
  const workingColor = formatColor({ ...hsvToRgb(hsv), a: alpha })
  const solidHex = rgbToHex(hsvToRgb(hsv))
  const cur = hsvToRgb(hsv)
  const cpRgb = `${Math.round(cur.r)}, ${Math.round(cur.g)}, ${Math.round(cur.b)}`

  return (
    <div className={styles.popover} style={{ '--cp-hue': hsv.h } as CSSProperties}>
      <div
        className={styles.sv}
        onPointerDown={onSvDown}
        onKeyDown={onSvKey}
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuetext={`${Math.round(hsv.s * 100)}% saturation, ${Math.round(hsv.v * 100)}% brightness`}
      >
        <span
          className={styles.svThumb}
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: solidHex }}
        />
      </div>

      <div
        className={styles.hue}
        onPointerDown={onHueDown}
        onKeyDown={onHueKey}
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
      >
        <span className={styles.hueThumb} style={{ left: `${(hsv.h / 360) * 100}%` }} />
      </div>

      <div
        className={styles.alpha}
        onPointerDown={onAlphaDown}
        onKeyDown={onAlphaKey}
        role="slider"
        tabIndex={0}
        aria-label="Opacity"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(alpha * 100)}
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
        {/* "no color" — clears the value (the diagonal-stripe swatch); hidden when not clearable */}
        {clearable && (
          <button
            type="button"
            className={clsx(styles.swatch, styles.swatchClear)}
            aria-label="No color"
            aria-pressed={!parsed}
            onClick={handleClear}
          >
            {!parsed && <Icon name="TickCircle" size="sm" />}
          </button>
        )}
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
                onChange(formatColor({ r: p.r, g: p.g, b: p.b, a: alphaRef.current }))
              }}
            >
              {selected && <Icon name="TickCircle" size="sm" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
