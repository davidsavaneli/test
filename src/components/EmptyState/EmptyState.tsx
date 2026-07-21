import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { useT } from '../../theme'
import { Icon } from '../Icon'
import { ICON_NAMES, type IconName } from '../../icons/names'
import styles from './EmptyState.module.css'

export type EmptyStateSize = 'sm' | 'md' | 'lg'

const ICON_NAME_SET = new Set<string>(ICON_NAMES)

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Leading glyph shown in a soft circle — an `IconName`, any node, or `false` to hide it. Defaults to `FolderOpen`. */
  icon?: IconName | ReactNode | false
  /** Heading line. Defaults to `"No Results Found"`. */
  title?: ReactNode
  /** Muted description under the title (e.g. a hint on what to do next). */
  description?: ReactNode
  /** Action slot under the text — e.g. an "Add Item" or "Clear Filters" button. */
  action?: ReactNode
  /** Size — scales the icon, text, and vertical padding. Defaults to `md`. */
  size?: EmptyStateSize
  /**
   * Polished "hero" look: a faded grid backdrop (fades out toward the edges) + an elevated icon
   * (gradient + drop shadow). Defaults to `true`; pass `pattern={false}` for the flat, compact placeholder.
   */
  pattern?: boolean
  /** Extra content rendered below the action. */
  children?: ReactNode
}

/**
 * The empty-state placeholder — drop it in wherever a page, table, list, or gallery has nothing to
 * show (no records yet, no search matches). A centered, muted glyph in a soft circle + a `title` +
 * an optional `description` and `action` (e.g. a "Add Item" / "Clear Filters" button). Neutral by
 * design; pass a custom `icon` node for a tinted glyph. Token-only styling.
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { icon, title, description, action, size = 'md', pattern = true, className, children, ...props },
  ref,
) {
  const t = useT()
  const resolvedTitle = title ?? t('emptyState.title')
  const renderedIcon =
    icon === false ? null : icon == null ? (
      <Icon name="FolderOpen" />
    ) : typeof icon === 'string' && ICON_NAME_SET.has(icon) ? (
      <Icon name={icon as IconName} />
    ) : (
      icon
    )

  return (
    <div
      ref={ref}
      className={clsx(styles.emptyState, styles[size], pattern && styles.pattern, className)}
      {...props}
    >
      {renderedIcon != null && (
        <div className={styles.icon} aria-hidden>
          {renderedIcon}
        </div>
      )}
      {resolvedTitle != null && <div className={styles.title}>{resolvedTitle}</div>}
      {description != null && <div className={styles.description}>{description}</div>}
      {action != null && <div className={styles.action}>{action}</div>}
      {children}
    </div>
  )
})
