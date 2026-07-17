import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
import { Icon } from '../Icon'
import styles from './Chip.module.css'

export type ChipVariant = 'contained' | 'filled' | 'outlined' | 'text'
export type ChipSize = 'sm' | 'md' | 'lg'

export interface ChipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** Visual style. Defaults to `filled` (a soft tinted chip). */
  variant?: ChipVariant
  /** Theme palette token that tints the chip. Defaults to `primary`. */
  color?: ThemeColor
  /** Preset size — height + font. Defaults to `md`. */
  size?: ChipSize
  /** Makes the chip interactive (hover, pointer, keyboard, `onClick`). Off by default (a static tag). */
  clickable?: boolean
  /** Dims the chip and disables all interaction. */
  disabled?: boolean
  /** Leading icon (e.g. an `<Icon />`). Ignored when `avatar` is set. */
  startIcon?: ReactNode
  /** Leading avatar (e.g. an `<Avatar />`), sized to the chip and flush to the left. */
  avatar?: ReactNode
  /** When provided, shows a trailing delete button that calls this (its click won't trigger `onClick`). */
  onDelete?: () => void
  /** Custom delete icon. Defaults to a `CloseCircle`. */
  deleteIcon?: ReactNode
  /** Accessible label for the delete button. Defaults to `"Remove"`. */
  deleteLabel?: string
  /** Tab index for the delete button — pass `-1` when the chip lives inside a composite widget (e.g. a multi-select) that owns keyboard focus. */
  deleteTabIndex?: number
  /** Chip label. */
  children?: ReactNode
}

/**
 * A compact tag/token. Static by default; `clickable` makes it an interactive `role="button"`
 * (hover + Enter/Space). Supports a leading `startIcon` or `avatar` and a trailing delete button via
 * `onDelete`. Tinted by `color` through the shared `--tz-btn-rgb` / `--tz-btn-on` pattern across the
 * four standard variants. Token-only styling.
 */
export const Chip = forwardRef<HTMLDivElement, ChipProps>(function Chip(
  {
    variant = 'filled',
    color = 'primary',
    size = 'md',
    clickable = false,
    disabled = false,
    startIcon,
    avatar,
    onDelete,
    deleteIcon,
    deleteLabel = 'Remove',
    deleteTabIndex,
    className,
    style,
    children,
    onKeyDown,
    ...props
  },
  ref,
) {
  const interactive = clickable && !disabled

  const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (!disabled) onDelete?.()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (interactive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      event.currentTarget.click()
    }
    onKeyDown?.(event)
  }

  return (
    <div
      ref={ref}
      className={clsx(
        styles.chip,
        styles[variant],
        styles[size],
        interactive && styles.clickable,
        disabled && styles.disabled,
        avatar && styles.withAvatar,
        onDelete && styles.withDelete,
        className,
      )}
      style={
        {
          '--tz-btn-rgb': `var(--tz-color-${color}-rgb)`,
          '--tz-btn-on': `var(--tz-color-${color}-contrast, #fff)`,
          ...style,
        } as CSSProperties
      }
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-disabled={disabled || undefined}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {avatar ? (
        <span className={styles.avatar}>{avatar}</span>
      ) : startIcon ? (
        <span className={styles.startIcon}>{startIcon}</span>
      ) : null}
      {children != null && children !== '' ? <span>{children}</span> : null}
      {onDelete ? (
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={handleDelete}
          onMouseDown={(event) => event.preventDefault()}
          aria-label={deleteLabel}
          tabIndex={deleteTabIndex}
          disabled={disabled}
        >
          {deleteIcon ?? <Icon name="CloseCircle" size={size} />}
        </button>
      ) : null}
    </div>
  )
})
