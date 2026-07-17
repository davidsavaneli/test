import {
  forwardRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
import { ICON_NAMES, type IconName } from '../../icons/names'
import { Icon } from '../Icon'
import { useChoiceCardGroupContext } from './choiceCardContext'
import styles from './ChoiceCard.module.css'

const ICON_NAME_SET = new Set<string>(ICON_NAMES)

export type ChoiceCardSize = 'sm' | 'md' | 'lg'
export type ChoiceCardAlign = 'left' | 'center'

export interface ChoiceCardProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'color' | 'type' | 'onChange' | 'value'
> {
  /** This card's value — selected when the surrounding `ChoiceCardGroup`'s value holds it. */
  value: string
  /** Card title. */
  label?: ReactNode
  /** Muted description line under the title. */
  description?: ReactNode
  /** Leading icon in a tinted circle — a known `IconName` or any node. Optional. */
  icon?: IconName | ReactNode
  /**
   * Content alignment. `center` centers the icon + text stack; `left` anchors the same stack to the
   * left edge (icon above left-aligned text). Defaults to the group's `align`, else `center` with an
   * icon and `left` without one.
   */
  align?: ChoiceCardAlign
  /** Theme palette token for the selected tint. Defaults to `primary` (inherits the group's `color`). */
  color?: ThemeColor
  /** Preset size — padding, icon circle and fonts. Inherits the group's `size` when omitted. */
  size?: ChoiceCardSize
  /** Marks the card invalid — reddens the border + indicator. Inherits the group's `error`. */
  error?: boolean
  /** Controlled selected state for standalone use (inside a `ChoiceCardGroup` the group drives this). */
  checked?: boolean
  /** Fires with the next selected state (standalone use). */
  onChange?: (checked: boolean) => void
}

/**
 * A selectable card — a rich checkbox/radio with an icon, title and description. The native input is
 * visually hidden but fully accessible (Space toggles; in an `exclusive` group the cards are real
 * radios, so Arrow keys rove between them); the card shows the state with a accent border + soft halo,
 * a top-right tick indicator, and an icon circle that fills with the color while selected. Designed to
 * live inside a `<ChoiceCardGroup>` (which supplies the selection, `exclusive` mode and
 * `size`/`color`/`disabled`/`error` via context), but also works standalone as a single fancy checkbox
 * (`checked` + `onChange`). Styling uses `--tz-*` tokens via the shared `--tz-btn-rgb` pattern.
 */
export const ChoiceCard = forwardRef<HTMLInputElement, ChoiceCardProps>(function ChoiceCard(
  {
    value,
    label,
    description,
    icon,
    align,
    color,
    size,
    error,
    checked,
    onChange,
    name,
    disabled,
    className,
    style,
    ...props
  },
  ref,
) {
  const group = useChoiceCardGroupContext()

  const resolvedColor = color ?? group?.color ?? 'primary'
  const resolvedSize = size ?? group?.size ?? 'md'
  const resolvedError = error ?? group?.error ?? false
  const resolvedDisabled = disabled ?? group?.disabled ?? false
  const resolvedName = name ?? group?.name
  // explicit prop → group's align → smart default (an icon centers the card, no icon reads as a row)
  const resolvedAlign = align ?? group?.align ?? (icon == null ? 'left' : 'center')

  // In a group the selection comes from context; standalone it's controlled (`checked`) or local.
  const [internal, setInternal] = useState(false)
  const isChecked = group ? group.isSelected(value) : checked !== undefined ? checked : internal

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (resolvedDisabled) return
    if (group) {
      group.toggle(value)
      return
    }
    if (checked === undefined) setInternal(event.target.checked)
    onChange?.(event.target.checked)
  }

  const iconNode =
    typeof icon === 'string' && ICON_NAME_SET.has(icon) ? (
      <Icon name={icon as IconName} size={resolvedSize} />
    ) : (
      icon
    )

  return (
    <label
      className={clsx(
        styles.card,
        styles[resolvedSize],
        resolvedAlign === 'left' && styles.left,
        isChecked && styles.selected,
        resolvedError && styles.error,
        resolvedDisabled && styles.disabled,
        className,
      )}
      style={
        {
          '--tz-btn-rgb': `var(--tz-color-${resolvedColor}-rgb)`,
          '--tz-btn-on': `var(--tz-color-${resolvedColor}-contrast, #fff)`,
          ...style,
        } as CSSProperties
      }
    >
      <input
        ref={ref}
        type={group?.exclusive ? 'radio' : 'checkbox'}
        className={styles.input}
        name={resolvedName}
        value={value}
        checked={isChecked}
        onChange={handleChange}
        disabled={resolvedDisabled}
        aria-invalid={resolvedError || undefined}
        {...props}
      />
      {/* top-right selection indicator — radio-style ring + dot in exclusive groups (mirrors Radio),
          else a circle that fills with the theme color + a CSS tick (checkbox semantics) */}
      <span
        className={clsx(styles.indicator, group?.exclusive && styles.radioDot)}
        aria-hidden="true"
      />
      {icon != null && (
        <span className={styles.iconBox} aria-hidden="true">
          {iconNode}
        </span>
      )}
      {(label != null || description != null) && (
        <span className={styles.text}>
          {label != null && <span className={styles.label}>{label}</span>}
          {description != null && <span className={styles.description}>{description}</span>}
        </span>
      )}
    </label>
  )
})
