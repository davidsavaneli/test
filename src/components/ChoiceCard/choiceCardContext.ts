import { createContext, useContext } from 'react'
import type { ThemeColor } from '../../theme'
import type { ChoiceCardSize } from './ChoiceCard'

/** Shared state a `<ChoiceCardGroup>` hands down to its `<ChoiceCard>` children via context. */
export interface ChoiceCardGroupContextValue {
  /** Shared input `name` — in `exclusive` mode the cards are native radios and must share one. */
  name?: string
  /** Single-selection (radio semantics) vs multiple (checkbox semantics). */
  exclusive: boolean
  /** Whether a card's value is currently selected. */
  isSelected: (value: string) => boolean
  /** Select / toggle a value — called by a child `<ChoiceCard>` on change. */
  toggle: (value: string) => void
  size?: ChoiceCardSize
  color?: ThemeColor
  disabled?: boolean
  error?: boolean
}

export const ChoiceCardGroupContext = createContext<ChoiceCardGroupContextValue | null>(null)

/** Read the surrounding `<ChoiceCardGroup>` so a `<ChoiceCard>` can wire itself in (or `null` when standalone). */
export function useChoiceCardGroupContext(): ChoiceCardGroupContextValue | null {
  return useContext(ChoiceCardGroupContext)
}
