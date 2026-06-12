import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useLockBodyScroll } from './useLockBodyScroll'

/** Geometry computed for a floating panel anchored to a trigger. */
export interface FloatingPanelPosition {
  top: number
  left: number
  width: number
  side: 'top' | 'bottom'
  maxHeight: number
}

const VIEWPORT_PADDING = 8
const OFFSET = 6

export interface UseFloatingPanelOptions {
  /** Whether the panel is open. */
  open: boolean
  /** Ref to the anchor/trigger element. */
  triggerRef: RefObject<HTMLElement | null>
  /**
   * Dismiss request. Outside-pointerdown passes whether focus was parked inside the panel (so the
   * consumer can restore focus to the trigger); Escape passes `true`.
   */
  onClose: (refocus: boolean) => void
}

export interface UseFloatingPanelResult {
  /** Attach to the portaled panel element. */
  popoverRef: RefObject<HTMLDivElement | null>
  /** Computed geometry (null until first measured). */
  position: FloatingPanelPosition | null
  /** Enter-animation flag (rAF-driven once open). */
  visible: boolean
  /** Force a re-measure (rarely needed — scroll/resize/ResizeObserver already drive it). */
  reposition: () => void
}

/**
 * Shared floating-panel plumbing — a `<body>`-portaled panel that opens below its trigger (flips above
 * only when it would overflow), exposes the trigger width (for select-like matching), clamps to the
 * viewport, re-positions on scroll/resize (+ `ResizeObserver`), locks page scroll while open, and
 * dismisses on outside-pointerdown / `Escape`. The consumer owns the trigger ref, the `open` state, and
 * the `onClose` cleanup; this hook owns the panel ref, geometry, the enter-animation flag, and the
 * listeners. Wrapped by the internal `FloatingPanel` component, which every popover in the library
 * (`Select` / `MultiSelect`, the date/time pickers, `ColorPicker`) renders. Internal (not public).
 */
export function useFloatingPanel({
  open,
  triggerRef,
  onClose,
}: UseFloatingPanelOptions): UseFloatingPanelResult {
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<FloatingPanelPosition | null>(null)
  const [visible, setVisible] = useState(false)

  useLockBodyScroll(open)

  const reposition = useCallback(() => {
    const trigger = triggerRef.current
    const panel = popoverRef.current
    if (!trigger || !panel) return
    const rect = trigger.getBoundingClientRect()
    const panelH = panel.offsetHeight
    const vh = window.innerHeight
    const vw = window.innerWidth

    const spaceBelow = vh - rect.bottom - OFFSET - VIEWPORT_PADDING
    const spaceAbove = rect.top - OFFSET - VIEWPORT_PADDING
    // prefer below; flip up only when below can't fit AND above has more room
    let side: 'top' | 'bottom' = 'bottom'
    if (panelH > spaceBelow && spaceAbove > spaceBelow) side = 'top'

    const maxHeight = Math.max(0, side === 'bottom' ? spaceBelow : spaceAbove)
    const usedH = Math.min(panelH, maxHeight)
    let top = side === 'bottom' ? rect.bottom + OFFSET : rect.top - OFFSET - usedH
    top = Math.min(
      Math.max(top, VIEWPORT_PADDING),
      Math.max(VIEWPORT_PADDING, vh - VIEWPORT_PADDING - usedH),
    )
    // clamp using the panel's actual width (a panel can be wider than its trigger, e.g. a calendar);
    // `width` returns the trigger width for consumers that match it (Select/MultiSelect).
    const panelW = panel.offsetWidth
    const left = Math.min(
      Math.max(rect.left, VIEWPORT_PADDING),
      Math.max(VIEWPORT_PADDING, vw - VIEWPORT_PADDING - panelW),
    )
    setPosition({ top, left, width: rect.width, side, maxHeight })
  }, [triggerRef])

  useLayoutEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }
    reposition()
  }, [open, reposition])

  useEffect(() => {
    if (!open) return
    const raf = requestAnimationFrame(() => setVisible(true))
    const onReposition = () => reposition()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    let ro: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onReposition)
      if (popoverRef.current) ro.observe(popoverRef.current)
      if (triggerRef.current) ro.observe(triggerRef.current)
    }
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
      ro?.disconnect()
    }
  }, [open, reposition, triggerRef])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t) || popoverRef.current?.contains(t)) return
      // restore focus to the trigger only if it was parked inside the panel (e.g. a search box)
      onClose(!!popoverRef.current?.contains(document.activeElement))
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(true)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, triggerRef])

  return { popoverRef, position, visible, reposition }
}
