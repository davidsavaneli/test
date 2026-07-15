import { createContext, useContext } from 'react'
import type { ThemeColor } from '../../theme'
import type { TimelineSize } from './Timeline'

/** Shared defaults a `<Timeline>` hands down to its `<TimelineItem>` children via context. */
export interface TimelineContextValue {
  size: TimelineSize
  color: ThemeColor
}

export const TimelineContext = createContext<TimelineContextValue | null>(null)

/** Read the surrounding `<Timeline>` so a `<TimelineItem>` can inherit its `size`/`color`. */
export function useTimelineContext(): TimelineContextValue | null {
  return useContext(TimelineContext)
}
