import { forwardRef, type SVGProps } from 'react'
import { clsx } from 'clsx'
import { icons } from '../../icons/icons'
import type { IconName } from '../../icons/names'
import type { TechzyColor } from '../../theme'
import styles from './Icon.module.css'

export type IconSize = 'sm' | 'md' | 'lg'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'color' | 'children'> {
  /** Icon to render — see the `IconName` union for the full set. */
  name: IconName
  /** Brand palette token used as the icon color. Defaults to `primary`. */
  color?: TechzyColor
  /** Preset size: `sm` 16px · `md` 20px · `lg` 24px. Defaults to `md`. */
  size?: IconSize
}

/**
 * Renders an inline SVG from the generated icon registry. The icon inherits its
 * color from `color` (a brand token) via `currentColor`; override the preset
 * `size` for one-offs with `style={{ width, height }}`.
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { name, color = 'primary', size = 'md', className, style, ...props },
  ref,
) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={true}
      focusable={false}
      {...props}
      className={clsx(styles.icon, styles[size], className)}
      style={{ color: `var(--tz-color-${color})`, ...style }}
      dangerouslySetInnerHTML={{ __html: icons[name] }}
    />
  )
})
