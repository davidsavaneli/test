import {
  forwardRef,
  useEffect,
  useId,
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
import { ICON_NAMES, type IconName } from '../../icons/names'
import type { ThemeColor } from '../../theme'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import styles from './Modal.module.css'

export type ModalSize = 'sm' | 'md' | 'lg' | 'fullScreen'
export type ModalScrollBehavior = 'inside' | 'outside'

const ICON_NAME_SET = new Set<string>(ICON_NAMES)

/** Focusable descendants used by the focus trap + initial focus. */
const FOCUSABLE =
  'a[href], button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'

export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'color'> {
  /** Whether the modal is open — gates the portal and drives the enter animation. */
  open: boolean
  /** Called when a dismiss is requested (close button, backdrop click, or Escape). */
  onClose: () => void
  /** Preset width: `sm` 360 · `md` 620 · `lg` 900 px, or `fullScreen` (fills the viewport). Defaults to `md`. */
  size?: ModalSize
  /**
   * Where overflow scrolls when the content is taller than the viewport: `inside` (default — the body
   * scrolls while the header + footer stay pinned) or `outside` (the whole dialog grows and the
   * overlay scrolls).
   */
  scrollBehavior?: ModalScrollBehavior
  /** Header title. When set, labels the dialog (`aria-labelledby`). */
  title?: ReactNode
  /** Muted description line under the title (e.g. a confirm prompt). */
  description?: ReactNode
  /** Leading header icon shown in a tinted box (like `Card`) — a known `IconName` or any node. */
  icon?: IconName | ReactNode
  /** Brand color that tints the leading icon box. Defaults to `medium`. */
  color?: ThemeColor
  /** Footer slot — right-aligned actions over a top divider (e.g. Cancel / Confirm buttons). */
  footer?: ReactNode
  /** Show the header × close button. Defaults to `true`. */
  showCloseButton?: boolean
  /** Close when the backdrop (outside the dialog) is clicked. Defaults to `true`. */
  closeOnBackdrop?: boolean
  /** Close when Escape is pressed. Defaults to `true`. */
  closeOnEscape?: boolean
  /** Accessible label — used when there's no `title`. */
  ariaLabel?: string
  /** Dialog body. */
  children?: ReactNode
}

/**
 * A centered, backdrop-dimmed overlay dialog. Portaled to `<body>`, it locks page scroll while open,
 * traps Tab focus inside, restores focus to the previously-focused element on close, and dismisses on
 * close button / backdrop click / Escape (each toggleable). Sizes are `sm`/`md`/`lg` (max-width caps)
 * or `fullScreen`; `scrollBehavior` picks inside-body vs. whole-dialog scrolling. The header mirrors
 * `Card` — an optional tinted `icon` box + `title` + `description`. Controlled by `open` + `onClose`.
 * The forwarded ref points at the dialog element.
 *
 * @example
 * const { isOpen, open, close } = useDisclosure()
 * <Modal open={isOpen} onClose={close} title="Edit" footer={<Button onClick={close}>Done</Button>}>
 *   …
 * </Modal>
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal(
  {
    open,
    onClose,
    size = 'md',
    scrollBehavior = 'inside',
    title,
    description,
    icon,
    color = 'medium',
    footer,
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    ariaLabel,
    className,
    style,
    children,
    ...props
  },
  forwardedRef,
) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const footerRef = useRef<HTMLDivElement | null>(null)
  const mouseDownTarget = useRef<EventTarget | null>(null)
  const [visible, setVisible] = useState(false)
  const titleId = useId()
  const descId = useId()

  useLockBodyScroll(open)

  // enter animation: flip `visible` on the next frame after mount (opacity + translate transition)
  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [open])

  // focus management: move focus into the dialog on open — prefer a body field (form modals land on
  // their first input), else the first footer action (confirm dialogs land on Cancel/Confirm, not the
  // × button), else any control, else the dialog itself; restore focus to the trigger on close
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const target =
      bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      footerRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      panelRef.current
    // preventScroll so opening an `outside`-scroll modal doesn't jump the overlay to a below-fold control
    target?.focus({ preventScroll: true })
    // only restore if the element is still mounted (it may have unmounted while the modal was open)
    return () => {
      if (previouslyFocused?.isConnected) previouslyFocused.focus?.()
    }
  }, [open])

  // merge the panel ref (positioning/focus) with the forwarded ref (consumer access)
  const setPanelRef = (node: HTMLDivElement | null) => {
    panelRef.current = node
    if (typeof forwardedRef === 'function') forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }

  // Escape to close + trap Tab within the dialog so focus can't strand on the locked page behind it
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      // an aria-modal dialog owns the page — swallow Escape so it can't reach React-tree ancestors
      // (e.g. an outer Modal) even when this modal isn't Escape-dismissible
      event.stopPropagation()
      if (closeOnEscape) onClose()
      return
    }
    if (event.key !== 'Tab') return
    const panel = panelRef.current
    if (!panel) return
    const focusables = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    )
    if (focusables.length === 0) {
      event.preventDefault()
      panel.focus()
      return
    }
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  // backdrop dismiss — only when both the pointer-down AND the click landed on the overlay itself
  // (so a text-selection drag that ends on the backdrop doesn't close the dialog)
  const handleOverlayMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    mouseDownTarget.current = event.target
  }
  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop) return
    if (event.target === event.currentTarget && mouseDownTarget.current === event.currentTarget) {
      onClose()
    }
  }

  if (!open) return null

  const renderedIcon =
    icon == null ? null : typeof icon === 'string' && ICON_NAME_SET.has(icon) ? (
      <Icon name={icon as IconName} />
    ) : (
      icon
    )

  const hasHeader = title != null || description != null || renderedIcon != null || showCloseButton
  // a divider sets the header apart from the body/footer, like Card
  const headerDivided = children != null || footer != null

  return createPortal(
    <div
      className={styles.overlay}
      data-open={visible ? 'true' : 'false'}
      data-size={size}
      data-scroll={scrollBehavior}
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={setPanelRef}
        className={clsx(styles.modal, styles[size], className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title != null ? titleId : undefined}
        aria-label={title == null ? ariaLabel : undefined}
        aria-describedby={description != null ? descId : undefined}
        data-open={visible ? 'true' : 'false'}
        tabIndex={-1}
        style={style as CSSProperties}
        {...props}
      >
        {hasHeader && (
          <div className={clsx(styles.header, headerDivided && styles.headerDivided)}>
            <div className={styles.headerMain}>
              {renderedIcon != null && (
                <IconButton
                  variant="filled"
                  size="sm"
                  color={color}
                  nonClickable
                  aria-hidden
                  className={styles.icon}
                >
                  {renderedIcon}
                </IconButton>
              )}
              {(title != null || description != null) && (
                <div className={styles.headerText}>
                  {title != null && (
                    <div id={titleId} className={styles.title}>
                      {title}
                    </div>
                  )}
                  {description != null && (
                    <div id={descId} className={styles.subtitle}>
                      {description}
                    </div>
                  )}
                </div>
              )}
            </div>
            {showCloseButton && (
              <IconButton
                variant="filled"
                color="primary"
                size="sm"
                className={styles.close}
                aria-label="Close"
                onClick={onClose}
              >
                <Icon name="CloseCircle" />
              </IconButton>
            )}
          </div>
        )}
        {children != null && (
          <div ref={bodyRef} className={styles.body}>
            {children}
          </div>
        )}
        {footer != null && (
          <div ref={footerRef} className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
})
