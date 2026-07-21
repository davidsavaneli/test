import {
  forwardRef,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { useT, type MessageKey, type ThemeColor } from '../../theme'
import { useFormContext } from '../../form/formContext'
import { Icon } from '../Icon'
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

/**
 * Where to place the caret after re-masking: keep it after the same number of "significant"
 * (data, i.e. alphanumeric) chars it followed in the raw input — so inserting mid-value doesn't
 * jump the caret to the end. Literal mask chars (spaces, `()`, `-`, …) don't count.
 */
const SIGNIFICANT = /[A-Za-z0-9]/
function maskCaretPosition(rawBeforeCaret: string, masked: string): number {
  const target = (rawBeforeCaret.match(/[A-Za-z0-9]/g) ?? []).length
  if (target <= 0) return 0
  let count = 0
  for (let i = 0; i < masked.length; i++) {
    if (SIGNIFICANT.test(masked[i])) {
      count += 1
      if (count === target) return i + 1
    }
  }
  return masked.length
}

/** Password-strength buckets surfaced by the `passwordStrength` meter. */
export type PasswordStrength = 'weak' | 'medium' | 'strong'

/**
 * A cheap, dependency-free password score: one point each for length ≥ 8, mixed upper/lower case, a
 * digit, and a symbol → 0–4. Empty input scores 0 (the meter hides). Not a security guarantee — a UX
 * hint that nudges toward longer, more varied passwords.
 */
function scorePassword(pw: string): number {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score += 1
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1
  if (/\d/.test(pw)) score += 1
  if (/[^A-Za-z0-9]/.test(pw)) score += 1
  return score
}

/** Maps a 0–4 score to a strength bucket (`null` when there's nothing to show). */
function strengthLevel(score: number): PasswordStrength | null {
  if (score <= 0) return null
  if (score === 1) return 'weak'
  if (score === 2) return 'medium'
  return 'strong'
}

const STRENGTH_META: Record<
  PasswordStrength,
  { labelKey: MessageKey; color: ThemeColor; bars: number }
> = {
  weak: { labelKey: 'textField.strengthWeak', color: 'error', bars: 1 },
  medium: { labelKey: 'textField.strengthMedium', color: 'warning', bars: 2 },
  strong: { labelKey: 'textField.strengthStrong', color: 'success', bars: 3 },
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
  /** Stretches the field to fill its container width. Defaults to `true`. */
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
  /**
   * For `type="password"`: show the built-in show/hide reveal toggle in the right adornment slot.
   * Defaults to `true`. Set `false` to drop it (e.g. to use your own right adornment instead).
   */
  passwordToggle?: boolean
  /**
   * Show a "Caps Lock is on" warning under the field while it's focused and Caps Lock is active.
   * Detected from key events, so it appears once the user starts typing. Defaults to `false`.
   */
  capsLockWarning?: boolean
  /**
   * Show a password-strength meter (segmented bar + label) under the field, derived from the current
   * value. A UX hint only — not a security check. Defaults to `false` (best paired with `type="password"`).
   */
  passwordStrength?: boolean
}

/**
 * A labeled text input. Renders an optional label and helper/validation text, an
 * error state (red border + helper), and an optional `adornment` on either side —
 * a string prefix/suffix (e.g. `"https://"`) or an icon, which can be made
 * interactive via `onAdornmentClick`. Supports an allowed-input `regex` filter and
 * a formatting `mask`. Works controlled (`value` + `onChange`) or uncontrolled
 * (`defaultValue`); when a `mask` is set, `onChange` emits the masked value. Passing
 * `type="password"` automatically adds a show/hide reveal toggle in the right adornment
 * slot. Inside a `<Form>`, a `name` prop auto-binds value/validation from the form (no need to
 * spread `field()`). Styling comes entirely from `--tz-*` tokens.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    size = 'md',
    error,
    helperText,
    required = false,
    fullWidth = true,
    adornment,
    adornmentPosition = 'left',
    onAdornmentClick,
    adornmentLabel,
    regex,
    mask,
    passwordToggle = true,
    capsLockWarning = false,
    passwordStrength = false,
    name,
    value,
    defaultValue,
    onChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    disabled = false,
    type,
    id: idProp,
    className,
    style,
    ...props
  },
  ref,
) {
  const t = useT()
  const reactId = useId()
  const id = idProp ?? reactId
  const helperId = `${id}-helper`

  // Auto-bind to a surrounding <Form> by `name` — so `<TextField name="email" />` just works,
  // pulling value/onChange/onBlur/error/helperText from the form. Explicit props still win.
  const form = useFormContext()
  const bound = form && name ? form.field(name) : undefined

  const resolvedError = error ?? bound?.error ?? false
  const resolvedHelperText = helperText ?? bound?.helperText

  const isControlled = value !== undefined || bound !== undefined
  const [internal, setInternal] = useState<string>(defaultValue != null ? String(defaultValue) : '')
  const currentValue = value !== undefined ? value : bound ? bound.value : internal

  // merge the consumer ref with an internal one so we can restore the caret after re-masking
  const innerRef = useRef<HTMLInputElement | null>(null)
  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      innerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as { current: HTMLInputElement | null }).current = node
    },
    [ref],
  )
  const pendingCaret = useRef<number | null>(null)
  useLayoutEffect(() => {
    const pos = pendingCaret.current
    if (pos == null) return
    pendingCaret.current = null
    innerRef.current?.setSelectionRange(pos, pos)
  })

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const el = event.target
    let next = el.value
    if (mask) {
      const caret = el.selectionStart ?? el.value.length
      const rawBeforeCaret = el.value.slice(0, caret) // capture before applyMask reassigns `next`
      next = applyMask(next, mask)
      // keep the caret after the same run of data chars, so mid-value edits don't jump to the end
      pendingCaret.current = maskCaretPosition(rawBeforeCaret, next)
    }
    if (regex) {
      const candidate = mask ? stripMaskLiterals(next, mask) : next
      if (!regex.test(candidate)) {
        pendingCaret.current = null
        return // reject the change, leaving the value unchanged
      }
    }
    if (!isControlled) setInternal(next)
    el.value = next // hand consumers the masked/filtered value
    bound?.onChange(event)
    onChange?.(event)
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setCapsOn(false) // hide the Caps Lock hint once focus leaves the field
    bound?.onBlur(event)
    onBlur?.(event)
  }

  // Caps Lock warning — read the modifier off key events (can't be known until the user types), and
  // clear it on blur. Cheap: only tracks state when the feature is enabled.
  const [capsOn, setCapsOn] = useState(false)
  const readCaps = (event: KeyboardEvent<HTMLInputElement>) => {
    if (capsLockWarning) setCapsOn(event.getModifierState?.('CapsLock') ?? false)
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    readCaps(event)
    onKeyDown?.(event)
  }
  const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    readCaps(event)
    onKeyUp?.(event)
  }

  // Password fields get an automatic reveal toggle in the (right) adornment slot (unless
  // `passwordToggle={false}`); it flips the input between `password`/`text` and overrides any
  // adornment props for that field.
  const [revealed, setRevealed] = useState(false)
  const isPasswordField = type === 'password'
  const showReveal = isPasswordField && passwordToggle
  const inputType = isPasswordField && revealed ? 'text' : type

  const effAdornment = showReveal ? <Icon name={revealed ? 'EyeSlash' : 'Eye'} /> : adornment
  const effAdornmentPosition = showReveal ? 'right' : adornmentPosition
  const effOnAdornmentClick = showReveal ? () => setRevealed((shown) => !shown) : onAdornmentClick
  const effAdornmentLabel = showReveal
    ? revealed
      ? t('textField.hidePassword')
      : t('textField.showPassword')
    : (adornmentLabel ?? t('textField.fieldAction'))

  // Password-strength meter, derived from the current value (a UX hint, not a security check).
  const strength = passwordStrength
    ? strengthLevel(scorePassword(String(currentValue ?? '')))
    : null
  const strengthId = `${id}-strength`
  const capsId = `${id}-caps`
  const describedBy =
    [resolvedHelperText != null ? helperId : null, capsLockWarning && capsOn ? capsId : null]
      .filter(Boolean)
      .join(' ') || undefined

  const hasAdornment = effAdornment != null && effAdornment !== false
  const isTextAdornment = typeof effAdornment === 'string' || typeof effAdornment === 'number'

  let adornmentNode: ReactNode = null
  if (hasAdornment) {
    if (isTextAdornment) {
      adornmentNode = <span className={styles.textAdornment}>{effAdornment}</span>
    } else if (effOnAdornmentClick) {
      adornmentNode = (
        <IconButton
          variant="text"
          color="primary"
          size={size}
          disabled={disabled}
          aria-label={effAdornmentLabel}
          onClick={effOnAdornmentClick}
          // Don't steal focus from the input on click — keeps the control's focus ring tied to the
          // input itself (clicking the icon shouldn't light up the field's :focus-within ring).
          onMouseDown={(event) => event.preventDefault()}
          className={styles.iconButton}
        >
          {effAdornment}
        </IconButton>
      )
    } else {
      // Decorative icon: same IconButton box (so it sizes identically to the clickable one),
      // but non-interactive and hidden from the a11y tree.
      adornmentNode = (
        <IconButton
          variant="text"
          color="primary"
          size={size}
          disabled={disabled}
          nonClickable
          aria-hidden="true"
          className={styles.iconButton}
        >
          {effAdornment}
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
        resolvedError && styles.error,
        disabled && styles.disabled,
        className,
      )}
      style={style as CSSProperties}
    >
      {label != null && (
        <label htmlFor={id} className={styles.label}>
          <Typography as="span" variant="bodySmall" color="muted">
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
          hasAdornment && effAdornmentPosition === 'left' && styles.hasLeftAdornment,
          hasAdornment && effAdornmentPosition === 'right' && styles.hasRightAdornment,
        )}
      >
        {effAdornmentPosition === 'left' && adornmentNode}
        <input
          ref={setInputRef}
          id={id}
          name={name}
          type={inputType}
          className={styles.input}
          value={currentValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={onFocus}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          disabled={disabled}
          aria-invalid={resolvedError || undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {effAdornmentPosition === 'right' && adornmentNode}
      </div>

      {capsLockWarning && capsOn && (
        <Typography
          as="span"
          id={capsId}
          variant="bodySmall"
          color="warning"
          className={styles.caps}
          role="alert"
        >
          <Icon name="Danger" />
          {t('textField.capsLock')}
        </Typography>
      )}

      {strength && (
        <div
          className={styles.strength}
          style={
            {
              '--tz-strength-color': `var(--tz-color-${STRENGTH_META[strength].color})`,
            } as CSSProperties
          }
        >
          <span className={styles.strengthBars} aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={styles.strengthBar}
                data-on={i < STRENGTH_META[strength].bars}
              />
            ))}
          </span>
          <Typography
            as="span"
            id={strengthId}
            variant="bodySmall"
            color={STRENGTH_META[strength].color}
            className={styles.strengthLabel}
          >
            {t(STRENGTH_META[strength].labelKey)}
          </Typography>
        </div>
      )}

      {resolvedHelperText != null && (
        <Typography
          as="span"
          id={helperId}
          variant="bodySmall"
          color={resolvedError ? 'error' : 'muted'}
          className={styles.helper}
        >
          {resolvedHelperText}
        </Typography>
      )}
    </div>
  )
})
