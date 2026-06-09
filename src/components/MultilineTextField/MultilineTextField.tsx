import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { clsx } from 'clsx'
import { useFormContext } from '../../form/formContext'
import { Typography } from '../Typography'
import styles from './MultilineTextField.module.css'

export type MultilineTextFieldSize = 'sm' | 'md' | 'lg'

export interface MultilineTextFieldProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size' | 'rows'
> {
  /** Label rendered above the field. */
  label?: ReactNode
  /** Preset size — drives the font size (the height is dynamic). */
  size?: MultilineTextFieldSize
  /** Marks the field invalid: red border/focus ring and the `helperText` shown in the error color. */
  error?: boolean
  /** Helper / validation text under the field. Adopts the error color while `error`. */
  helperText?: ReactNode
  /** Adds a red asterisk after the label (visual hint only — combine with native `required` if needed). */
  required?: boolean
  /** Stretches the field to fill its container width. Defaults to `true`. */
  fullWidth?: boolean
  /** Minimum visible rows — the field's starting (and smallest) height. Defaults to `3`. */
  minRows?: number
  /** Maximum rows before the field stops growing and scrolls instead. Omit for unbounded growth. */
  maxRows?: number
}

/**
 * A labeled multiline text input — the textarea sibling of `TextField`. It shares TextField's chrome
 * (label, helper/validation text, error state, sizes, `<Form>` binding by `name`), but renders a
 * `<textarea>` whose **height is dynamic**: it auto-grows with the content from `minRows` up to an
 * optional `maxRows` (then scrolls). Works controlled (`value` + `onChange`) or uncontrolled
 * (`defaultValue`). Styling comes entirely from `--tz-*` tokens.
 */
export const MultilineTextField = forwardRef<HTMLTextAreaElement, MultilineTextFieldProps>(
  function MultilineTextField(
    {
      label,
      size = 'md',
      error,
      helperText,
      required = false,
      fullWidth = true,
      minRows = 3,
      maxRows = 6,
      name,
      value,
      defaultValue,
      onChange,
      onBlur,
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

    // Auto-bind to a surrounding <Form> by `name` — pulls value/onChange/onBlur/error/helperText.
    // Explicit props still win.
    const form = useFormContext()
    const bound = form && name ? form.field(name) : undefined

    const resolvedError = error ?? bound?.error ?? false
    const resolvedHelperText = helperText ?? bound?.helperText

    const isControlled = value !== undefined || bound !== undefined
    const [internal, setInternal] = useState<string>(
      defaultValue != null ? String(defaultValue) : '',
    )
    const currentValue = value !== undefined ? value : bound ? bound.value : internal

    // Merge the forwarded ref with an internal one so we can measure/resize the textarea.
    const innerRef = useRef<HTMLTextAreaElement | null>(null)
    const setRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as { current: HTMLTextAreaElement | null }).current = node
      },
      [ref],
    )

    // Dynamic height: collapse to `auto`, then grow to fit the content, capped at `maxRows`.
    const autosize = useCallback(() => {
      const el = innerRef.current
      if (!el) return
      el.style.height = 'auto'
      const cs = getComputedStyle(el)
      const fontSize = parseFloat(cs.fontSize) || 16
      const lineHeight = parseFloat(cs.lineHeight) || fontSize * 1.4
      const padV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
      let next = el.scrollHeight
      if (maxRows != null) {
        const maxH = lineHeight * maxRows + padV
        if (next > maxH) {
          next = maxH
          el.style.overflowY = 'auto'
        } else {
          el.style.overflowY = 'hidden'
        }
      }
      el.style.height = `${next}px`
    }, [maxRows])

    // Resize after every value change (no flash — runs before paint), and when the width changes.
    useLayoutEffect(() => {
      autosize()
    }, [autosize, currentValue, minRows])

    useEffect(() => {
      const onResize = () => autosize()
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }, [autosize])

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      if (!isControlled) setInternal(event.target.value)
      // The form's field reads only `event.target.value`; a textarea event is shape-compatible.
      bound?.onChange(event as unknown as ChangeEvent<HTMLInputElement>)
      onChange?.(event)
    }

    const handleBlur = (event: FocusEvent<HTMLTextAreaElement>) => {
      bound?.onBlur(event as unknown as FocusEvent<HTMLInputElement>)
      onBlur?.(event)
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
          <textarea
            ref={setRef}
            id={id}
            name={name}
            rows={minRows}
            className={styles.textarea}
            value={currentValue}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            aria-invalid={resolvedError || undefined}
            aria-describedby={resolvedHelperText != null ? helperId : undefined}
            {...props}
          />
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
  },
)
