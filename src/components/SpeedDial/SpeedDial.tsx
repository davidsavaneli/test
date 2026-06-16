import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { ICON_NAMES, type IconName } from '../../icons/names'
import type { ThemeColor } from '../../theme'
import type { TooltipPlacement } from '../Tooltip'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { SpeedDialAction } from './SpeedDialAction'
import {
  SpeedDialContext,
  type SpeedDialActionSize,
  type SpeedDialContextValue,
} from './speedDialContext'
import styles from './SpeedDial.module.css'

const ICON_NAME_SET = new Set<string>(ICON_NAMES)

export type SpeedDialSize = 'sm' | 'md' | 'lg'
export type SpeedDialDirection = 'up' | 'down' | 'left' | 'right'

/** The FAB size → the (smaller) action-button size. */
const ACTION_SIZE: Record<SpeedDialSize, SpeedDialActionSize> = { sm: 'sm', md: 'sm', lg: 'md' }
/** Tooltip side per direction — labels sit left of a vertical dial, above a horizontal one. */
const TOOLTIP_PLACEMENT: Record<SpeedDialDirection, TooltipPlacement> = {
  up: 'left',
  down: 'left',
  left: 'top',
  right: 'top',
}

/** A data-driven action for the `actions` prop. */
export interface SpeedDialActionItem {
  /** Stable key (falls back to the index). */
  key?: string
  icon: IconName | ReactNode
  label?: ReactNode
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
}

export interface SpeedDialProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'onChange'> {
  /** Accessible label for the FAB (required — it's icon-only). */
  ariaLabel: string
  /** FAB icon. Defaults to `Add` (a `+`). */
  icon?: IconName | ReactNode
  /** Icon shown while open. Omit to rotate the `icon` 45° instead (a `+` becomes a `×`). */
  openIcon?: IconName | ReactNode
  /** Which way the actions fan out. Defaults to `up`. */
  direction?: SpeedDialDirection
  /** Brand token tinting the FAB. Defaults to `primary`. */
  color?: ThemeColor
  /** FAB size (actions render one step smaller). Defaults to `md`. */
  size?: SpeedDialSize
  /** Controlled open state. */
  open?: boolean
  /** Initial open state for uncontrolled use. Defaults to `false`. */
  defaultOpen?: boolean
  /** Fires with the next open state. */
  onOpenChange?: (open: boolean) => void
  /** Open on hover (also opens on click). Defaults to `true`. */
  openOnHover?: boolean
  /** Close the dial after an action is clicked. Defaults to `true`. */
  closeOnActionClick?: boolean
  /** Show every action's label persistently while open (no hover needed) — like MUI's `tooltipOpen`. */
  tooltipOpen?: boolean
  /** Data-driven actions — an alternative to `<SpeedDialAction>` children. */
  actions?: SpeedDialActionItem[]
  /** Disables the FAB (and hover-opening). */
  disabled?: boolean
  /** `<SpeedDialAction>` children (used when `actions` is not given). */
  children?: ReactNode
}

/**
 * A floating action button that reveals a set of related actions on hover / click — fanning out in
 * `direction` (`up` default). The FAB icon rotates 45° when open (a `+` → `×`) unless an `openIcon` is
 * given. Each `<SpeedDialAction>` is a small circular button with a tooltip label; supply them via the
 * data-driven `actions` prop or as children. Opens on hover (`openOnHover`) and click; closes on
 * outside-pointerdown, Escape (refocusing the FAB), or selecting an action. Controlled (`open` +
 * `onOpenChange`) or uncontrolled (`defaultOpen`). The ref points at the root; position it (e.g.
 * `fixed` bottom-right) via `style`/`className`. The FAB carries `aria-expanded`/`aria-controls`.
 */
export const SpeedDial = forwardRef<HTMLDivElement, SpeedDialProps>(function SpeedDial(
  {
    ariaLabel,
    icon = 'Add',
    openIcon,
    direction = 'up',
    color = 'primary',
    size = 'md',
    open,
    defaultOpen = false,
    onOpenChange,
    openOnHover = true,
    closeOnActionClick = true,
    tooltipOpen = false,
    actions,
    disabled = false,
    children,
    className,
    style,
    ...props
  },
  forwardedRef,
) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const fabRef = useRef<HTMLButtonElement | null>(null)
  const actionsId = useId()

  const isControlled = open !== undefined
  const [internal, setInternal] = useState(defaultOpen)
  const isOpen = isControlled ? open : internal

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternal(next)
    onOpenChange?.(next)
  }
  // keep a stable reference for the document listeners below
  const setOpenRef = useRef(setOpen)
  setOpenRef.current = setOpen

  // while open: close on outside pointerdown / Escape (Escape refocuses the FAB)
  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpenRef.current(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenRef.current(false)
        fabRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const setRootRef = (node: HTMLDivElement | null) => {
    rootRef.current = node
    if (typeof forwardedRef === 'function') forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }

  const renderIcon = (value: IconName | ReactNode) =>
    typeof value === 'string' && ICON_NAME_SET.has(value) ? (
      <Icon name={value as IconName} />
    ) : (
      value
    )

  const ctx: SpeedDialContextValue = {
    size: ACTION_SIZE[size],
    placement: TOOLTIP_PLACEMENT[direction],
    closeOnClick: closeOnActionClick,
    persistentLabels: tooltipOpen,
    requestClose: () => setOpen(false),
  }

  const hoverProps =
    openOnHover && !disabled
      ? { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) }
      : {}

  return (
    <div
      ref={setRootRef}
      className={clsx(styles.speedDial, className)}
      style={style as CSSProperties}
      {...hoverProps}
      {...props}
    >
      <div
        id={actionsId}
        className={clsx(styles.actions, styles[direction])}
        data-open={isOpen ? 'true' : 'false'}
      >
        <SpeedDialContext.Provider value={ctx}>
          {actions
            ? actions.map((action, index) => (
                <SpeedDialAction
                  key={action.key ?? index}
                  icon={action.icon}
                  label={action.label}
                  onClick={action.onClick}
                  disabled={action.disabled}
                />
              ))
            : children}
        </SpeedDialContext.Provider>
      </div>

      <IconButton
        ref={fabRef}
        rounded
        variant="contained"
        color={color}
        size={size}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={actionsId}
        className={styles.fab}
        onClick={() => setOpen(!isOpen)}
      >
        <span className={clsx(styles.fabIcon, !openIcon && isOpen && styles.fabIconOpen)}>
          {isOpen && openIcon != null ? renderIcon(openIcon) : renderIcon(icon)}
        </span>
      </IconButton>
    </div>
  )
})
