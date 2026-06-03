import type { FormHTMLAttributes, ReactNode } from 'react'
import { FormContext } from './formContext'
import type { FormApi } from './useForm'

export interface FormProps<Values> extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  /** A form instance from `useForm()`. Provides validation + binding to nested fields by `name`. */
  form: FormApi<Values>
  children?: ReactNode
}

/**
 * Wraps a form: renders a native `<form>` wired to `form.handleSubmit` and shares the instance via
 * context so nested controls auto-bind by `name` (e.g. `<TextField name="email" />`) — no need to
 * spread `{...form.field('email')}`. `noValidate` is set so the browser's native validation UI
 * stays out of the way of the schema-driven errors.
 */
export function Form<Values>({ form, children, ...props }: FormProps<Values>) {
  return (
    <form noValidate {...props} onSubmit={form.handleSubmit}>
      <FormContext.Provider value={form as unknown as FormApi<Record<string, unknown>>}>
        {children}
      </FormContext.Provider>
    </form>
  )
}
