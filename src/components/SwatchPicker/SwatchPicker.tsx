import { forwardRef, useState, type CSSProperties, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { Icon } from '../Icon'
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
   * (16/20/24). Defaults to `md`. All three are per-size CSS vars in the module.
   */
  size?: SwatchPickerSize
  /** Per-color accessible labels (falls back to the color value itself). */
  labels?: Record<string, string>
}

/**
 * A grid of selectable color **swatches** (circles) — pick one from a fixed palette. The selected
 * swatch gets a ring (a surface-gap + a ring in its own color) and a check. Unlike `ColorPicker` (a
 * field with a full popover picker), this is a lightweight primitive for a **preset** set of colors —
 * e.g. a brand-accent chooser. Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 *
 * Swatch fills are arbitrary CSS colors (fed via an inline `--sw` var), not `--tz-*` tokens — a
 * deliberate exception, like `ColorPicker`'s spectrum; everything else is token-styled. a11y:
 * `role="radiogroup"` with `role="radio"` + `aria-checked` swatches (name the group via `aria-label`).
 */
export const SwatchPicker = forwardRef<HTMLDivElement, SwatchPickerProps>(function SwatchPicker(
  { colors, value, defaultValue = null, onChange, size = 'md', labels, className, ...props },
  ref,
) {
  const [internal, setInternal] = useState<string | null>(defaultValue)
  const selected = value !== undefined ? value : internal
  const active = (selected ?? '').toLowerCase()

  const pick = (color: string) => {
    if (value === undefined) setInternal(color)
    onChange?.(color)
  }

  return (
    <div
      ref={ref}
      role="radiogroup"
      className={clsx(styles.swatches, styles[size], className)}
      {...props}
    >
      {colors.map((color) => {
        const isSelected = color.toLowerCase() === active
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={labels?.[color] ?? color}
            className={styles.swatch}
            style={{ '--sw': color } as CSSProperties}
            onClick={() => pick(color)}
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
  )
})
