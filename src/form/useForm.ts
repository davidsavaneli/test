import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FocusEvent,
  type SetStateAction,
  type SyntheticEvent,
} from 'react'
import type { TypeOf, ZodType } from 'zod'

/**
 * When validation errors start showing for a field:
 * - `blurThenLive` (default) — after the field is blurred (or the form is submitted), then live on every change.
 * - `change` — from the very first keystroke.
 * - `submit` — only after a submit attempt.
 */
export type FormValidationMode = 'blurThenLive' | 'change' | 'submit'

export interface UseFormOptions<S extends ZodType> {
  /** Zod schema describing the whole form. Field names match the schema's top-level keys. */
  schema: S
  /** Initial values — the controlled source of truth for every field. */
  defaultValues: TypeOf<S>
  /**
   * Called with the parsed (schema-validated) values when a submit passes validation. The second
   * argument carries helpers — e.g. `reset` to clear the form on success: `(values, { reset }) => {…}`.
   */
  onSubmit?: (values: TypeOf<S>, helpers: FormHelpers<TypeOf<S>>) => void | Promise<void>
  /** When errors begin to show per field. Defaults to `blurThenLive`. */
  mode?: FormValidationMode
  /**
   * On a failed submit, smooth-scroll to (and focus) the first invalid field — the one that sits
   * **highest** on the page. Needs the submit event's form element (works with `<Form>` or any
   * `<form onSubmit={form.handleSubmit}>`). Defaults to `true`.
   */
  scrollToError?: boolean
}

/** Helpers handed to `onSubmit` (Formik-style), so you can clear or tweak the form on success. */
export interface FormHelpers<Values> {
  /** Reset to `defaultValues` (or the given values), clearing touched/submitted state. */
  reset: (next?: Values) => void
  /** Set one field's value. */
  setValue: <K extends keyof Values & string>(name: K, value: Values[K]) => void
  /** Replace all values. */
  setValues: Dispatch<SetStateAction<Values>>
}

/** Props returned by `field(name)` — spread directly onto a `<TextField />`. */
export interface FieldProps {
  name: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur: (event: FocusEvent<HTMLInputElement>) => void
  error: boolean
  helperText?: string
}

/** Everything `useForm` returns — also the value carried by `<Form>`'s context. */
export interface FormApi<Values> {
  /** Current form values. */
  values: Values
  /** `{ field: firstErrorMessage }` for every invalid field (regardless of visibility). */
  errors: Record<string, string>
  /** Which fields have been blurred. */
  touched: Record<string, boolean>
  /** True when the whole form passes the schema. */
  isValid: boolean
  /** True once a submit has been attempted. */
  isSubmitted: boolean
  /** Number of submit attempts (increments on every `handleSubmit`) — watch it to react to each submit. */
  submitCount: number
  /** True while an async `onSubmit` is in flight. */
  isSubmitting: boolean
  /** Spread onto a `<TextField />` (or let `<Form>` + a `name` prop wire it for you). */
  field: (name: keyof Values & string) => FieldProps
  /** Imperatively set one field's value. */
  setValue: <K extends keyof Values & string>(name: K, value: Values[K]) => void
  /** Replace all values. */
  setValues: Dispatch<SetStateAction<Values>>
  /** Reset to `defaultValues` (or the given values) and clear touched/submitted state. */
  reset: (next?: Values) => void
  /** Form `onSubmit` handler — validates, then calls `onSubmit` with parsed values when valid. */
  handleSubmit: (event?: SyntheticEvent) => void
}

/**
 * Smooth-scroll to (and focus) the highest invalid field inside `scope`, matched by its `name`
 * attribute. "Highest" = smallest viewport `top`, so it lands on the first red field regardless of
 * DOM vs. visual order. No-op if none of the names resolve to an element.
 */
function scrollToFirstError(scope: Element, names: string[]) {
  let target: HTMLElement | null = null
  let top = Number.POSITIVE_INFINITY
  for (const name of names) {
    const selector = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(name) : name
    const el = scope.querySelector<HTMLElement>(`[name="${selector}"]`)
    if (!el) continue
    const elTop = el.getBoundingClientRect().top
    if (elTop < top) {
      top = elTop
      target = el
    }
  }
  if (!target) return
  if (typeof target.scrollIntoView === 'function') {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  target.focus({ preventScroll: true })
}

/** Runs the schema and reduces Zod issues to a `{ field: firstMessage }` map. */
function collectErrors(schema: ZodType, values: unknown): Record<string, string> {
  const result = schema.safeParse(values)
  if (result.success) return {}
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    // path-less issues (a root `.refine()` / `.superRefine()`, e.g. password-confirm) land under a
    // reserved `_form` key so `isValid` reflects them and the message is surfaceable — instead of
    // being silently dropped (which made the form look valid while submit no-op'd).
    const key = String(issue.path[0] ?? '_form')
    if (!(key in errors)) errors[key] = issue.message // keep the first issue per field
  }
  return errors
}

/**
 * A tiny, Zod-powered form helper — the dependency-light alternative to bundling Formik in
 * every app. Give it a schema and initial values; spread `field(name)` onto a `<TextField />`
 * and it wires up `value`/`onChange`/`onBlur` and surfaces the field's validation error as
 * `error` + `helperText`. Validation follows `mode` (default: validate on blur, then live).
 * `handleSubmit` validates the whole form and calls `onSubmit` with the parsed values only when valid.
 */
export function useForm<S extends ZodType>({
  schema,
  defaultValues,
  onSubmit,
  mode = 'blurThenLive',
  scrollToError = true,
}: UseFormOptions<S>): FormApi<TypeOf<S>> {
  type Values = TypeOf<S>

  const [values, setValues] = useState<Values>(defaultValues)
  // hold the initial values in a first-render ref so `reset`'s identity doesn't churn when the caller
  // passes an inline `defaultValues` literal (a fresh object every render)
  const defaultValuesRef = useRef(defaultValues)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitCount, setSubmitCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // synchronous re-entrancy guard — blocks a double-click before the `isSubmitting` re-render lands
  const submittingRef = useRef(false)

  const errors = useMemo(() => collectErrors(schema, values), [schema, values])
  const isValid = Object.keys(errors).length === 0

  /** Whether a field's error should currently be visible, per the chosen mode. */
  const isShown = useCallback(
    (name: string) => {
      if (mode === 'change') return true
      if (mode === 'submit') return submitted
      return submitted || touched[name] === true // blurThenLive
    },
    [mode, submitted, touched],
  )

  const setValue = useCallback(<K extends keyof Values & string>(name: K, value: Values[K]) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  const field = useCallback(
    (name: keyof Values & string): FieldProps => {
      const raw = values[name]
      return {
        name,
        value: raw == null ? '' : String(raw),
        onChange: (event) => setValue(name, event.target.value as Values[typeof name]),
        onBlur: () => {
          // always record touched (so `FormApi.touched` is accurate in every mode); when a field's
          // error becomes *visible* is governed separately by `isShown`/`mode`
          setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }))
        },
        error: isShown(name) && Boolean(errors[name]),
        helperText: isShown(name) ? errors[name] : undefined,
      }
    },
    [values, errors, isShown, setValue, mode],
  )

  const reset = useCallback((next?: Values) => {
    setValues(next ?? defaultValuesRef.current)
    setTouched({})
    setSubmitted(false)
    setSubmitCount(0)
  }, [])

  const handleSubmit = useCallback(
    (event?: SyntheticEvent) => {
      event?.preventDefault()
      if (submittingRef.current) return // ignore re-entrant submits while an async onSubmit is in flight
      setSubmitted(true)
      setSubmitCount((c) => c + 1)

      const result = schema.safeParse(values)
      if (!result.success) {
        // errors are derived + now shown (submitted); jump to the first red field if we have the form
        const scope = event?.currentTarget
        if (scrollToError && scope instanceof Element) {
          const names = result.error.issues
            .map((issue) => String(issue.path[0] ?? ''))
            .filter(Boolean)
          scrollToFirstError(scope, names)
        }
        return
      }

      const outcome = onSubmit?.(result.data as Values, { reset, setValue, setValues })
      if (outcome instanceof Promise) {
        submittingRef.current = true
        setIsSubmitting(true)
        const done = () => {
          submittingRef.current = false
          setIsSubmitting(false)
        }
        // clear on resolve OR reject — `.then(done, done)` also marks the rejection handled
        // (a bare `.finally` would re-throw into a discarded chain → unhandled promise rejection)
        outcome.then(done, done)
      }
    },
    [schema, values, onSubmit, reset, setValue, scrollToError],
  )

  // memoized so `<Form>` (which feeds this straight into context) doesn't re-render every bound field
  // on each render of the form-owning component — only when a real piece of state/identity changes
  return useMemo(
    () => ({
      /** Current form values. */
      values,
      /** `{ field: firstErrorMessage }` for every invalid field (regardless of visibility). */
      errors,
      /** Which fields have been blurred. */
      touched,
      /** True when the whole form passes the schema. */
      isValid,
      /** True once a submit has been attempted. */
      isSubmitted: submitted,
      /** Number of submit attempts (increments on every `handleSubmit`). */
      submitCount,
      /** True while an async `onSubmit` is in flight. */
      isSubmitting,
      /** Spread onto a `<TextField />`: wires value/onChange/onBlur and shows the field's error. */
      field,
      /** Imperatively set one field's value. */
      setValue,
      /** Replace all values. */
      setValues,
      /** Reset to `defaultValues` (or the given values) and clear touched/submitted state. */
      reset,
      /** Form `onSubmit` handler — validates, then calls `onSubmit` with parsed values when valid. */
      handleSubmit,
    }),
    [
      values,
      errors,
      touched,
      isValid,
      submitted,
      submitCount,
      isSubmitting,
      field,
      setValue,
      setValues,
      reset,
      handleSubmit,
    ],
  )
}
