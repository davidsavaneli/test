import { forwardRef, type CSSProperties, type LiHTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
import { ICON_NAMES, type IconName } from '../../icons/names'
import { Icon } from '../Icon'
import { useTimelineContext } from './timelineContext'
import styles from './Timeline.module.css'

const ICON_NAME_SET = new Set<string>(ICON_NAMES)

export interface TimelineItemProps extends Omit<LiHTMLAttributes<HTMLLIElement>, 'color'> {
  /** Title line. */
  label?: ReactNode
  /** Muted caption under the label — usually the date/time (e.g. `"13th May 2021"`). */
  time?: ReactNode
  /** Body content under the caption — any node (text, chips, buttons). */
  children?: ReactNode
  /**
   * Node icon — a known `IconName` or any node, shown in a soft tinted circle. Omit for a small
   * **dot** node instead (the compact activity-log look).
   */
  icon?: IconName | ReactNode
  /** Theme palette token tinting this item's node. Inherits the timeline's `color` when omitted. */
  color?: ThemeColor
}

/**
 * One entry on a `<Timeline>` — a node (a soft tinted icon circle, or a small dot when there's no
 * `icon`) on the rail, with a `label`, a muted `time` caption, and any `children` as the body.
 * Inherits `size`/`color` from the surrounding `<Timeline>` (a per-item `color` wins — e.g. a green
 * `success` node for a delivered step). Renders an `<li>`; the connecting rail hides itself on the
 * last item via CSS.
 */
export const TimelineItem = forwardRef<HTMLLIElement, TimelineItemProps>(function TimelineItem(
  { label, time, children, icon, color, className, style, ...props },
  ref,
) {
  const timeline = useTimelineContext()
  const resolvedSize = timeline?.size ?? 'md'
  const resolvedColor = color ?? timeline?.color ?? 'primary'

  const iconNode =
    typeof icon === 'string' && ICON_NAME_SET.has(icon) ? (
      <Icon name={icon as IconName} size={resolvedSize} />
    ) : (
      icon
    )

  return (
    <li
      ref={ref}
      className={clsx(styles.item, styles[resolvedSize], className)}
      style={{ '--tl-rgb': `var(--tz-color-${resolvedColor}-rgb)`, ...style } as CSSProperties}
      {...props}
    >
      {/* the node — an icon circle, or a small dot when there's no icon */}
      <span className={clsx(styles.node, icon == null && styles.dotNode)} aria-hidden="true">
        {icon != null ? iconNode : <span className={styles.dot} />}
      </span>
      {/* the rail segment down to the next node — hidden on the last item via :last-child */}
      <span className={styles.connector} aria-hidden="true" />
      <div className={styles.body}>
        {label != null && <span className={styles.label}>{label}</span>}
        {time != null && <span className={styles.time}>{time}</span>}
        {children != null && <div className={styles.content}>{children}</div>}
      </div>
    </li>
  )
})
