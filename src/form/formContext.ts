import { createContext, useContext } from 'react'
import type { FormApi } from './useForm'

/** The nearest `<Form>`'s form instance, or `null` when not inside one. */
export const FormContext = createContext<FormApi<Record<string, unknown>> | null>(null)

/**
 * Reads the surrounding `<Form>`'s form instance (or `null`). Components like `TextField` use this
 * to auto-bind by `name` — you rarely call it directly.
 */
export function useFormContext(): FormApi<Record<string, unknown>> | null {
  return useContext(FormContext)
}
