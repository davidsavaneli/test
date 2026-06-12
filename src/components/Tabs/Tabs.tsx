import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
import { ICON_NAMES, type IconName } from '../../icons/names'
import { Icon } from '../Icon'
import styles from './Tabs.module.css'

const ICON_NAME_SET = new Set<string>(ICON_NAMES)

export type TabsVariant = 'underline' | 'pill'
export type TabsSize = 'sm' | 'md' | 'lg'
export type TabsOrientation = 'horizontal' | 'vertical'

export interface TabItem {
  /** Unique value — also what's written to the URL query and passed to `onChange`. */
  value: string
  /** Tab label. */
  label?: ReactNode
  /** Accessible name — required for an icon-only tab (no visible `label`); falls back to `value`. */
  ariaLabel?: string
  /** Leading icon — a known `IconName` or any node. */
  icon?: IconName | ReactNode
  /** Disables the tab (not selectable; skipped by keyboard nav). */
  disabled?: boolean
  /** Tints the tab in the error color (e.g. its section has validation errors). */
  error?: boolean
  /** Small dot indicator (rendered with `Badge`). */
  dot?: boolean
  /** Count / text indicator (rendered with `Badge`); wins over `dot`. */
  badge?: number | string
  /** Panel content rendered below (or beside) the strip while this tab is active. Optional. */
  content?: ReactNode
}

export interface TabsProps {
  /** The tabs. */
  items: TabItem[]
  /** Controlled active value. */
  value?: string
  /**
   * Initial active value (uncontrolled). Falls back to the URL query (when `queryKey` is set and
   * present) and otherwise the first enabled tab.
   */
  defaultValue?: string
  /** Fires with the next active value. */
  onChange?: (value: string) => void
  /**
   * Sync the active tab to the URL query under this param name (e.g. `'tab'` → `?tab=general`), so a
   * page refresh restores it. Omit for no URL sync (state only). The name is yours to pick.
   */
  queryKey?: string
  /**
   * Push a history entry on each tab change, so the browser **Back** button returns to the previous
   * tab. Defaults to `false` — tab changes **replace** the URL, so Back leaves the page instead of
   * stepping through tabs (and `popstate` still restores a tab when one is in the query).
   */
  pushHistory?: boolean
  /** Visual style. Defaults to `'underline'`. */
  variant?: TabsVariant
  /** Preset size. Defaults to `'md'`. */
  size?: TabsSize
  /** Brand token tinting the active tab. Defaults to `'primary'`. */
  color?: ThemeColor
  /** Strip direction. Defaults to `'horizontal'`. */
  orientation?: TabsOrientation
  /** Stretch the tabs to fill the strip equally (horizontal only). */
  fullWidth?: boolean
  /** Accessible label for the tablist. */
  'aria-label'?: string
  className?: string
  style?: CSSProperties
}

/**
 * A tab strip with optional panels. Data-driven via `items` (each: `label`, `icon`, `disabled`,
 * `error`, `dot`/`badge` via `Badge`, optional `content`). Controlled (`value` + `onChange`) or
 * uncontrolled (`defaultValue`). Set **`queryKey`** to sync the active tab to the URL query
 * (`?<queryKey>=<value>`) so a refresh restores it — by default tab changes **replace** the URL (so
 * Back doesn't step through tabs); pass **`pushHistory`** to make Back navigate tabs. Full keyboard
 * support (Arrows / Home / End, roving tabindex) and `role="tablist"`/`tab`/`tabpanel` a11y.
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    items,
    value,
    defaultValue,
    onChange,
    queryKey,
    pushHistory = false,
    variant = 'underline',
    size = 'md',
    color = 'primary',
    orientation = 'horizontal',
    fullWidth = false,
    className,
    style,
    'aria-label': ariaLabel,
  },
  ref,
) {
  const reactId = useId()

  const isSelectable = useCallback(
    (v: string | null | undefined): v is string =>
      !!v && items.some((i) => i.value === v && !i.disabled),
    [items],
  )

  const readQuery = useCallback((): string | null => {
    if (!queryKey || typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get(queryKey)
  }, [queryKey])

  const firstEnabled = items.find((i) => !i.disabled)?.value ?? items[0]?.value

  const [internal, setInternal] = useState<string | undefined>(() => {
    const q = readQuery()
    if (isSelectable(q)) return q
    return isSelectable(defaultValue) ? defaultValue : firstEnabled
  })
  const isControlled = value !== undefined
  const raw = isControlled ? value : internal
  // clamp to a present, enabled tab — guarantees a focusable roving tabstop + a rendered panel (no
  // keyboard trap) and keeps a bogus/disabled value out of the URL; falls back to the first enabled tab
  const active = isSelectable(raw) ? raw : firstEnabled

  // keep the latest active / onChange / push-intent for the stable effects + popstate listener
  const activeRef = useRef(active)
  activeRef.current = active
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const pushIntent = useRef(false)

  const writeQuery = useCallback(
    (next: string, push: boolean) => {
      if (!queryKey || typeof window === 'undefined') return
      const params = new URLSearchParams(window.location.search)
      if (params.get(queryKey) === next) return
      params.set(queryKey, next)
      const url = `${window.location.pathname}?${params.toString()}${window.location.hash}`
      window.history[push ? 'pushState' : 'replaceState'](window.history.state, '', url)
    },
    [queryKey],
  )

  const select = (next: string) => {
    if (next === activeRef.current) return
    pushIntent.current = true
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }

  // mirror the *resolved* active tab into the URL whenever it changes (and on mount = canonicalize), so
  // the URL never holds a bogus value and a controlled value-change still syncs. A user-driven change
  // `push`es when `pushHistory` (Back walks tabs); programmatic / popstate changes just `replace`.
  useEffect(() => {
    if (!queryKey || typeof window === 'undefined' || active == null) return
    const push = pushIntent.current && pushHistory
    pushIntent.current = false
    writeQuery(active, push)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, active, pushHistory, writeQuery])

  // Back/Forward → restore the tab from the query
  useEffect(() => {
    if (!queryKey || typeof window === 'undefined') return
    const onPopState = () => {
      const q = readQuery()
      if (isSelectable(q) && q !== activeRef.current) {
        if (value === undefined) setInternal(q)
        onChangeRef.current?.(q)
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [queryKey, readQuery, isSelectable, value])

  const tablistRef = useRef<HTMLDivElement | null>(null)
  const tabSelector = (v: string) =>
    `[data-value="${typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(v) : v}"]`
  const focusTab = (v: string) => {
    tablistRef.current?.querySelector<HTMLElement>(tabSelector(v))?.focus()
  }

  // keep the active tab in view when the strip scrolls horizontally (overflow)
  useEffect(() => {
    if (active == null) return
    tablistRef.current
      ?.querySelector<HTMLElement>(tabSelector(active))
      ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter((i) => !i.disabled)
    if (enabled.length === 0) return
    const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
    const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
    const current = enabled.findIndex((i) => i.value === active)
    let target = -1
    switch (event.key) {
      case prevKey:
        target = (current - 1 + enabled.length) % enabled.length
        break
      case nextKey:
        target = (current + 1) % enabled.length
        break
      case 'Home':
        target = 0
        break
      case 'End':
        target = enabled.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    const next = enabled[target].value
    select(next)
    focusTab(next)
  }

  const renderIcon = (icon: TabItem['icon']) =>
    typeof icon === 'string' && ICON_NAME_SET.has(icon) ? (
      <Icon name={icon as IconName} size={size} />
    ) : (
      icon
    )

  const activeItem = items.find((i) => i.value === active)
  const panelId = `${reactId}-panel`
  const tabId = (v: string) => `${reactId}-tab-${v}`

  return (
    <div ref={ref} className={clsx(styles.root, styles[orientation], className)} style={style}>
      <div
        ref={tablistRef}
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation={orientation}
        className={clsx(
          styles.tablist,
          styles[variant],
          styles[size],
          styles[orientation],
          fullWidth && orientation === 'horizontal' && styles.fullWidth,
        )}
        onKeyDown={handleKeyDown}
      >
        {items.map((item) => {
          const selected = item.value === active
          const tint = item.error ? 'error' : color
          const icon = renderIcon(item.icon)
          const hasCount = item.badge != null && item.badge !== 0
          const showDot = !hasCount && item.dot
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              data-value={item.value}
              id={tabId(item.value)}
              aria-selected={selected}
              aria-label={item.label == null ? (item.ariaLabel ?? item.value) : item.ariaLabel}
              aria-controls={selected && item.content != null ? panelId : undefined}
              aria-disabled={item.disabled || undefined}
              disabled={item.disabled}
              tabIndex={selected ? 0 : -1}
              className={clsx(styles.tab, selected && styles.active, item.error && styles.error)}
              style={
                {
                  '--tz-btn-rgb': `var(--tz-color-${tint}-rgb)`,
                  '--tz-btn-on': `var(--tz-color-${tint}-contrast, #fff)`,
                } as CSSProperties
              }
              onClick={() => select(item.value)}
            >
              <span className={styles.inner}>
                {icon != null && <span className={styles.icon}>{icon}</span>}
                {item.label != null && <span className={styles.label}>{item.label}</span>}
                {hasCount && (
                  <span className={styles.count}>
                    {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
                {showDot && <span className={styles.dot} aria-hidden="true" />}
              </span>
            </button>
          )
        })}
      </div>

      {activeItem?.content != null && active != null && (
        <div
          role="tabpanel"
          id={panelId}
          aria-labelledby={tabId(active)}
          tabIndex={0}
          className={styles.panel}
        >
          {activeItem.content}
        </div>
      )}
    </div>
  )
})
