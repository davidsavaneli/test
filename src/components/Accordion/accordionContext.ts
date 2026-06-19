import { createContext, useContext } from 'react'
import type { AccordionSize } from './Accordion'

/** Shared state an `<Accordion>` hands down to its `<AccordionItem>`s via context. */
export interface AccordionContextValue {
  /** Whether a given item value is currently open. */
  isOpen: (value: string) => boolean
  /** Toggle an item open/closed — called by a header on click. */
  toggle: (value: string) => void
  size: AccordionSize
  disabled: boolean
}

export const AccordionContext = createContext<AccordionContextValue | null>(null)

/** Read the surrounding `<Accordion>`. Throws if an `<AccordionItem>` is used outside one. */
export function useAccordionContext(): AccordionContextValue {
  const ctx = useContext(AccordionContext)
  if (!ctx) throw new Error('AccordionItem must be used within an <Accordion>')
  return ctx
}
