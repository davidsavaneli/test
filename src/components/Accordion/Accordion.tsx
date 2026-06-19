import {
  forwardRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { AccordionItem } from './AccordionItem'
import { AccordionContext, type AccordionContextValue } from './accordionContext'
import type { IconName } from '../../icons/names'
import styles from './Accordion.module.css'

export type AccordionSize = 'sm' | 'md' | 'lg'

/** A data-driven panel for the `items` prop. */
export interface AccordionItemData {
  value: string
  label: ReactNode
  /** Leading header icon — a known `IconName` or any node. */
  icon?: IconName | ReactNode
  /** Collapsible body content. */
  content: ReactNode
  disabled?: boolean
}

export interface AccordionProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /**
   * Single-open (`value` is a `string | null` — opening one closes the others) vs multi-open (`value`
   * is a `string[]`). Defaults to `false` (multiple).
   */
  exclusive?: boolean
  /** Controlled open value — a `string | null` when `exclusive`, else a `string[]`. */
  value?: string | string[] | null
  /** Initial open value for uncontrolled use (same shape as `value`). */
  defaultValue?: string | string[] | null
  /** Fires with the next open value (matches the `exclusive` shape). */
  onChange?: (value: string | string[] | null) => void
  /** Data-driven panels — an alternative to passing `<AccordionItem>` children. */
  items?: AccordionItemData[]
  /** Preset size for every panel header. Defaults to `md`. */
  size?: AccordionSize
  /** Disables every panel in the accordion. */
  disabled?: boolean
  /** `<AccordionItem>` children (used when `items` is not given). */
  children?: ReactNode
}

/**
 * A set of collapsible panels (settings sections, FAQs, grouped forms). **`exclusive`** picks
 * single-open (`value` is a `string | null`) vs multi-open (`value` is a `string[]`); both are
 * controlled (`value` + `onChange`) or uncontrolled (`defaultValue`). Supply panels via the
 * data-driven `items` prop or as `<AccordionItem>` children — the group shares the open state, `size`,
 * and `disabled` via context, and each body folds with the shared `grid-template-rows` animation
 * (like `Card`'s `collapsible`). Token-only styling.
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  {
    exclusive = false,
    value,
    defaultValue,
    onChange,
    items,
    size = 'md',
    disabled = false,
    children,
    className,
    style,
    ...props
  },
  ref,
) {
  const isControlled = value !== undefined
  const [internal, setInternal] = useState<string | string[] | null | undefined>(defaultValue)
  const current = isControlled ? value : internal

  const isOpen = (v: string) =>
    exclusive ? current === v : Array.isArray(current) && current.includes(v)

  const toggle = (v: string) => {
    let next: string | string[] | null
    if (exclusive) {
      next = current === v ? null : v
    } else {
      const arr = Array.isArray(current) ? current : []
      next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
    }
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }

  const ctx: AccordionContextValue = { isOpen, toggle, size, disabled }

  return (
    <div
      ref={ref}
      className={clsx(styles.accordion, styles[size], className)}
      style={style as CSSProperties}
      {...props}
    >
      <AccordionContext.Provider value={ctx}>
        {items
          ? items.map((item) => (
              <AccordionItem
                key={item.value}
                value={item.value}
                label={item.label}
                icon={item.icon}
                disabled={item.disabled}
              >
                {item.content}
              </AccordionItem>
            ))
          : children}
      </AccordionContext.Provider>
    </div>
  )
})
