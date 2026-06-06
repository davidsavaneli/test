import {
  forwardRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
import { Icon } from '../Icon'
import { ICON_NAMES, type IconName } from '../../icons/names'
import styles from './Avatar.module.css'

export type AvatarSize = 'sm' | 'md' | 'lg'
export type AvatarShape = 'circle' | 'square'

export interface AvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** Image URL. When set (and it loads), the avatar shows the photo; on error it falls back. */
  src?: string
  /** Alt text for the image / accessible name for an icon-or-initials avatar (falls back to `name`). */
  alt?: string
  /** An icon to show when there's no image — a known `IconName` or any node. */
  icon?: IconName | ReactNode
  /** Full name — used to derive initials (e.g. "David Savaneli" → "DS") and as the accessible name. */
  name?: string
  /** Preset size: `sm` 32 · `md` 40 · `lg` 48 px. Defaults to `md`. */
  size?: AvatarSize
  /** `circle` (default) or `square` (rounded rectangle). */
  shape?: AvatarShape
  /** Brand palette token for the icon/initials background. Defaults to `dark`. */
  color?: ThemeColor
}

const ICON_NAME_SET = new Set<string>(ICON_NAMES)

/** First letters of the first and last word, uppercased — e.g. "David Savaneli" → "DS". */
function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * A user avatar that shows — in priority order — an image (`src`), an `icon`, explicit `children`
 * (e.g. initials `"D.S."`), initials derived from `name`, or a default user icon. If the image fails
 * to load it falls back automatically. The icon/initials background is tinted by `color` via the
 * shared `--tz-btn-rgb` / `--tz-btn-on` pattern. Token-only styling; pairs with `AvatarGroup`.
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  {
    src,
    alt,
    icon,
    name,
    size = 'md',
    shape = 'circle',
    color = 'dark',
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const [imgError, setImgError] = useState(false)
  const showImage = Boolean(src) && !imgError
  const label = alt ?? name

  let fallback: ReactNode
  if (icon !== undefined) {
    fallback =
      typeof icon === 'string' && ICON_NAME_SET.has(icon) ? (
        <Icon name={icon as IconName} size={size} />
      ) : (
        icon
      )
  } else if (children != null && children !== '') {
    fallback = children
  } else if (name) {
    fallback = initialsFromName(name)
  } else {
    fallback = <Icon name="User" size={size} />
  }

  return (
    <div
      ref={ref}
      className={clsx(styles.avatar, styles[size], styles[shape], className)}
      style={
        {
          '--tz-btn-rgb': `var(--tz-color-${color}-rgb)`,
          '--tz-btn-on': `var(--tz-color-${color}-contrast, #fff)`,
          ...style,
        } as CSSProperties
      }
      role={!showImage && label ? 'img' : undefined}
      aria-label={!showImage && label ? label : undefined}
      {...props}
    >
      {showImage ? (
        <img src={src} alt={label ?? ''} className={styles.img} onError={() => setImgError(true)} />
      ) : (
        <span className={styles.fallback} aria-hidden={label ? true : undefined}>
          {fallback}
        </span>
      )}
    </div>
  )
})
