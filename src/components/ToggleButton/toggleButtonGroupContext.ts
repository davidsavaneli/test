import { createContext, useContext } from 'react'
import type { ThemeColor } from '../../theme'
import type { ToggleButtonSize } from './ToggleButton'

/** Shared state a `<ToggleButtonGroup>` hands down to its `<ToggleButton>` children via context. */
export interface ToggleButtonGroupContextValue {
  /** Whether a given button value is currently selected. */
  isSelected: (value: string) => boolean
  /** Toggle a button value — called by a child on click. */
  toggle: (value: string) => void
  size?: ToggleButtonSize
  color?: ThemeColor
  disabled?: boolean
  fullWidth?: boolean
}

export const ToggleButtonGroupContext = createContext<ToggleButtonGroupContextValue | null>(null)

/** Read the surrounding `<ToggleButtonGroup>` (or `null` when a `<ToggleButton>` is standalone). */
export function useToggleButtonGroup(): ToggleButtonGroupContextValue | null {
  return useContext(ToggleButtonGroupContext)
}
