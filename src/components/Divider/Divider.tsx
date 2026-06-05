import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import styles from './Divider.module.css'

export type DividerOrientation = 'horizontal' | 'vertical'
export type DividerAlign = 'left' | 'center' | 'right'

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  /** Line direction. `horizontal` (default) spans its container; `vertical` is a thin upright rule. */
  orientation?: DividerOrientation
  /** Where the label sits along a horizontal divider. Defaults to `center`. (Ignored without a label.) */
  align?: DividerAlign
  /** Optional title/label rendered in the line (horizontal only). */
  children?: ReactNode
}

/**
 * A separator line. On its own it's a plain rule; pass `children` for a labeled divider
 * (`line — title — line`) positioned by `align` (`left` / `center` / `right`). `orientation="vertical"`
 * renders a thin upright rule (stretches inside a flex row). Token-only styling; `role="separator"`.
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { orientation = 'horizontal', align = 'center', className, children, ...props },
  ref,
) {
  const hasLabel = orientation === 'horizontal' && children != null && children !== ''

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
      className={clsx(
        styles.divider,
        styles[orientation],
        hasLabel && styles.labelled,
        hasLabel && styles[align],
        className,
      )}
      {...props}
    >
      {hasLabel ? <span className={styles.label}>{children}</span> : null}
    </div>
  )
})
