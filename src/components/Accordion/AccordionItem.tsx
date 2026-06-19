import { forwardRef, useId, type HTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { Icon } from '../Icon'
import { ICON_NAMES, type IconName } from '../../icons/names'
import { useAccordionContext } from './accordionContext'
import styles from './Accordion.module.css'

const ICON_NAME_SET = new Set<string>(ICON_NAMES)

export interface AccordionItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** This item's identity within the `Accordion` (matched against the open value/values). */
  value: string
  /** Header label. */
  label: ReactNode
  /** Leading header icon — a known `IconName` or any node. */
  icon?: IconName | ReactNode
  /** Disable this item (the group's `disabled` also applies). */
  disabled?: boolean
  /** Collapsible body content. */
  children?: ReactNode
}

/**
 * One collapsible panel inside an `<Accordion>` — a header (`label` + optional `icon` + a chevron that
 * rotates) that toggles a smoothly-folding body (`grid-template-rows` animation). Reads the open state,
 * size, and disabled flag from the surrounding `Accordion` via context.
 */
export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(function AccordionItem(
  { value, label, icon, disabled: itemDisabled = false, className, children, ...props },
  ref,
) {
  const { isOpen, toggle, size, disabled: groupDisabled } = useAccordionContext()
  const open = isOpen(value)
  const disabled = groupDisabled || itemDisabled
  const headerId = useId()
  const bodyId = useId()

  const renderedIcon =
    icon == null ? null : typeof icon === 'string' && ICON_NAME_SET.has(icon) ? (
      <Icon name={icon as IconName} size={size} />
    ) : (
      icon
    )

  return (
    <div
      ref={ref}
      className={clsx(styles.item, className)}
      data-open={open ? 'true' : 'false'}
      {...props}
    >
      <button
        type="button"
        id={headerId}
        className={styles.header}
        aria-expanded={open}
        aria-controls={bodyId}
        disabled={disabled}
        onClick={() => toggle(value)}
      >
        {renderedIcon != null && (
          <span className={styles.icon} aria-hidden>
            {renderedIcon}
          </span>
        )}
        <span className={styles.label}>{label}</span>
        <Icon
          name="ArrowDown4"
          size={size}
          className={styles.chevron}
          data-open={open ? 'true' : 'false'}
        />
      </button>
      <div className={styles.collapsible} data-open={open ? 'true' : 'false'}>
        <div className={styles.collapsibleInner}>
          <div id={bodyId} role="region" aria-labelledby={headerId} className={styles.body}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
})
