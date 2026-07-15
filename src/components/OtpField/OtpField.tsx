import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { useFormContext } from '../../form/formContext'
import type { ThemeColor } from '../../theme'
import { Typography } from '../Typography'
import fieldStyles from '../TextField/TextField.module.css'
import styles from './OtpField.module.css'

export type OtpFieldSize = 'sm' | 'md' | 'lg'
/** Which characters the code accepts. */
export type OtpFieldType = 'numeric' | 'alphabetic' | 'alphanumeric'

/** Allowed-character matcher per `type`. */
const PATTERN: Record<OtpFieldType, RegExp> = {
  numeric: /[0-9]/,
  alphabetic: /[A-Za-z]/,
  alphanumeric: /[A-Za-z0-9]/,
}

export interface OtpFieldProps {
  /** Number of input boxes (the code length). Defaults to `4`. */
  length?: number
  /** Which characters are accepted (also drives the mobile keyboard). Defaults to `'numeric'`. */
  type?: OtpFieldType
  /** Controlled value — the concatenated code string. */
  value?: string
  /** Initial value for uncontrolled use. */
  defaultValue?: string
  /** Fires with the full code string on every change. */
  onChange?: (value: string) => void
  /** Fires with the code once every box is filled. */
  onComplete?: (value: string) => void
  /** Field name — the `<Form>` binding key (form value is the code `string`). */
  name?: string
  /** Label rendered above the boxes. */
  label?: ReactNode
  /** Helper / error text under the boxes (shown in the error color while `error`). */
  helperText?: ReactNode
  /** Marks the field invalid — reddens the boxes + helper. */
  error?: boolean
  /** Adds a red asterisk after the label. */
  required?: boolean
  /** Disables every box. */
  disabled?: boolean
  /** Focus the first box on mount. */
  autoFocus?: boolean
  /** Placeholder character shown in empty boxes (e.g. `'•'`). */
  placeholder?: string
  /** Preset size. Defaults to `'md'`. */
  size?: OtpFieldSize
  /** Brand palette token for the focus ring / active box. Defaults to `'primary'`. */
  color?: ThemeColor
  className?: string
  style?: CSSProperties
}

/**
 * A one-time-passcode input — a row of single-character boxes for verification codes. **`length`**
 * (default `4`) sets the box count; **`type`** (`'numeric'` default · `'alphabetic'` · `'alphanumeric'`)
 * restricts the accepted characters and the mobile keyboard. Typing advances to the next box, Backspace
 * clears + steps back, Arrows navigate, and **paste / SMS autofill** (`autocomplete="one-time-code"`)
 * distributes the whole code across the boxes. The value is the concatenated string — controlled
 * (`value` + `onChange`) or uncontrolled (`defaultValue`); **`onComplete`** fires when all boxes are
 * filled. Shares the field-family chrome (`label` · `error` + `helperText` · `required` · `disabled` ·
 * `size`) and binds to a surrounding `<Form>` by **`name`** (form value = the code string; validate with
 * e.g. `z.string().length(4)` or a `type`-matching regex). Tinted by `color` via the shared
 * `--tz-btn-rgb` pattern; `role="group"` with per-box `aria-label`s. Own CSS module (+ TextField's for
 * the label/helper chrome).
 */
export const OtpField = forwardRef<HTMLDivElement, OtpFieldProps>(function OtpField(
  {
    length = 4,
    type = 'numeric',
    value,
    defaultValue,
    onChange,
    onComplete,
    name,
    label,
    helperText,
    error,
    required = false,
    disabled = false,
    autoFocus = false,
    placeholder,
    size = 'md',
    color = 'primary',
    className,
    style,
  },
  ref,
) {
  const reactId = useId()
  const helperId = `${reactId}-helper`
  const allowed = PATTERN[type]

  // bind to a surrounding <Form> by `name` — form value is the code string; error/touched via field()
  const form = useFormContext()
  const isFormBound = Boolean(form && name)
  const bound = form && name ? form.field(name) : undefined

  const externalValue =
    value !== undefined ? value : isFormBound ? (form!.values[name!] as string) : undefined
  const isControlled = externalValue !== undefined
  const [internal, setInternal] = useState<string>(defaultValue ?? '')
  const currentValue = isControlled ? (externalValue ?? '') : internal

  const resolvedError = error ?? bound?.error ?? false
  const resolvedHelperText = helperText ?? bound?.helperText

  // the code split into exactly `length` slots (padded with empties)
  const chars = useMemo(() => {
    const arr = [...currentValue].slice(0, length)
    while (arr.length < length) arr.push('')
    return arr
  }, [currentValue, length])

  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const focusBox = (i: number) => {
    const el = inputsRef.current[Math.max(0, Math.min(i, length - 1))]
    el?.focus()
    el?.select()
  }

  const commit = (nextChars: string[]) => {
    const next = nextChars.join('')
    if (!isControlled) setInternal(next)
    if (isFormBound) form!.setValue(name!, next)
    onChange?.(next)
    if (nextChars.every((c) => c !== '')) onComplete?.(next)
  }

  const handleChange = (index: number, raw: string) => {
    const filtered = [...raw].filter((c) => allowed.test(c))
    // a disallowed keystroke (raw non-empty but nothing survives the filter) is ignored
    if (raw !== '' && filtered.length === 0) return
    const nextChars = [...chars]
    if (filtered.length <= 1) {
      // a single typed char (boxes select-on-focus, so this replaces) — or a clear ('')
      nextChars[index] = filtered[0] ?? ''
      commit(nextChars)
      if (filtered[0]) focusBox(index + 1)
    } else {
      // multiple chars (SMS autofill dumps the whole code into one box) → distribute from here
      let k = index
      for (const ch of filtered) {
        if (k >= length) break
        nextChars[k] = ch
        k++
      }
      commit(nextChars)
      focusBox(k)
    }
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      if (chars[index] === '' && index > 0) {
        // empty box → step back and clear the previous one
        event.preventDefault()
        const nextChars = [...chars]
        nextChars[index - 1] = ''
        commit(nextChars)
        focusBox(index - 1)
      }
      // a non-empty box lets the native delete run → onChange fires with '' (stays put)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusBox(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusBox(index + 1)
    } else if (event.key === 'Delete') {
      event.preventDefault()
      const nextChars = [...chars]
      nextChars[index] = ''
      commit(nextChars)
    }
  }

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const filtered = [...event.clipboardData.getData('text')].filter((c) => allowed.test(c))
    if (filtered.length === 0) return
    const nextChars = [...chars]
    let k = index
    for (const ch of filtered) {
      if (k >= length) break
      nextChars[k] = ch
      k++
    }
    commit(nextChars)
    focusBox(k)
  }

  // mark the field touched when focus leaves the whole widget (not when it hops between boxes)
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      bound?.onBlur(event as unknown as FocusEvent<HTMLInputElement>)
    }
  }

  return (
    <div
      ref={ref}
      className={clsx(
        fieldStyles.field,
        resolvedError && fieldStyles.error,
        disabled && fieldStyles.disabled,
        className,
      )}
      style={
        {
          '--tz-btn-rgb': `var(--tz-color-${color}-rgb)`,
          ...style,
        } as CSSProperties
      }
    >
      {label != null && (
        <span className={fieldStyles.label}>
          <Typography as="span" variant="bodySmall" color="muted">
            {label}
          </Typography>
          {required && (
            <span className={fieldStyles.required} aria-hidden="true">
              *
            </span>
          )}
        </span>
      )}

      <div
        role="group"
        aria-label={typeof label === 'string' ? label : 'One-time code'}
        aria-invalid={resolvedError || undefined}
        aria-describedby={resolvedHelperText != null ? helperId : undefined}
        className={clsx(styles.row, styles[size], resolvedError && styles.invalid)}
        onBlur={handleBlur}
      >
        {chars.map((char, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el
            }}
            // the name goes on the first box only, so the form's scroll-to-error can target it
            name={i === 0 ? name : undefined}
            type="text"
            inputMode={type === 'numeric' ? 'numeric' : 'text'}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${i + 1} of ${length}`}
            className={clsx(styles.box, char !== '' && styles.filled)}
            value={char}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>

      {resolvedHelperText != null && (
        <Typography
          as="span"
          id={helperId}
          variant="bodySmall"
          color={resolvedError ? 'error' : 'muted'}
          className={fieldStyles.helper}
        >
          {resolvedHelperText}
        </Typography>
      )}
    </div>
  )
})
