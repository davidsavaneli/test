import {
  forwardRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { useFloatingPanel } from '../../hooks/useFloatingPanel'
import styles from './FloatingPanel.module.css'

export interface FloatingPanelProps {
  /** Whether the panel is open — gates the portal and drives the enter animation. */
  open: boolean
  /** Ref to the anchor/trigger element the panel is positioned against. */
  triggerRef: RefObject<HTMLElement | null>
  /** Horizontal alignment to the trigger: `start` (default, grows right) or `end` (grows left). */
  align?: 'start' | 'end'
  /** Dismiss request: outside-pointerdown (arg = restore focus to the trigger?) or Escape (`true`). */
  onClose: (refocus: boolean) => void
  /** `id` for the panel element — pair with the trigger's `aria-controls`. */
  id?: string
  /** ARIA role for the panel element (e.g. `'dialog'`). Omit for a plain wrapper (e.g. around a listbox). */
  role?: string
  /** Accessible label, paired with `role`. */
  ariaLabel?: string
  /** Trap Tab focus inside the panel + mark it `aria-modal` (for modal dialogs like the date pickers). */
  trapFocus?: boolean
  /** Constrain the panel to the trigger's width (select-like). */
  matchTriggerWidth?: boolean
  /** Fixed panel width (px number or any CSS width). Wins over `matchTriggerWidth`. */
  width?: number | string
  /** Class(es) for the panel element, merged after the shared chrome (layout overrides live here). */
  className?: string
  /** Inline style merged onto the panel (e.g. a custom CSS var). */
  style?: CSSProperties
  /** Panel content. */
  children: ReactNode
}

/** Focusable descendants used by the optional focus trap. */
const FOCUSABLE = 'button:not([tabindex="-1"]):not(:disabled), [tabindex="0"]'

/**
 * The shared floating popover used across the library — `Select` / `MultiSelect`, the date/time
 * pickers, `ColorPicker`, and the public `Popover`. Wraps `useFloatingPanel` and renders a `<body>`-portaled, viewport-clamped
 * panel that opens below its trigger (flips above only when it would overflow), locks page scroll while
 * open, animates in (opacity + translate, keyed off `data-open`/`data-side`), and dismisses on
 * outside-pointerdown / `Escape`. Optionally **traps Tab focus** (`trapFocus`, for modal dialogs — also
 * sets `aria-modal`). The forwarded ref points at the panel element, so a consumer can still read it for
 * blur/focus bookkeeping. Internal (not part of the public component surface).
 */
export const FloatingPanel = forwardRef<HTMLDivElement, FloatingPanelProps>(function FloatingPanel(
  {
    open,
    triggerRef,
    align,
    onClose,
    id,
    role,
    ariaLabel,
    trapFocus = false,
    matchTriggerWidth = false,
    width,
    className,
    style,
    children,
  },
  forwardedRef,
) {
  const {
    popoverRef,
    position: pos,
    visible,
  } = useFloatingPanel({
    open,
    triggerRef,
    align,
    onClose,
  })

  // attach the panel node to both the hook's ref (for positioning) and the forwarded ref (for the
  // consumer's blur/focus bookkeeping)
  const setRef = (node: HTMLDivElement | null) => {
    popoverRef.current = node
    if (typeof forwardedRef === 'function') forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }

  // trap Tab within the dialog so focus can't strand on the scroll-locked page behind it
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const panel = popoverRef.current
    if (!panel) return
    const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE)
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  if (!open) return null

  const resolvedWidth = width ?? (matchTriggerWidth ? pos?.width : undefined)

  return createPortal(
    <div
      ref={setRef}
      id={id}
      className={clsx(styles.panel, className)}
      role={role}
      aria-modal={role === 'dialog' && trapFocus ? true : undefined}
      aria-label={ariaLabel}
      data-open={visible ? 'true' : 'false'}
      data-side={pos?.side ?? 'bottom'}
      onKeyDown={trapFocus ? handleKeyDown : undefined}
      style={{
        position: 'fixed',
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        width: resolvedWidth,
        maxHeight: pos?.maxHeight,
        visibility: pos ? 'visible' : 'hidden',
        ...style,
      }}
    >
      {children}
    </div>,
    document.body,
  )
})
