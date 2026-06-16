import { createContext, useContext } from 'react'
import type { TooltipPlacement } from '../Tooltip'

/** Action button size — one step smaller than the dial's FAB. */
export type SpeedDialActionSize = 'sm' | 'md' | 'lg'

/** Shared state a `<SpeedDial>` hands down to its `<SpeedDialAction>` children via context. */
export interface SpeedDialContextValue {
  /** Size for the action FABs. */
  size: SpeedDialActionSize
  /** Where each action's tooltip label sits (derived from the dial `direction`). */
  placement: TooltipPlacement
  /** Close the dial after an action is clicked. */
  closeOnClick: boolean
  /** Show every action's label persistently (no hover needed) while the dial is open. */
  persistentLabels: boolean
  /** Request the dial to close (called by an action on click). */
  requestClose: () => void
}

export const SpeedDialContext = createContext<SpeedDialContextValue | null>(null)

/** Read the surrounding `<SpeedDial>` (or `null` when an action is rendered standalone). */
export function useSpeedDial(): SpeedDialContextValue | null {
  return useContext(SpeedDialContext)
}
