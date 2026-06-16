import {
  cloneElement,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { clsx } from 'clsx'
import { FloatingPanel } from '../FloatingPanel/FloatingPanel'
import styles from './Popover.module.css'

export type PopoverAlign = 'start' | 'end'

export interface PopoverProps {
  /** Element that toggles the popover (e.g. a `Button`/`IconButton`). Cloned to wire click + a11y. */
  trigger: ReactElement
  /** Popover content — arbitrary (a header/body/footer, a form, a filter panel, …). */
  children: ReactNode
  /**
   * Horizontal alignment to the trigger: `start` (default — left edges align, grows right) or `end`
   * (right edges align, grows left — for a trigger near the right edge).
   */
  align?: PopoverAlign
  /** Controlled open state. */
  open?: boolean
  /** Initial open state for uncontrolled use. Defaults to `false`. */
  defaultOpen?: boolean
  /** Fires with the next open state. */
  onOpenChange?: (open: boolean) => void
  /** Trap Tab focus inside (+ `aria-modal`) — for form/filter popovers. Defaults to `false`. */
  trapFocus?: boolean
  /** Make the panel at least as wide as the trigger. Defaults to `false`. */
  matchTriggerWidth?: boolean
  /** Fixed panel width (px number or any CSS width). */
  width?: number | string
  /** Accessible label for the panel (`role="dialog"`). */
  ariaLabel?: string
  /** Prevents opening. */
  disabled?: boolean
  /** Class applied to the floating panel. */
  className?: string
  /** Style applied to the floating panel. */
  style?: CSSProperties
}

/**
 * An anchored popover holding **arbitrary content** — the generic floating surface for filter panels,
 * forms, detail cards, etc. (unlike `Dropdown`, which is a `role="menu"` of items). Built on the shared
 * `FloatingPanel`: portaled to `<body>`, opens below the `trigger` (flips above on overflow), locks page
 * scroll, dismisses on outside-pointerdown / `Escape` (refocusing the trigger), and animates in. The
 * trigger is cloned to wire `onClick` + `aria-haspopup="dialog"`/`aria-expanded`/`aria-controls`.
 * `trapFocus` cycles Tab within (for forms). Controlled (`open` + `onOpenChange`) or uncontrolled
 * (`defaultOpen`). The panel is `role="dialog"`.
 */
export function Popover({
  trigger,
  children,
  align = 'start',
  open,
  defaultOpen = false,
  onOpenChange,
  trapFocus = false,
  matchTriggerWidth = false,
  width,
  ariaLabel,
  disabled = false,
  className,
  style,
}: PopoverProps) {
  const panelId = useId()
  const triggerRef = useRef<HTMLElement | null>(null)

  const isControlled = open !== undefined
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = isControlled ? open : internalOpen

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  const triggerProps = trigger.props as {
    onClick?: (event: ReactMouseEvent) => void
    ref?: Ref<HTMLElement>
  }
  const originalRef = triggerProps.ref

  const clonedTrigger = cloneElement(trigger as ReactElement<Record<string, unknown>>, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node
      if (typeof originalRef === 'function') originalRef(node)
      else if (originalRef) (originalRef as { current: HTMLElement | null }).current = node
    },
    onClick: (event: ReactMouseEvent) => {
      triggerProps.onClick?.(event)
      if (!disabled) setOpen(!isOpen)
    },
    'aria-haspopup': 'dialog',
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? panelId : undefined,
  })

  return (
    <>
      {clonedTrigger}
      <FloatingPanel
        open={isOpen}
        triggerRef={triggerRef}
        align={align}
        onClose={(refocus) => {
          setOpen(false)
          if (refocus) triggerRef.current?.focus()
        }}
        id={panelId}
        role="dialog"
        ariaLabel={ariaLabel}
        trapFocus={trapFocus}
        matchTriggerWidth={matchTriggerWidth}
        width={width}
        className={clsx(styles.popover, className)}
        style={style}
      >
        {children}
      </FloatingPanel>
    </>
  )
}
