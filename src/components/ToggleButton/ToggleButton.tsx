import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
import { useToggleButtonGroup } from './toggleButtonGroupContext'
import styles from './ToggleButton.module.css'

export type ToggleButtonSize = 'sm' | 'md' | 'lg'

export interface ToggleButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'color' | 'value' | 'onChange'
> {
  /** The value this button represents — its identity within a `ToggleButtonGroup`. */
  value: string
  /** Selected state for standalone use (inside a group, the group owns selection). */
  selected?: boolean
  /** Fires with the next selected state — standalone use only. */
  onChange?: (selected: boolean, value: string) => void
  /** Theme palette token tinting the selected state. Defaults to `primary`. */
  color?: ThemeColor
  /** Preset size. Defaults to `md`. */
  size?: ToggleButtonSize
  /** Stretch to fill the container width. */
  fullWidth?: boolean
  /** Button content — typically an `Icon`, text, or both. */
  children?: ReactNode
}

/**
 * A two-state button that toggles between selected and unselected — the building block of
 * `ToggleButtonGroup` (which owns selection, size, color and disabled via context), but also usable
 * standalone with `selected` + `onChange`. Selected uses the soft `filled` tint of `color` (the shared
 * `--tz-btn-rgb` pattern); `aria-pressed` reflects the state. The ref points at the `<button>`.
 */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(function ToggleButton(
  {
    value,
    selected,
    onChange,
    color,
    size,
    fullWidth,
    disabled,
    className,
    style,
    children,
    onClick,
    ...props
  },
  ref,
) {
  const group = useToggleButtonGroup()
  const isSelected = group ? group.isSelected(value) : (selected ?? false)
  const resolvedColor = color ?? group?.color ?? 'primary'
  const resolvedSize = size ?? group?.size ?? 'md'
  const resolvedDisabled = Boolean(disabled || group?.disabled)
  // standalone full-width uses a width:100% class; inside a group the group stretches the buttons
  const resolvedFullWidth = !group && (fullWidth ?? false)

  return (
    <button
      ref={ref}
      type="button"
      className={clsx(
        styles.toggleButton,
        styles[resolvedSize],
        isSelected && styles.selected,
        resolvedFullWidth && styles.fullWidth,
        className,
      )}
      style={{ '--tz-btn-rgb': `var(--tz-color-${resolvedColor}-rgb)`, ...style } as CSSProperties}
      aria-pressed={isSelected}
      disabled={resolvedDisabled}
      onClick={(event) => {
        onClick?.(event)
        if (group) group.toggle(value)
        else onChange?.(!isSelected, value)
      }}
      {...props}
    >
      {children}
    </button>
  )
})
