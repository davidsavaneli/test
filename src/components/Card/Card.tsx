import { forwardRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import type { TechzyColor } from '../../theme'
import { ICON_NAMES, type IconName } from '../../icons/names'
import styles from './Card.module.css'

const ICON_NAME_SET = new Set<string>(ICON_NAMES)

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'color'> {
  /** Header title (left, next to the icon). */
  title?: ReactNode
  /** Leading header icon — a known `IconName` or any node. */
  icon?: IconName | ReactNode
  /** Brand color that tints the leading icon box. Defaults to `dark`. */
  color?: TechzyColor
  /** Header actions, placed at the end of the header row (before the collapse toggle). */
  actions?: ReactNode
  /** Footer content (e.g. actions), pinned to the **right** of the footer row. */
  footer?: ReactNode
  /** Footer content pinned to the **left** of the footer row (opposite `footer`). */
  footerStart?: ReactNode
  /** Adds a collapse/expand toggle to the header that folds the body + footer. */
  collapsible?: boolean
  /** Controlled collapsed state. */
  collapsed?: boolean
  /** Initial collapsed state for uncontrolled use. Defaults to `false`. */
  defaultCollapsed?: boolean
  /** Fires with the next collapsed state when the toggle is clicked. */
  onCollapsedChange?: (collapsed: boolean) => void
  /** Card body. */
  children?: ReactNode
}

/**
 * A surface card with an optional header (icon + title + actions), a body, and a footer for actions.
 * `collapsible` adds a chevron that smoothly folds the body + footer (controlled via `collapsed`/
 * `onCollapsedChange`, or uncontrolled via `defaultCollapsed`). Token-only styling.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    title,
    icon,
    color = 'dark',
    actions,
    footer,
    footerStart,
    collapsible = false,
    collapsed,
    defaultCollapsed = false,
    onCollapsedChange,
    className,
    children,
    ...props
  },
  ref,
) {
  const isControlled = collapsed !== undefined
  const [internal, setInternal] = useState(defaultCollapsed)
  const isCollapsed = collapsible && (isControlled ? collapsed! : internal)

  const toggle = () => {
    const next = !isCollapsed
    if (!isControlled) setInternal(next)
    onCollapsedChange?.(next)
  }

  const renderedIcon =
    icon == null ? null : typeof icon === 'string' && ICON_NAME_SET.has(icon) ? (
      <Icon name={icon as IconName} />
    ) : (
      icon
    )

  const hasHeader = title != null || renderedIcon != null || actions != null || collapsible
  const hasBody = children != null && children !== ''
  const hasFooter = footer != null || footerStart != null
  const hasCollapsibleContent = hasBody || hasFooter
  // The header is separated by a divider only while content is visible beneath it.
  const headerDivided = hasCollapsibleContent && !isCollapsed

  return (
    <div
      ref={ref}
      className={clsx(styles.card, isCollapsed && styles.collapsed, className)}
      {...props}
    >
      {hasHeader && (
        <div className={clsx(styles.header, headerDivided && styles.headerDivided)}>
          <div className={styles.headerMain}>
            {renderedIcon != null && (
              <IconButton
                variant="filled"
                size="sm"
                color={color}
                nonClickable
                aria-hidden
                className={styles.icon}
              >
                {renderedIcon}
              </IconButton>
            )}
            {title != null && <div className={styles.title}>{title}</div>}
          </div>
          {(actions != null || collapsible) && (
            <div className={styles.actions}>
              {!isCollapsed && actions}
              {collapsible && (
                <IconButton
                  variant="text"
                  size="sm"
                  aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                  aria-expanded={!isCollapsed}
                  onClick={toggle}
                >
                  <Icon
                    name="ArrowUp3"
                    className={styles.chevron}
                    data-collapsed={isCollapsed ? 'true' : 'false'}
                  />
                </IconButton>
              )}
            </div>
          )}
        </div>
      )}
      {hasCollapsibleContent && (
        <div className={clsx(styles.collapsible, collapsible && styles.foldable)}>
          <div className={styles.collapsibleInner}>
            {hasBody && <div className={styles.body}>{children}</div>}
            {hasFooter && (
              <div className={styles.footer}>
                <div className={styles.footerStart}>{footerStart}</div>
                <div className={styles.footerEnd}>{footer}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})
