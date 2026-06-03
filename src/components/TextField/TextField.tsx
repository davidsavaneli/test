import {
  forwardRef,
  useId,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { IconButton } from '../IconButton'
import { Typography } from '../Typography'
import styles from './TextField.module.css'

export type TextFieldSize = 'sm' | 'md' | 'lg'
export type TextFieldAdornmentPosition = 'left' | 'right'

/** Mask token → matcher. Any other character in a mask is treated as a literal. */
const MASK_TOKENS: Record<string, RegExp> = {
  9: /[0-9]/, // digit
  a: /[A-Za-z]/, // letter
  '*': /[A-Za-z0-9]/, // alphanumeric
}

/** Formats `raw` against `mask` (`9` digit · `a` letter · `*` alphanumeric · everything else literal). */
function applyMask(raw: string, mask: string): string {
  let out = ''
  let i = 0
  for (const m of mask) {
    const token = MASK_TOKENS[m]
    if (token) {
      while (i < raw.length && !token.test(raw[i])) i++ // skip chars that don't fit this slot
      if (i >= raw.length) break
      out += raw[i]
      i++
    } else {
      if (i >= raw.length) break // don't show a trailing literal until there's more input
      if (raw[i] === m) i++ // consume an already-present literal so it isn't re-read
      out += m
    }
  }
  return out
}

/** Drops the mask's literal characters, leaving only the data the user actually entered. */
function stripMaskLiterals(value: string, mask: string): string {
  const literals = new Set([...mask].filter((c) => !MASK_TOKENS[c]))
  return [...value].filter((c) => !literals.has(c)).join('')
}

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'prefix'
> {
  /** Label rendered above the field. */
  label?: ReactNode
  /** Preset size — drives the control height (`--tz-control-height-*`), font size and padding. */
  size?: TextFieldSize
  /** Marks the field invalid: red border/focus ring and the `helperText` shown in the error color. */
  error?: boolean
  /** Helper / validation text under the field. Adopts the error color while `error`. */
  helperText?: ReactNode
  /** Adds a red asterisk after the label (visual hint only — combine with native `required` if needed). */
  required?: boolean
  /** Stretches the field to fill its container width. */
  fullWidth?: boolean
  /**
   * Content shown inside the field. A **string/number** renders as a muted prefix/suffix
   * (e.g. `"https://"`, `"$"`, `"kg"`); any other node renders as an icon (typically an `<Icon />`)
   * inside a square `IconButton` box.
   */
  adornment?: ReactNode
  /** Which side the adornment sits on. Defaults to `left`. */
  adornmentPosition?: TextFieldAdornmentPosition
  /** Makes an icon adornment a clickable `IconButton` and fires this on click (ignored for string adornments). */
  onAdornmentClick?: (event: MouseEvent<HTMLButtonElement>) => void
  /** Accessible label for the clickable icon adornment (used when `onAdornmentClick` is set). Defaults to `"Field action"`. */
  adornmentLabel?: string
  /** Allowed-input filter: a change whose value fails this pattern is rejected (e.g. `/^\d*$/` for digits only). */
  regex?: RegExp
  /** Input mask, e.g. `"(999) 999-9999"` (`9` digit · `a` letter · `*` alphanumeric · other chars literal). Emits the masked value. */
  mask?: string
}

/**
 * A labeled text input. Renders an optional label and helper/validation text, an
 * error state (red border + helper), and an optional `adornment` on either side —
 * a string prefix/suffix (e.g. `"https://"`) or an icon, which can be made
 * interactive via `onAdornmentClick`. Supports an allowed-input `regex` filter and
 * a formatting `mask`. Works controlled (`value` + `onChange`) or uncontrolled
 * (`defaultValue`); when a `mask` is set, `onChange` emits the masked value.
 * Styling comes entirely from `--tz-*` tokens.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    size = 'md',
    error = false,
    helperText,
    required = false,
    fullWidth = false,
    adornment,
    adornmentPosition = 'left',
    onAdornmentClick,
    adornmentLabel = 'Field action',
    regex,
    mask,
    value,
    defaultValue,
    onChange,
    disabled = false,
    id: idProp,
    className,
    style,
    ...props
  },
  ref,
) {
  const reactId = useId()
  const id = idProp ?? reactId
  const helperId = `${id}-helper`

  const isControlled = value !== undefined
  const [internal, setInternal] = useState<string>(defaultValue != null ? String(defaultValue) : '')
  const currentValue = isControlled ? value : internal

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    let next = event.target.value
    if (mask) next = applyMask(next, mask)
    if (regex) {
      const candidate = mask ? stripMaskLiterals(next, mask) : next
      if (!regex.test(candidate)) return // reject the change, leaving the value unchanged
    }
    if (!isControlled) setInternal(next)
    if (onChange) {
      event.target.value = next // hand the consumer the masked/filtered value
      onChange(event)
    }
  }

  const hasAdornment = adornment != null && adornment !== false
  const isTextAdornment = typeof adornment === 'string' || typeof adornment === 'number'

  let adornmentNode: ReactNode = null
  if (hasAdornment) {
    if (isTextAdornment) {
      adornmentNode = <span className={styles.textAdornment}>{adornment}</span>
    } else if (onAdornmentClick) {
      adornmentNode = (
        <IconButton
          variant="text"
          size={size}
          disabled={disabled}
          aria-label={adornmentLabel}
          onClick={onAdornmentClick}
          className={styles.iconButton}
        >
          {adornment}
        </IconButton>
      )
    } else {
      // Decorative icon: same IconButton box (so it sizes identically to the clickable one),
      // but non-interactive and hidden from the a11y tree.
      adornmentNode = (
        <IconButton
          variant="text"
          size={size}
          disabled={disabled}
          nonClickable
          aria-hidden="true"
          className={styles.iconButton}
        >
          {adornment}
        </IconButton>
      )
    }
  }

  return (
    <div
      className={clsx(
        styles.field,
        styles[size],
        fullWidth && styles.fullWidth,
        error && styles.error,
        disabled && styles.disabled,
        className,
      )}
      style={style as CSSProperties}
    >
      {label != null && (
        <label htmlFor={id} className={styles.label}>
          <Typography as="span" variant="bodySmall" color="tertiary">
            {label}
          </Typography>
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div
        className={clsx(
          styles.control,
          hasAdornment && adornmentPosition === 'left' && styles.hasLeftAdornment,
          hasAdornment && adornmentPosition === 'right' && styles.hasRightAdornment,
        )}
      >
        {adornmentPosition === 'left' && adornmentNode}
        <input
          ref={ref}
          id={id}
          className={styles.input}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={error || undefined}
          aria-describedby={helperText != null ? helperId : undefined}
          {...props}
        />
        {adornmentPosition === 'right' && adornmentNode}
      </div>

      {helperText != null && (
        <Typography
          as="span"
          id={helperId}
          variant="bodySmall"
          color={error ? 'error' : 'tertiary'}
          className={styles.helper}
        >
          {helperText}
        </Typography>
      )}
    </div>
  )
})
