import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FocusEvent,
  type FormEvent,
  type SetStateAction,
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
  handleSubmit: (event?: FormEvent) => void
}

/** Runs the schema and reduces Zod issues to a `{ field: firstMessage }` map. */
function collectErrors(schema: ZodType, values: unknown): Record<string, string> {
  const result = schema.safeParse(values)
  if (result.success) return {}
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '')
    if (key && !(key in errors)) errors[key] = issue.message // keep the first issue per field
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
}: UseFormOptions<S>): FormApi<TypeOf<S>> {
  type Values = TypeOf<S>

  const [values, setValues] = useState<Values>(defaultValues)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
          if (mode !== 'change') setTouched((prev) => ({ ...prev, [name]: true }))
        },
        error: isShown(name) && Boolean(errors[name]),
        helperText: isShown(name) ? errors[name] : undefined,
      }
    },
    [values, errors, isShown, setValue, mode],
  )

  const reset = useCallback(
    (next?: Values) => {
      setValues(next ?? defaultValues)
      setTouched({})
      setSubmitted(false)
    },
    [defaultValues],
  )

  const handleSubmit = useCallback(
    (event?: FormEvent) => {
      event?.preventDefault()
      setSubmitted(true)

      const result = schema.safeParse(values)
      if (!result.success) return // errors are derived + now shown (submitted)

      const outcome = onSubmit?.(result.data as Values, { reset, setValue, setValues })
      if (outcome instanceof Promise) {
        setIsSubmitting(true)
        void outcome.finally(() => setIsSubmitting(false))
      }
    },
    [schema, values, onSubmit, reset, setValue],
  )

  return {
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
  }
}
