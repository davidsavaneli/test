import {
  forwardRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
import { ICON_NAMES, type IconName } from '../../icons/names'
import { Icon } from '../Icon'
import { ToggleButton, type ToggleButtonSize } from './ToggleButton'
import {
  ToggleButtonGroupContext,
  type ToggleButtonGroupContextValue,
} from './toggleButtonGroupContext'
import styles from './ToggleButton.module.css'

const ICON_NAME_SET = new Set<string>(ICON_NAMES)

export type ToggleButtonGroupOrientation = 'horizontal' | 'vertical'

/** A data-driven button for the `options` prop. */
export interface ToggleButtonOption {
  value: string
  label?: ReactNode
  /** Leading icon — a known `IconName` or any node. */
  icon?: IconName | ReactNode
  disabled?: boolean
  /** Accessible label (use for icon-only buttons). */
  ariaLabel?: string
}

export interface ToggleButtonGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'color' | 'onChange' | 'defaultValue'
> {
  /**
   * Single-selection (`value` is a `string | null`, like a segmented control) vs multiple (`value` is
   * a `string[]`). Defaults to `false` (multiple), matching MUI.
   */
  exclusive?: boolean
  /** Controlled value — a `string | null` when `exclusive`, else a `string[]`. */
  value?: string | string[] | null
  /** Initial value for uncontrolled use (same shape as `value`). */
  defaultValue?: string | string[] | null
  /** Fires with the next value (matches the `exclusive` shape). */
  onChange?: (value: string | string[] | null) => void
  /** Data-driven buttons — an alternative to passing `<ToggleButton>` children. */
  options?: ToggleButtonOption[]
  /** Lay the buttons in a row or a column. Defaults to `horizontal`. */
  orientation?: ToggleButtonGroupOrientation
  /** Preset size for every button. Defaults to `md`. */
  size?: ToggleButtonSize
  /** Brand palette token tinting selected buttons. Defaults to `primary`. */
  color?: ThemeColor
  /** Disables every button in the group. */
  disabled?: boolean
  /** Stretch the group to fill the width (buttons share it equally). */
  fullWidth?: boolean
  /** `<ToggleButton>` children (used when `options` is not given). */
  children?: ReactNode
}

/**
 * Groups `<ToggleButton>`s into a joined, segmented control. **`exclusive`** picks single-selection
 * (`value` is a `string | null` — clicking the active button deselects it) vs multiple (`value` is a
 * `string[]`); both are controlled (`value` + `onChange`) or uncontrolled (`defaultValue`). Supply the
 * buttons via the data-driven `options` prop or as `<ToggleButton>` children — the group shares
 * `size`/`color`/`disabled`/`fullWidth` and the selection via context. `orientation` lays them in a
 * row or column; adjacent borders collapse so the strip reads as one control. `role="group"`; styling
 * uses `--tz-*` tokens.
 */
export const ToggleButtonGroup = forwardRef<HTMLDivElement, ToggleButtonGroupProps>(
  function ToggleButtonGroup(
    {
      exclusive = false,
      value,
      defaultValue,
      onChange,
      options,
      orientation = 'horizontal',
      size = 'md',
      color = 'primary',
      disabled = false,
      fullWidth = false,
      children,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const isControlled = value !== undefined
    const [internal, setInternal] = useState<string | string[] | null | undefined>(defaultValue)
    const current = isControlled ? value : internal

    const isSelected = (v: string) =>
      exclusive ? current === v : Array.isArray(current) && current.includes(v)

    const toggle = (v: string) => {
      let next: string | string[] | null
      if (exclusive) {
        next = current === v ? null : v // click the active button to deselect (MUI behavior)
      } else {
        const arr = Array.isArray(current) ? current : []
        next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
      }
      if (!isControlled) setInternal(next)
      onChange?.(next)
    }

    const ctx: ToggleButtonGroupContextValue = {
      isSelected,
      toggle,
      size,
      color,
      disabled,
      fullWidth,
    }

    return (
      <div
        ref={ref}
        role="group"
        className={clsx(
          styles.group,
          orientation === 'vertical' && styles.vertical,
          fullWidth && styles.fullWidth,
          className,
        )}
        style={style as CSSProperties}
        {...props}
      >
        <ToggleButtonGroupContext.Provider value={ctx}>
          {options
            ? options.map((option) => (
                <ToggleButton
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  aria-label={option.ariaLabel}
                >
                  {option.icon != null &&
                    (typeof option.icon === 'string' && ICON_NAME_SET.has(option.icon) ? (
                      <Icon name={option.icon as IconName} />
                    ) : (
                      option.icon
                    ))}
                  {option.label}
                </ToggleButton>
              ))
            : children}
        </ToggleButtonGroupContext.Provider>
      </div>
    )
  },
)
