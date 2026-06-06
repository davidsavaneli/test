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
  /** Brand palette token used as the icon color. Omit to inherit the surrounding text color (`currentColor`). */
  color?: TechzyColor
  /** Preset size: `sm` 16px · `md` 18px · `lg` 22px. Defaults to `md`. */
  size?: IconSize
}

/**
 * Renders an inline SVG from the generated icon registry. With a `color` token
 * the icon takes that brand color; without one it inherits the surrounding text
 * color via `currentColor` (so it adapts inside a `Button`). Override the preset
 * `size` for one-offs with `style={{ width, height }}`.
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { name, color, size = 'md', className, style, ...props },
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
      style={color ? { color: `var(--tz-color-${color})`, ...style } : style}
      dangerouslySetInnerHTML={{ __html: icons[name] }}
    />
  )
})
