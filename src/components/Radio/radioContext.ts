import { createContext, useContext } from 'react'
import type { ThemeColor } from '../../theme'
import type { RadioSize } from './Radio'

/** Shared state a `<RadioGroup>` hands down to its `<Radio>` children via context. */
export interface RadioGroupContextValue {
  /** Shared input `name` (the radios in a group must share one). */
  name?: string
  /** The group's currently-selected value. */
  value?: string
  /** Select a value — called by a child `<Radio>` on change. */
  onChange: (value: string) => void
  size?: RadioSize
  color?: ThemeColor
  disabled?: boolean
  error?: boolean
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

/** Read the surrounding `<RadioGroup>` so a `<Radio>` can wire itself in (or `null` when standalone). */
export function useRadioGroupContext(): RadioGroupContextValue | null {
  return useContext(RadioGroupContext)
}
