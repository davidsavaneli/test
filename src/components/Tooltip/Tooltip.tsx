import {
  cloneElement,
  useId,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
import styles from './Tooltip.module.css'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'content' | 'color'> {
  /** The tooltip text/content shown on hover or focus. Empty content renders no tooltip. */
  content: ReactNode
  /** Which side of the trigger the tooltip appears on. Defaults to `top`. */
  placement?: TooltipPlacement
  /** Theme palette token for the fill (label uses its contrast color). Defaults to `primary`. */
  color?: ThemeColor
  /** A single focusable element to attach the tooltip to (e.g. a `Button` or `IconButton`). */
  children: ReactElement
}

/**
 * Shows a small floating label on hover or keyboard focus of its child, with an arrow pointing at
 * the trigger. Wrap a single element: `<Tooltip content="Save"><IconButton…/></Tooltip>`. Opens on
 * `mouseenter`/`focus`, closes on `mouseleave`/`blur`/`Escape`. The child gets `aria-describedby`
 * while open (the label has `role="tooltip"`). Token-only styling via the shared `--tz-btn-rgb`
 * pattern — `color` (default `primary`) sets the fill and its contrast label, flipping with the theme.
 */
export function Tooltip({
  content,
  placement = 'top',
  color = 'primary',
  children,
  className,
  style,
  onKeyDown,
  ...props
}: TooltipProps) {
  const tooltipId = `${useId()}-tooltip`
  const [open, setOpen] = useState(false)
  const hasContent = content !== null && content !== undefined && content !== ''

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Escape') setOpen(false)
    onKeyDown?.(event)
  }

  if (!hasContent) return children

  return (
    <span
      className={clsx(styles.root, className)}
      style={
        {
          '--tz-btn-rgb': `var(--tz-color-${color}-rgb)`,
          '--tz-btn-on': `var(--tz-color-${color}-contrast, #fff)`,
          ...style,
        } as CSSProperties
      }
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {open
        ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
            'aria-describedby': tooltipId,
          })
        : children}
      <span
        role="tooltip"
        id={tooltipId}
        className={clsx(styles.tooltip, styles[placement])}
        data-open={open ? 'true' : 'false'}
      >
        {content}
        <span className={styles.arrow} aria-hidden="true" />
      </span>
    </span>
  )
}
