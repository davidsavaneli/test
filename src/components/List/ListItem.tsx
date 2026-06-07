import {
  forwardRef,
  type AnchorHTMLAttributes,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { Icon } from '../Icon'
import type { ThemeColor } from '../../theme'
import { ICON_NAMES, type IconName } from '../../icons/names'
import { useListSize } from './listContext'
import styles from './List.module.css'

const ICON_NAME_SET = new Set<string>(ICON_NAMES)

export type ListItemSize = 'sm' | 'md' | 'lg'

/** Leading `<Icon>` size per row size. */
const ICON_SIZE: Record<ListItemSize, 'sm' | 'md'> = { sm: 'sm', md: 'md', lg: 'md' }

export interface ListItemProps
  extends
    Omit<HTMLAttributes<HTMLElement>, 'color'>,
    Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel' | 'download'> {
  /** Leading element — a known `IconName` (rendered as `<Icon>`) or any node (e.g. an `Avatar`). */
  icon?: IconName | ReactNode
  /** Secondary muted line shown under the label. */
  description?: ReactNode
  /** Trailing content pinned to the right (icon, `Badge`, shortcut text, chevron, …). */
  trailing?: ReactNode
  /** Highlights the row as selected/active (menu selection, current nav route). */
  selected?: boolean
  /** Makes the row interactive (hover + cursor; adds `role`/`tabIndex`/keyboard when rendered plain). */
  clickable?: boolean
  /** Dims and inerts the row. */
  disabled?: boolean
  /** Row size — height / padding / font. Defaults to `md`. */
  size?: ListItemSize
  /** Brand color for the selected tint and clickable hover. Defaults to `primary`. */
  color?: ThemeColor
  /** Render a different element/component — e.g. `'a'`, `'button'`, or a router `Link`. Defaults to `div`. */
  as?: ElementType
  /** Primary label / content. */
  children?: ReactNode
}

/**
 * A flexible, reusable list row: leading `icon`, a label (`children`) with optional `description`, and
 * a `trailing` slot. `clickable` turns it interactive (hover + keyboard when rendered as a plain
 * element), `selected` highlights it, `disabled` inerts it. Render as a link/button/router `Link` via
 * `as`. Designed to compose inside `List` — for menus, the sidebar, or a standalone styled list.
 */
export const ListItem = forwardRef<HTMLElement, ListItemProps>(function ListItem(
  {
    icon,
    description,
    trailing,
    selected = false,
    clickable = false,
    disabled = false,
    size: sizeProp,
    color = 'primary',
    as,
    className,
    style,
    children,
    onClick,
    onKeyDown,
    ...props
  },
  ref,
) {
  // an explicit `size` wins; otherwise inherit a surrounding `List`'s size, falling back to `md`
  const listSize = useListSize()
  const size = sizeProp ?? listSize ?? 'md'
  const Component = (as ?? 'div') as ElementType
  // Anchors, buttons, and custom components (e.g. a router Link) carry their own click + keyboard
  // semantics — only a plain element needs the button role/tabIndex/Enter-Space shim.
  const handlesOwnInteraction =
    as === 'a' || as === 'button' || typeof as === 'function' || typeof as === 'object'
  const isDivButton = clickable && !handlesOwnInteraction

  const renderedIcon =
    icon == null ? null : typeof icon === 'string' && ICON_NAME_SET.has(icon) ? (
      <Icon name={icon as IconName} size={ICON_SIZE[size]} />
    ) : (
      icon
    )

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (isDivButton && !disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      event.currentTarget.click()
    }
    onKeyDown?.(event)
  }

  return (
    <Component
      ref={ref}
      className={clsx(
        styles.item,
        styles[size],
        selected && styles.selected,
        clickable && styles.clickable,
        disabled && styles.disabled,
        className,
      )}
      style={{ '--tz-btn-rgb': `var(--tz-color-${color}-rgb)`, ...style } as CSSProperties}
      role={isDivButton ? 'button' : undefined}
      tabIndex={isDivButton ? (disabled ? -1 : 0) : undefined}
      aria-disabled={disabled || undefined}
      aria-current={selected || undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={clickable ? handleKeyDown : onKeyDown}
      {...props}
    >
      {renderedIcon != null && <span className={styles.itemIcon}>{renderedIcon}</span>}
      {(children != null || description != null) && (
        <span className={styles.itemText}>
          {children != null && <span className={styles.itemLabel}>{children}</span>}
          {description != null && <span className={styles.itemDescription}>{description}</span>}
        </span>
      )}
      {trailing != null && <span className={styles.itemTrailing}>{trailing}</span>}
    </Component>
  )
})
