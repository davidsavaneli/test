import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { ICON_NAMES, type IconName } from '../../icons/names'
import { useT, type ThemeColor } from '../../theme'
import styles from './Alert.module.css'

export type AlertVariant = 'contained' | 'filled' | 'outlined' | 'text'

const ICON_NAME_SET = new Set<string>(ICON_NAMES)

/** Default leading icon per semantic color (other colors fall back to `InfoCircle`). */
const DEFAULT_ICON: Partial<Record<ThemeColor, IconName>> = {
  success: 'TickCircle',
  error: 'CloseCircle',
  warning: 'Warning',
  info: 'InfoCircle',
}

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'title'> {
  /** Tint style. Defaults to `filled` (the soft tint). */
  variant?: AlertVariant
  /** Brand / semantic palette token that tints the alert. Defaults to `info`. */
  color?: ThemeColor
  /**
   * Leading icon — a known `IconName`, any node, or `false` to hide it. Defaults to the semantic icon
   * for `color` (success → `TickCircle`, error → `CloseCircle`, warning → `Warning`, info → `InfoCircle`).
   */
  icon?: IconName | ReactNode | false
  /** Trailing action (e.g. an `UNDO` button), placed before the close button. */
  action?: ReactNode
  /** When provided, a trailing × close button appears that calls this. */
  onClose?: () => void
  /** Accessible label for the close button. Defaults to `"Close"`. */
  closeLabel?: string
  /** Alert message. */
  children?: ReactNode
}

/**
 * A message banner — the library's inline feedback surface (info, success, warning, error). Tinted by
 * `color` via the shared `--tz-btn-rgb` pattern across the 4 standard `variant`s; a semantic leading
 * `icon` is auto-picked per color (override with `icon`, or `icon={false}` to drop it). An optional
 * `action` slot (e.g. an `UNDO` button) and an `onClose` × button trail the message. `role="alert"`.
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    variant = 'filled',
    color = 'info',
    icon,
    action,
    onClose,
    closeLabel,
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const t = useT()
  const renderedIcon =
    icon === false ? null : icon == null ? (
      <Icon name={DEFAULT_ICON[color] ?? 'InfoCircle'} />
    ) : typeof icon === 'string' && ICON_NAME_SET.has(icon) ? (
      <Icon name={icon as IconName} />
    ) : (
      icon
    )

  return (
    <div
      ref={ref}
      role="alert"
      className={clsx(styles.alert, styles[variant], className)}
      style={
        {
          '--tz-btn-rgb': `var(--tz-color-${color}-rgb)`,
          '--tz-btn-on': `var(--tz-color-${color}-contrast, #fff)`,
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      {renderedIcon != null && (
        <span className={styles.icon} aria-hidden>
          {renderedIcon}
        </span>
      )}
      <div className={styles.message}>{children}</div>
      {action != null && <div className={styles.action}>{action}</div>}
      {onClose && (
        <IconButton
          variant="text"
          color={color}
          size="sm"
          className={styles.close}
          aria-label={closeLabel ?? t('common.close')}
          onClick={onClose}
        >
          <Icon name="Close" />
        </IconButton>
      )}
    </div>
  )
})
