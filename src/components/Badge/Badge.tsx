import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import type { TechzyColor } from '../../theme'
import styles from './Badge.module.css'

export type BadgePlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color' | 'content'> {
  /** The element the badge decorates — e.g. a `Button` or `IconButton`. */
  children: ReactNode
  /** Count/text shown in the badge. A `number` renders as a count (capped by `max`); omit it for a dot. */
  content?: number | string
  /** Render a small dot instead of `content` (a plain notification indicator). */
  dot?: boolean
  /** Brand palette token that tints the badge. Defaults to `primary`. */
  color?: TechzyColor
  /** Cap for numeric `content` — anything above renders as `${max}+`. Defaults to `99`. */
  max?: number
  /** Keep the badge visible when numeric `content` is `0`. Defaults to `false` (hidden). */
  showZero?: boolean
  /** Corner the badge sits in. Defaults to `top-right`. */
  placement?: BadgePlacement
}

const PLACEMENT: Record<BadgePlacement, string> = {
  'top-right': styles.topRight,
  'top-left': styles.topLeft,
  'bottom-right': styles.bottomRight,
  'bottom-left': styles.bottomLeft,
}

/**
 * Wraps a child (typically a `Button` or `IconButton`) and pins a small badge to one of its corners.
 * Pass a numeric `content` for a count (auto-capped to `${max}+`), or set `dot` for a plain dot.
 * A numeric `0` is hidden unless `showZero`. The fill is tinted by the `color` token via the shared
 * `--tz-btn-rgb` / `--tz-btn-on` pattern; styling is token-only.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    children,
    content,
    dot = false,
    color = 'primary',
    max = 99,
    showZero = false,
    placement = 'top-right',
    className,
    style,
    ...props
  },
  ref,
) {
  const isNumber = typeof content === 'number'
  const hiddenZero = isNumber && content === 0 && !showZero
  const hasContent = content !== undefined && content !== null && content !== '' && !hiddenZero
  const showDot = !hasContent && dot
  const visible = hasContent || showDot
  const display = isNumber && (content as number) > max ? `${max}+` : content

  return (
    <span ref={ref} className={clsx(styles.root, className)} style={style} {...props}>
      {children}
      {visible && (
        <span
          className={clsx(styles.badge, showDot ? styles.dot : styles.value, PLACEMENT[placement])}
          style={
            {
              '--tz-btn-rgb': `var(--tz-color-${color}-rgb)`,
              '--tz-btn-on': `var(--tz-color-${color}-contrast, #fff)`,
            } as CSSProperties
          }
          aria-hidden={showDot ? true : undefined}
        >
          {hasContent ? display : null}
        </span>
      )}
    </span>
  )
})
