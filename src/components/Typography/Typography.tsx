import {
  forwardRef,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
import styles from './Typography.module.css'

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'subtitle'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'uppercase'

export type TypographyAlign = 'left' | 'center' | 'right' | 'justify'

/** Text color: a brand palette token, or the semantic `text` role. Omit to inherit the surrounding color. */
export type TypographyColor = ThemeColor | 'text'

/** Default HTML element rendered for each variant. Override with the `as` prop. */
const variantElement: Record<TypographyVariant, ElementType> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  subtitle: 'h6',
  body: 'p',
  bodySmall: 'p',
  caption: 'span',
  uppercase: 'span',
}

function resolveColor(color?: TypographyColor): string | undefined {
  if (!color) return undefined
  if (color === 'text') return 'var(--tz-color-text)'
  return `var(--tz-color-${color})`
}

export interface TypographyProps extends Omit<HTMLAttributes<HTMLElement>, 'color'> {
  /** Type scale + default element. `h1`–`h4` headings · `subtitle` · `body` (default) · `bodySmall` · `caption` · `uppercase`. */
  variant?: TypographyVariant
  /** Render a different HTML element (or component) than the variant's default — keeps the styling, changes the tag. */
  as?: ElementType
  /** Text color. Omit to inherit the surrounding color. */
  color?: TypographyColor
  /** Horizontal text alignment. */
  align?: TypographyAlign
  /** Clamp to a single line, hiding overflow with an ellipsis. */
  truncate?: boolean
  children?: ReactNode
}

/**
 * Text primitive for the design system. Each `variant` maps to a sensible HTML
 * element and a font size from the `--tz-font-size-*` scale; override the tag
 * with `as` when the semantics differ from the look. Default browser margins are
 * removed. Without a `color` it inherits the surrounding text color, mirroring
 * `Icon` and `Loader`.
 */
export const Typography = forwardRef<HTMLElement, TypographyProps>(function Typography(
  { variant = 'body', as, color, align, truncate = false, className, style, children, ...props },
  ref,
) {
  const Component = (as ?? variantElement[variant]) as ElementType
  const resolvedColor = resolveColor(color)

  return (
    <Component
      ref={ref}
      className={clsx(styles.typography, styles[variant], truncate && styles.truncate, className)}
      style={
        {
          ...(resolvedColor && { color: resolvedColor }),
          ...(align && { textAlign: align }),
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      {children}
    </Component>
  )
})
