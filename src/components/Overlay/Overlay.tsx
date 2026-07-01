import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import styles from './Overlay.module.css'

export interface OverlayProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether the overlay is mounted + shown — gates the portal and drives the fade-in. */
  open: boolean
  /** Requested dismiss — fired on a backdrop click (`closeOnBackdrop`) or Escape (`closeOnEscape`). */
  onClose?: () => void
  /** Close when the scrim itself (outside the content) is clicked. Defaults to `true`. */
  closeOnBackdrop?: boolean
  /** Close when Escape is pressed while focus is within the overlay. Defaults to `true`. */
  closeOnEscape?: boolean
  /** Lock page scroll while open. Defaults to `true`. */
  lockScroll?: boolean
  /** Scrim darkness — the black backdrop's alpha (0–1). Defaults to `0.45`. */
  dim?: number
  /** Overlay content — typically a centered dialog / box / media. */
  children?: ReactNode
}

/**
 * The shared backdrop primitive behind every dimmed, page-blocking surface (`Modal`, the FileUploader
 * lightbox). Portals a fixed full-viewport scrim to `<body>`, locks page scroll, fades in (opacity keyed
 * off a rAF `visible` flag → `data-open`), and dismisses on **backdrop-click** (gated on the pointer-down
 * AND click both landing on the scrim, so a text-selection drag ending on it doesn't close) / **Escape**
 * (swallowed via `stopPropagation` so it can't reach a React-tree ancestor overlay). Centers its children
 * by default; consumers layer their own padding / scroll / placement via `className` + `data-*` and read
 * the shared `data-open` on the scrim for their own box's enter transform. A consumer `onKeyDown` still
 * fires (after the Escape handling) so it can add e.g. a Tab focus-trap. Internal — no `index.ts`, so it's
 * never exposed as a package subpath; import it via `../Overlay/Overlay`. The ref points at the scrim div.
 */
export const Overlay = forwardRef<HTMLDivElement, OverlayProps>(function Overlay(
  {
    open,
    onClose,
    closeOnBackdrop = true,
    closeOnEscape = true,
    lockScroll = true,
    dim,
    className,
    style,
    children,
    onKeyDown,
    onMouseDown,
    onClick,
    ...props
  },
  ref,
) {
  const mouseDownTarget = useRef<EventTarget | null>(null)
  const [visible, setVisible] = useState(false)

  useLockBodyScroll(open && lockScroll)

  // enter animation: flip `visible` on the frame after mount so the opacity transition runs
  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [open])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      // the overlay owns the page — swallow Escape so it can't reach a React-tree ancestor overlay (e.g.
      // an outer Modal) even when this one isn't Escape-dismissible
      event.stopPropagation()
      if (closeOnEscape) onClose?.()
    }
    onKeyDown?.(event)
  }
  // remember where the pointer went down so the click handler can tell a scrim click from a drag that
  // started inside the content and ended on the scrim (a text-selection drag)
  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    mouseDownTarget.current = event.target
    onMouseDown?.(event)
  }
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (
      closeOnBackdrop &&
      event.target === event.currentTarget &&
      mouseDownTarget.current === event.currentTarget
    ) {
      onClose?.()
    }
    onClick?.(event)
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={ref}
      className={clsx(styles.overlay, className)}
      data-open={visible ? 'true' : 'false'}
      style={dim != null ? ({ '--tz-overlay-dim': dim, ...style } as CSSProperties) : style}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>,
    document.body,
  )
})
