import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { List, type ListItemSize } from '../List'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import styles from './Dropdown.module.css'

export type DropdownPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'

interface Position {
  top: number
  left: number
  side: 'top' | 'bottom'
  maxHeight: number
  minWidth?: number
}

export interface DropdownProps {
  /** The element that opens the menu (e.g. a `Button` / `IconButton`). Cloned to wire click + a11y. */
  trigger: ReactElement
  /** Menu content — typically `ListItem`s (composed inside a `role="menu"` `List`). */
  children: ReactNode
  /** Preferred placement. Flips to the opposite side automatically when it would overflow. Default `bottom-start`. */
  placement?: DropdownPlacement
  /** Menu size — sets the panel min-width (`sm` 150 · `md` 190 · `lg` 220) and the items' density. Default `md`. */
  size?: ListItemSize
  /**
   * Apply the size-based min-width (`sm` 150 · `md` 190 · `lg` 220px). Defaults to `true`; set `false`
   * to let the menu size to its content instead (the items' density still tracks `size`).
   */
  minWidth?: boolean
  /** Controlled open state. */
  open?: boolean
  /** Initial open state for uncontrolled use. Defaults to `false`. */
  defaultOpen?: boolean
  /** Fires with the next open state. */
  onOpenChange?: (open: boolean) => void
  /** Close the menu when an item inside is clicked. Defaults to `true`. */
  closeOnSelect?: boolean
  /** Make the menu at least as wide as the trigger (select-like). Defaults to `false`. */
  matchTriggerWidth?: boolean
  /** Prevents opening. */
  disabled?: boolean
  /** Gap between the trigger and the menu, in px. Defaults to `6`. */
  offset?: number
  /** Class applied to the floating panel. */
  className?: string
  /** Style applied to the floating panel. */
  style?: CSSProperties
}

/** Distance the menu is kept from the viewport edges (px). */
const VIEWPORT_PADDING = 8
/** Focusable menu items, used for arrow-key roving. */
const FOCUSABLE =
  '[role="menuitem"],[role="button"],a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'

function focusableItems(panel: HTMLElement | null): HTMLElement[] {
  if (!panel) return []
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getAttribute('aria-disabled') !== 'true' && el.offsetParent !== null,
  )
}

/**
 * A floating menu anchored to a `trigger`. Opens on trigger click; closes on outside click, `Escape`,
 * or selecting an item. The panel is portaled to `document.body` and positioned with collision
 * handling — it **flips** to the opposite side when it would overflow, clamps within the viewport, and
 * re-positions on scroll/resize (a too-tall menu caps its height and scrolls). Arrow keys move between
 * items; `Escape` returns focus to the trigger. Compose `ListItem`s as `children`.
 */
export function Dropdown({
  trigger,
  children,
  placement = 'bottom-start',
  size = 'md',
  minWidth = true,
  open,
  defaultOpen = false,
  onOpenChange,
  closeOnSelect = true,
  matchTriggerWidth = false,
  disabled = false,
  offset = 6,
  className,
  style,
}: DropdownProps) {
  const menuId = useId()
  const triggerRef = useRef<HTMLElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const isControlled = open !== undefined
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = isControlled ? open : internalOpen
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState<Position | null>(null)

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )
  const close = useCallback(() => setOpen(false), [setOpen])

  // lock page scroll while the menu is open (no scrollbar shift)
  useLockBodyScroll(isOpen)

  // ── positioning: flip when it would overflow, clamp inside the viewport ──
  const update = useCallback(() => {
    const triggerEl = triggerRef.current
    const panel = panelRef.current
    if (!triggerEl || !panel) return

    const rect = triggerEl.getBoundingClientRect()
    const panelW = panel.offsetWidth
    const panelH = panel.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight
    const pad = VIEWPORT_PADDING

    const spaceBelow = vh - rect.bottom - offset - pad
    const spaceAbove = rect.top - offset - pad
    let side: 'top' | 'bottom' = placement.startsWith('bottom') ? 'bottom' : 'top'
    // flip only when the preferred side can't fit AND the opposite side has more room
    if (side === 'bottom' && panelH > spaceBelow && spaceAbove > spaceBelow) side = 'top'
    else if (side === 'top' && panelH > spaceAbove && spaceBelow > spaceAbove) side = 'bottom'

    const available = side === 'bottom' ? spaceBelow : spaceAbove
    const maxHeight = Math.max(0, available)
    const usedH = Math.min(panelH, maxHeight)

    let top = side === 'bottom' ? rect.bottom + offset : rect.top - offset - usedH
    top = Math.min(Math.max(top, pad), Math.max(pad, vh - pad - usedH))

    let left = placement.endsWith('end') ? rect.right - panelW : rect.left
    left = Math.min(Math.max(left, pad), Math.max(pad, vw - pad - panelW))

    setPos({ top, left, side, maxHeight, minWidth: matchTriggerWidth ? rect.width : undefined })
  }, [placement, offset, matchTriggerWidth])

  // position synchronously before paint whenever the menu is open
  useLayoutEffect(() => {
    if (!isOpen) {
      setVisible(false)
      return
    }
    update()
  }, [isOpen, update])

  // enter transition + reposition listeners while open
  useEffect(() => {
    if (!isOpen) return
    const raf = requestAnimationFrame(() => setVisible(true))

    const onReposition = () => update()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    let ro: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onReposition)
      if (panelRef.current) ro.observe(panelRef.current)
      if (triggerRef.current) ro.observe(triggerRef.current)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
      ro?.disconnect()
    }
  }, [isOpen, update])

  // outside click + keyboard (Escape, arrow roving)
  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      close()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        triggerRef.current?.focus()
      } else if (event.key === 'Tab') {
        // Tab would move focus by portal DOM order (end of <body>), orphaning the open menu — close it
        // and let focus continue naturally from the trigger (Select/MultiSelect do the same)
        close()
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const items = focusableItems(panelRef.current)
        if (!items.length) return
        const current = items.indexOf(document.activeElement as HTMLElement)
        const delta = event.key === 'ArrowDown' ? 1 : -1
        const next = (current + delta + items.length) % items.length
        items[next]?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, close])

  // focus the first item once the menu is open and positioned
  useEffect(() => {
    if (!isOpen) return
    const raf = requestAnimationFrame(() => focusableItems(panelRef.current)[0]?.focus())
    return () => cancelAnimationFrame(raf)
  }, [isOpen])

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
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? menuId : undefined,
  })

  const handlePanelClick = (event: ReactMouseEvent) => {
    if (!closeOnSelect) return
    const item = (event.target as HTMLElement).closest(FOCUSABLE)
    if (item && item.getAttribute('aria-disabled') !== 'true') {
      close()
      triggerRef.current?.focus()
    }
  }

  return (
    <>
      {clonedTrigger}
      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            id={menuId}
            className={clsx(styles.panel, minWidth && styles[size], className)}
            data-open={visible ? 'true' : 'false'}
            data-side={pos?.side ?? 'bottom'}
            style={{
              position: 'fixed',
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              maxHeight: pos?.maxHeight,
              minWidth: pos?.minWidth,
              visibility: pos ? 'visible' : 'hidden',
              ...style,
            }}
            onClick={handlePanelClick}
          >
            <List role="menu" size={size} padding="xs">
              {children}
            </List>
          </div>,
          document.body,
        )}
    </>
  )
}
