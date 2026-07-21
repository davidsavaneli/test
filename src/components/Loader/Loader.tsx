import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { useT, type ThemeColor } from '../../theme'
import styles from './Loader.module.css'

export type LoaderSize = 'sm' | 'md' | 'lg'

export interface LoaderProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  /** Preset size — matches the Icon sizes: `sm` 14px · `md` 18px · `lg` 22px. Defaults to `md`. */
  size?: LoaderSize
  /** Theme palette token used to color the spinner. Omit to inherit the surrounding text color (`currentColor`). */
  color?: ThemeColor
}

/**
 * A circular spinner. Works standalone as a loading indicator or inside a
 * `Button`, where it inherits the button color via `currentColor` unless an
 * explicit `color` is given.
 */
export const Loader = forwardRef<HTMLSpanElement, LoaderProps>(function Loader(
  { size = 'md', color, className, style, ...props },
  ref,
) {
  const t = useT()
  return (
    <span
      ref={ref}
      role="status"
      aria-label={t('loader.label')}
      {...props}
      className={clsx(styles.loader, styles[size], className)}
      style={color ? ({ color: `var(--tz-color-${color})`, ...style } as CSSProperties) : style}
    />
  )
})
