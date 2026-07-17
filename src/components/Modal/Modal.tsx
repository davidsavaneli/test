import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { ICON_NAMES, type IconName } from '../../icons/names'
import type { ThemeColor } from '../../theme'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Overlay } from '../Overlay/Overlay'
import styles from './Modal.module.css'

export type ModalSize = 'sm' | 'md' | 'lg' | 'fullScreen'
export type ModalScrollBehavior = 'inside' | 'outside'
export type ModalPlacement = 'center' | 'left' | 'right'

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
   * Where overflow scrolls when the content is taller than the viewport: `outside` (default — the
   * whole dialog grows and the overlay/page scrolls) or `inside` (the body scrolls while the header +
   * footer stay pinned). Ignored for side-drawer placements (`left`/`right`), which always scroll inside.
   */
  scrollBehavior?: ModalScrollBehavior
  /**
   * Where the dialog sits: `center` (default — the standard centered modal), or `left` / `right` to
   * make it a **full-height side drawer** (sheet) that slides in from that edge. A drawer takes its
   * width from `size`, fills the viewport height, and always scrolls its body inside (header + footer
   * stay pinned).
   */
  placement?: ModalPlacement
  /** Header title. When set, labels the dialog (`aria-labelledby`). */
  title?: ReactNode
  /** Muted description line under the title (e.g. a confirm prompt). */
  description?: ReactNode
  /** Leading header icon shown in a tinted box (like `Card`) — a known `IconName` or any node. */
  icon?: IconName | ReactNode
  /** Theme color that tints the leading icon box. Defaults to `accent`. */
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
 * or `fullScreen`; `scrollBehavior` picks inside-body vs. whole-dialog scrolling. `placement` turns it
 * into a full-height side drawer (`left`/`right`) that slides in from the edge. The header mirrors
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
    scrollBehavior = 'outside',
    placement = 'center',
    title,
    description,
    icon,
    color = 'accent',
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
  const titleId = useId()
  const descId = useId()

  // portal + scrim + scroll-lock + fade-in + backdrop-dismiss are handled by the shared `<Overlay>`

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

  // trap Tab within the dialog so focus can't strand on the locked page behind it (Escape + backdrop
  // dismissal live in `<Overlay>`; this fires after the overlay's own handler)
  const handleTabTrap = (event: KeyboardEvent<HTMLDivElement>) => {
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

  if (!open) return null

  // a side drawer (left/right) is always full-height with the body scrolling inside (header/footer pinned)
  const isDrawer = placement !== 'center'

  const renderedIcon =
    icon == null ? null : typeof icon === 'string' && ICON_NAME_SET.has(icon) ? (
      <Icon name={icon as IconName} />
    ) : (
      icon
    )

  const hasHeader = title != null || description != null || renderedIcon != null || showCloseButton
  // a divider sets the header apart from the body/footer, like Card
  const headerDivided = children != null || footer != null

  return (
    <Overlay
      open={open}
      onClose={onClose}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
      onKeyDown={handleTabTrap}
      className={styles.overlay}
      data-size={size}
      data-placement={placement}
      data-scroll={isDrawer ? 'inside' : scrollBehavior}
    >
      <div
        ref={setPanelRef}
        className={clsx(styles.modal, styles[size], className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title != null ? titleId : undefined}
        aria-label={title == null ? ariaLabel : undefined}
        aria-describedby={description != null ? descId : undefined}
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
                <Icon name="Close" />
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
    </Overlay>
  )
})
