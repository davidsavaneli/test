import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
import { Avatar, type AvatarProps, type AvatarSize } from './Avatar'
import styles from './Avatar.module.css'

export interface AvatarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** `Avatar` elements to overlap. */
  children: ReactNode
  /** Show at most this many slots; the rest collapse into a trailing `+N` avatar. */
  max?: number
  /** Size applied to every avatar in the group (incl. the `+N`). Defaults to `md`. */
  size?: AvatarSize
  /** Brand palette token for the `+N` surplus avatar. Defaults to `medium`. */
  color?: ThemeColor
}

const OVERLAP: Record<AvatarSize, string> = { sm: '-6px', md: '-8px', lg: '-10px' }

/**
 * Overlaps a row of `Avatar`s with a ring between them, and collapses the overflow past `max` into a
 * trailing `+N` avatar (like a stacked team list). All avatars are normalized to the group's `size`.
 * Token-only styling.
 */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
  { children, max, size = 'md', color = 'brand', className, style, ...props },
  ref,
) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarProps>[]
  const total = items.length
  const limit = max && max > 0 && total > max ? max - 1 : total
  const shown = items.slice(0, limit)
  const surplus = total - shown.length

  return (
    <div
      ref={ref}
      className={clsx(styles.group, className)}
      style={{ '--avatar-overlap': OVERLAP[size], ...style } as CSSProperties}
      {...props}
    >
      {shown.map((child, index) =>
        cloneElement(child, {
          size,
          className: clsx(styles.item, child.props.className),
          style: { zIndex: total - index, ...child.props.style } as CSSProperties,
        }),
      )}
      {surplus > 0 && (
        <Avatar size={size} color={color} className={styles.item} style={{ zIndex: 0 }}>
          +{surplus}
        </Avatar>
      )}
    </div>
  )
})
