import { forwardRef, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { ICON_NAMES, type IconName } from '../../icons/names'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'
import { useSpeedDial } from './speedDialContext'
import styles from './SpeedDial.module.css'

const ICON_NAME_SET = new Set<string>(ICON_NAMES)

export interface SpeedDialActionProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'color'
> {
  /** Action icon — a known `IconName` or any node. */
  icon: IconName | ReactNode
  /** Label shown as a tooltip beside the action (also its `aria-label` when a string). */
  label?: ReactNode
  /** Show the label persistently (no hover) while the dial is open — overrides the dial's `tooltipOpen`. */
  tooltipOpen?: boolean
  /** Hide the tooltip / persistent label (still used for `aria-label`). */
  hideTooltip?: boolean
}

/**
 * One action inside a `<SpeedDial>` — a small circular `IconButton` (surface-tinted) with a tooltip
 * `label`. It reads the dial via context for its size, tooltip placement and close-on-click; clicking
 * runs `onClick` then closes the dial. The ref points at the `<button>`.
 */
export const SpeedDialAction = forwardRef<HTMLButtonElement, SpeedDialActionProps>(
  function SpeedDialAction(
    { icon, label, tooltipOpen, hideTooltip = false, onClick, disabled, className, ...props },
    ref,
  ) {
    const dial = useSpeedDial()
    const iconNode =
      typeof icon === 'string' && ICON_NAME_SET.has(icon) ? <Icon name={icon as IconName} /> : icon

    const button = (
      <IconButton
        ref={ref}
        rounded
        variant="contained"
        color="surface"
        size={dial?.size ?? 'sm'}
        disabled={disabled}
        aria-label={typeof label === 'string' ? label : undefined}
        className={clsx(styles.action, className)}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event)
          if (dial?.closeOnClick) dial.requestClose()
        }}
        {...props}
      >
        {iconNode}
      </IconButton>
    )

    if (label == null || hideTooltip) return button

    const placement = dial?.placement ?? 'left'
    // persistent label: render a static label beside the button (no hover) — like MUI's tooltipOpen
    const persistent = tooltipOpen ?? dial?.persistentLabels ?? false
    if (persistent) {
      return (
        <span
          className={clsx(
            styles.actionWrap,
            placement === 'top' ? styles.labelTop : styles.labelLeft,
          )}
        >
          {button}
          <span className={styles.actionLabel}>{label}</span>
        </span>
      )
    }

    return (
      <Tooltip content={label} placement={placement}>
        {button}
      </Tooltip>
    )
  },
)
