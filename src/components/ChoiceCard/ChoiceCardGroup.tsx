import {
  forwardRef,
  useId,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { useFormContext } from '../../form/formContext'
import type { ThemeColor } from '../../theme'
import type { IconName } from '../../icons/names'
import { Typography } from '../Typography'
import { ChoiceCard, type ChoiceCardAlign, type ChoiceCardSize } from './ChoiceCard'
import { ChoiceCardGroupContext, type ChoiceCardGroupContextValue } from './choiceCardContext'
import styles from './ChoiceCard.module.css'

/** A single card for the data-driven `options` prop. */
export interface ChoiceCardOption {
  value: string
  /** Card title. */
  label?: ReactNode
  /** Muted description line under the title. */
  description?: ReactNode
  /** Leading icon in a tinted circle — a known `IconName` or any node. */
  icon?: IconName | ReactNode
  disabled?: boolean
}

export interface ChoiceCardGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'color' | 'onChange' | 'defaultValue'
> {
  /**
   * Single-selection (radio semantics — the cards are native radios, `value` is a `string | null`,
   * clicking the selected card keeps it selected) vs multiple (checkbox semantics — `value` is a
   * `string[]`). Defaults to `false` (multiple).
   */
  exclusive?: boolean
  /** Controlled value — a `string | null` when `exclusive`, else a `string[]`. */
  value?: string | string[] | null
  /** Initial value for uncontrolled use (same shape as `value`). */
  defaultValue?: string | string[] | null
  /** Fires with the next value (matches the `exclusive` shape). */
  onChange?: (value: string | string[] | null) => void
  /**
   * Input `name` — shared by the radios in `exclusive` mode, and the `<Form>` binding key (form value:
   * `string` when `exclusive`, else `string[]`). Auto-generated when omitted.
   */
  name?: string
  /** Data-driven cards — an alternative to passing `<ChoiceCard>` children. */
  options?: ChoiceCardOption[]
  /** Group label rendered above the cards. */
  label?: ReactNode
  /** Minimum card width in px — the grid fits as many per row as this allows. Defaults to `160`. */
  minCardWidth?: number
  /**
   * Content alignment for every card. `center` centers the icon + text stack; `left` anchors the same
   * stack to the left edge (icon above left-aligned text). Omit for the smart default — cards with an
   * icon center, icon-less cards left-align. A card's own `align` wins.
   */
  align?: ChoiceCardAlign
  /** Preset size for every card. Defaults to `md`. */
  size?: ChoiceCardSize
  /** Brand palette token for the selected tint. Defaults to `primary`. */
  color?: ThemeColor
  /** Marks the group invalid — reddens the card borders (no message text, like `RadioGroup`). */
  error?: boolean
  /** Adds a red asterisk after the label. */
  required?: boolean
  /** Disables every card in the group. */
  disabled?: boolean
  /** `<ChoiceCard>` children (used when `options` is not given). */
  children?: ReactNode
}

/**
 * A group of selectable cards — rich checkboxes/radios with icons, titles and descriptions (role
 * pickers, plan choices, permission sets). **`exclusive`** picks single-selection (radio semantics —
 * `value` is a `string | null` and Arrow keys rove between the cards) vs multiple (checkbox semantics —
 * `value` is a `string[]`); defaults to `false` (multiple). Controlled (`value` + `onChange`) or
 * uncontrolled (`defaultValue`); supply the cards via the data-driven `options` prop (`{ value, label,
 * description?, icon?, disabled? }[]`) or as `<ChoiceCard>` children. The cards lay out on a
 * **responsive grid** (`minCardWidth`, default `160` — as many per row as fit, wrapping below). Binds
 * to a surrounding `<Form>` by **`name`** — the form value is a `string` when `exclusive` (validate
 * with e.g. `z.string().min(1)`), else a `string[]` (`z.array(z.string()).min(1)`); the form's `error`
 * reddens the card borders (no message text, like `RadioGroup`). `role="radiogroup"` / `"group"`;
 * styling uses `--tz-*` tokens via the shared `--tz-btn-rgb` pattern.
 */
export const ChoiceCardGroup = forwardRef<HTMLDivElement, ChoiceCardGroupProps>(
  function ChoiceCardGroup(
    {
      exclusive = false,
      value,
      defaultValue,
      onChange,
      name,
      options,
      label,
      minCardWidth = 160,
      align,
      size = 'md',
      color = 'primary',
      error,
      required = false,
      disabled = false,
      children,
      className,
      style,
      ...props
    },
    ref,
  ) {
    // exclusive cards are native radios — they need a shared input name even without a form
    const reactId = useId()
    const resolvedName = name ?? `choice-${reactId}`

    // Auto-bind to a surrounding <Form> by `name` — the form value mirrors the `exclusive` shape.
    const form = useFormContext()
    const isFormBound = Boolean(form && name)
    const bound = form && name ? form.field(name) : undefined

    const externalValue: string | string[] | null | undefined =
      value !== undefined
        ? value
        : isFormBound
          ? (form!.values[name!] as string | string[] | null | undefined)
          : undefined
    const isControlled = externalValue !== undefined
    const [internal, setInternal] = useState<string | string[] | null | undefined>(defaultValue)
    const current = isControlled ? externalValue : internal

    const resolvedError = error ?? bound?.error ?? false

    const isSelected = (v: string) =>
      exclusive ? current === v : Array.isArray(current) && current.includes(v)

    const toggle = (v: string) => {
      let next: string | string[] | null
      if (exclusive) {
        next = v // radio semantics — selecting again keeps it selected
      } else {
        const arr = Array.isArray(current) ? current : []
        next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
      }
      if (!isControlled) setInternal(next)
      if (isFormBound) form!.setValue(name!, next)
      onChange?.(next)
    }

    const ctx: ChoiceCardGroupContextValue = {
      name: resolvedName,
      exclusive,
      isSelected,
      toggle,
      size,
      align,
      color,
      disabled,
      error: resolvedError,
    }

    return (
      <div
        ref={ref}
        role={exclusive ? 'radiogroup' : 'group'}
        aria-invalid={resolvedError || undefined}
        className={clsx(styles.group, className)}
        style={style as CSSProperties}
        {...props}
      >
        {label != null && (
          <span className={styles.groupLabel}>
            <Typography as="span" variant="bodySmall" color="muted">
              {label}
            </Typography>
            {required && (
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            )}
          </span>
        )}

        <div className={styles.grid} style={{ '--cc-min': `${minCardWidth}px` } as CSSProperties}>
          <ChoiceCardGroupContext.Provider value={ctx}>
            {options
              ? options.map((option) => (
                  <ChoiceCard
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    description={option.description}
                    icon={option.icon}
                    disabled={option.disabled}
                  />
                ))
              : children}
          </ChoiceCardGroupContext.Provider>
        </div>
      </div>
    )
  },
)
