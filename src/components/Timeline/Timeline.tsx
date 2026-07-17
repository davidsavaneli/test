import { forwardRef, type CSSProperties, type OlHTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
import type { IconName } from '../../icons/names'
import { TimelineItem } from './TimelineItem'
import { TimelineContext, type TimelineContextValue } from './timelineContext'
import styles from './Timeline.module.css'

export type TimelineSize = 'sm' | 'md' | 'lg'

/** A single entry for the data-driven `items` prop. */
export interface TimelineEntry {
  /** Title line. */
  label?: ReactNode
  /** Muted caption under the label — usually the date/time. */
  time?: ReactNode
  /** Body content under the caption — any node. */
  content?: ReactNode
  /** Node icon (soft tinted circle) — a known `IconName` or any node. Omit for a small dot node. */
  icon?: IconName | ReactNode
  /** Theme palette token tinting this entry's node (overrides the timeline's `color`). */
  color?: ThemeColor
}

export interface TimelineProps extends Omit<OlHTMLAttributes<HTMLOListElement>, 'color'> {
  /** Data-driven entries — an alternative to passing `<TimelineItem>` children. */
  items?: TimelineEntry[]
  /** Preset size — node circle, dot and fonts. Defaults to `md`. */
  size?: TimelineSize
  /** Theme palette token tinting the nodes. Defaults to `primary` (a per-item `color` wins). */
  color?: ThemeColor
  /** `<TimelineItem>` children (used when `items` is not given). */
  children?: ReactNode
}

/**
 * A vertical timeline — events on a rail (order tracking, activity feeds, audit logs). Data-driven via
 * **`items`** (`{ label?, time?, content?, icon?, color? }[]`) or as `<TimelineItem>` children. An
 * entry **with** an `icon` gets a soft tinted circle node; one **without** gets a small dot — mix them
 * freely, and tint any node per item via its `color` (e.g. `success` for a completed event). `size`
 * (`sm`/`md`/`lg`) scales the nodes and type together. Renders a semantic `<ol>`/`<li>` list (name it
 * with `aria-label`); the rail is a hairline that hides itself after the last entry. Styling uses
 * `--tz-*` tokens.
 */
export const Timeline = forwardRef<HTMLOListElement, TimelineProps>(function Timeline(
  { items, size = 'md', color = 'primary', children, className, style, ...props },
  ref,
) {
  const ctx: TimelineContextValue = { size, color }

  return (
    <ol
      ref={ref}
      className={clsx(styles.root, className)}
      style={style as CSSProperties}
      {...props}
    >
      <TimelineContext.Provider value={ctx}>
        {items
          ? items.map((item, i) => (
              <TimelineItem
                key={i}
                label={item.label}
                time={item.time}
                icon={item.icon}
                color={item.color}
              >
                {item.content}
              </TimelineItem>
            ))
          : children}
      </TimelineContext.Provider>
    </ol>
  )
})
