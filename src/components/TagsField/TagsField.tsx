import {
  forwardRef,
  useCallback,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { useFormContext } from '../../form/formContext'
import type { ThemeColor } from '../../theme'
import { Chip } from '../Chip'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Typography } from '../Typography'
import styles from './TagsField.module.css'

export type TagsFieldSize = 'sm' | 'md' | 'lg'

/** Splits a value (array or `separator`-joined string) into trimmed, non-empty tags. */
function toTags(value: string[] | string | undefined, separator: string): string[] {
  const parts = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? separator
        ? value.split(separator)
        : [value] // empty separator → don't explode into per-character tags
      : []
  return parts.map((t) => t.trim()).filter(Boolean)
}

export interface TagsFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'color' | 'value' | 'defaultValue' | 'onChange'
> {
  /** Label rendered above the field. */
  label?: ReactNode
  /** Preset size — control height, font and chips. */
  size?: TagsFieldSize
  /** Marks the field invalid: red border/focus ring and the `helperText` shown in the error color. */
  error?: boolean
  /** Helper / validation text under the field. Adopts the error color while `error`. */
  helperText?: ReactNode
  /** Adds a red asterisk after the label. */
  required?: boolean
  /** Stretches the field to fill its container width. Defaults to `true`. */
  fullWidth?: boolean
  /** Disables the field (no typing, no add/remove). */
  disabled?: boolean
  /** Controlled value — a `string[]` or a `separator`-joined `string` (e.g. `"react;typescript"`). */
  value?: string[] | string
  /** Initial value for uncontrolled use (`string[]` or a joined `string`). */
  defaultValue?: string[] | string
  /** Fires with the next tags, mirroring the input shape: a `string[]`, or a joined `string` when the value is a string. */
  onChange?: (value: string[] | string) => void
  /** Character/string that splits typed & pasted input and joins the value when it's a string. Defaults to `,`. */
  separator?: string
  /** Brand token tinting the tag chips. Defaults to `medium`. */
  color?: ThemeColor
  /** Allow the same tag more than once. Off by default (duplicates are ignored). */
  allowDuplicates?: boolean
  /** Placeholder shown in the input while there are no tags. */
  placeholder?: string
  /** Icon for the add button. Defaults to an `Add` icon. */
  addIcon?: ReactNode
  /** Accessible label for the add button. Defaults to `"Add tag"`. */
  addLabel?: string
}

/**
 * A tags / token input. Type a value and press **Enter**, the **add button**, or the `separator`
 * key to commit it as a tag; remove a tag via its chip's delete button (or Backspace on the empty
 * input). The **`separator`** (default `,`) also splits pasted text, so pasting `"react;typescript"`
 * (with `separator=";"`) adds both at once. The value accepts — and `onChange` mirrors — **either a
 * `string[]` or a `separator`-joined `string`**, so it binds to a `<Form>` schema of either shape.
 * Shares TextField's chrome (label, helper/error, sizes, `<Form>` binding by `name` for validation).
 * Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`). Token-only styling.
 */
export const TagsField = forwardRef<HTMLInputElement, TagsFieldProps>(function TagsField(
  {
    label,
    size = 'md',
    error,
    helperText,
    required = false,
    fullWidth = true,
    disabled = false,
    value,
    defaultValue,
    onChange,
    separator = ',',
    color = 'medium',
    allowDuplicates = false,
    placeholder,
    addIcon,
    addLabel = 'Add tag',
    name,
    id: idProp,
    className,
    style,
    onKeyDown,
    onBlur,
    onPaste,
    ...props
  },
  ref,
) {
  const reactId = useId()
  const id = idProp ?? reactId
  const helperId = `${id}-helper`

  // Auto-bind to a surrounding <Form> by `name`. error/helper/onBlur come from field(), but the VALUE
  // is read RAW from `form.values` — field().value is always String-coerced, which would flatten a
  // `string[]` into a joined string and break an array schema. Same pattern as NumberField/ColorPicker.
  const form = useFormContext()
  const isFormBound = Boolean(form && name)
  const bound = isFormBound ? form!.field(name!) : undefined
  const rawFormValue = isFormBound
    ? (form!.values[name!] as string[] | string | undefined)
    : undefined

  const resolvedError = error ?? bound?.error ?? false
  const resolvedHelperText = helperText ?? bound?.helperText

  const externalValue = value !== undefined ? value : isFormBound ? rawFormValue : undefined
  const isControlled = value !== undefined || isFormBound
  // Mirror the value's shape on output: a joined string when the source is a string, else an array.
  const shapeSource = externalValue !== undefined ? externalValue : defaultValue
  const stringMode = typeof shapeSource === 'string'

  const [internal, setInternal] = useState<string[]>(() => toTags(defaultValue, separator))
  const tags = isControlled ? toTags(externalValue, separator) : internal

  const [input, setInput] = useState('')

  const inputRef = useRef<HTMLInputElement | null>(null)
  const setRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as { current: HTMLInputElement | null }).current = node
    },
    [ref],
  )

  const commit = (nextTags: string[]) => {
    if (!isControlled) setInternal(nextTags)
    const out: string[] | string = stringMode ? nextTags.join(separator) : nextTags
    if (isFormBound) form!.setValue(name!, out)
    onChange?.(out)
  }

  const addTags = (raw: string) => {
    const parts = toTags(raw, separator)
    setInput('')
    if (!parts.length) return
    const next = [...tags]
    for (const part of parts) {
      if (!allowDuplicates && next.includes(part)) continue
      next.push(part)
    }
    if (next.length !== tags.length) commit(next)
  }

  const removeTag = (index: number) => {
    commit(tags.filter((_, i) => i !== index))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // while an IME is composing (CJK etc.), Enter/separator confirm the candidate — not a commit
    if (event.nativeEvent.isComposing) {
      onKeyDown?.(event)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      addTags(input)
    } else if (separator.length === 1 && event.key === separator) {
      event.preventDefault()
      addTags(input)
    } else if (event.key === 'Backspace' && input === '' && tags.length > 0) {
      event.preventDefault()
      removeTag(tags.length - 1)
    }
    onKeyDown?.(event)
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (input.trim()) addTags(input) // don't lose a typed-but-not-committed tag
    bound?.onBlur(event)
    onBlur?.(event)
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text')
    if (text && separator && text.includes(separator)) {
      event.preventDefault()
      // splice the pasted, separator-delimited text into the input at the caret/selection
      const el = event.currentTarget
      const start = el.selectionStart ?? input.length
      const end = el.selectionEnd ?? input.length
      addTags(input.slice(0, start) + text + input.slice(end))
    }
    onPaste?.(event)
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

      <div className={styles.control}>
        {/* clicking anywhere in the tag area focuses the input */}
        <div
          className={clsx(styles.tags, tags.length > 0 && styles.tagsFilled)}
          onClick={() => inputRef.current?.focus()}
        >
          {tags.map((tag, index) => (
            <Chip
              key={`${tag}-${index}`}
              size={size}
              color={color}
              disabled={disabled}
              onDelete={() => removeTag(index)}
              deleteLabel={`Remove ${tag}`}
            >
              {tag}
            </Chip>
          ))}
          <input
            ref={setRef}
            id={id}
            name={name}
            className={styles.input}
            value={input}
            placeholder={tags.length === 0 ? placeholder : undefined}
            disabled={disabled}
            aria-invalid={resolvedError || undefined}
            aria-describedby={resolvedHelperText != null ? helperId : undefined}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onPaste={handlePaste}
            {...props}
          />
        </div>
        <IconButton
          type="button"
          variant="text"
          color="primary"
          size={size}
          disabled={disabled || input.trim() === ''}
          aria-label={addLabel}
          className={styles.addButton}
          // keep the input's focus ring while clicking add (don't steal focus → blur → double add)
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => addTags(input)}
        >
          {addIcon ?? <Icon name="Add" />}
        </IconButton>
      </div>

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
