import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import {
  Link,
  Navigate,
  useNavigate,
  useRouter,
  useRouterState,
  type LinkProps,
  type StaticDataRouteOption,
} from '@tanstack/react-router'
import { clsx } from 'clsx'
import { Icon } from '../Icon'
import { List, ListItem, type ListItemProps } from '../List'
import { TextField } from '../TextField'
import type { ThemeColor } from '../../theme'
import type { IconName } from '../../icons/names'
import { hasAccess, useAccessKeys } from '../../helpers/access'
import styles from './Sidebar.module.css'

// `ListItem` rendered as a TanStack `Link` — it forwards unrecognized props (like `to`) to the
// element, so this typed alias lets us pass `to` while keeping `ListItem`'s look + behavior.
const NavLink = ListItem as unknown as (props: ListItemProps & { to: string }) => ReactNode

export type { IconName }

// Typed `staticData` for consumers — every route describes its own menu entry.
declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** Menu label. A route with no `name` never appears in the menu. */
    name?: string
    /** Optional menu icon (the library's `IconName` union). */
    icon?: IconName
    /** Sort order within the parent (ascending); falls back to alphabetical. */
    order?: number
    /** Routed but hidden from the menu. */
    hidden?: boolean
    /** Allowed accessKeys (OR — user needs any one). Omitted/empty = public. */
    roles?: string[]
    /** Small text label (e.g. `"New"`) shown as a pill on the menu row. */
    badge?: string
    /** Theme color of a small dot indicator on the menu row (e.g. `"error"`). */
    dot?: ThemeColor
  }
}

export interface NavLeaf {
  label: string
  to: string
  icon?: IconName
  badge?: string
  dot?: ThemeColor
}
export interface NavGroup {
  label: string
  icon?: IconName
  to?: string
  badge?: string
  dot?: ThemeColor
  children?: NavLeaf[]
}
export interface NavModule {
  module: string
  icon?: IconName
  groups: NavGroup[]
}

const prettify = (seg: string) =>
  seg
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
const trimSlashes = (p: string) => p.replace(/^\/+|\/+$/g, '')
const byOrderThenLabel = (
  a: { order: number; label: string },
  b: { order: number; label: string },
) => a.order - b.order || a.label.localeCompare(b.label)

interface LeafAcc {
  label: string
  to: string
  icon?: IconName
  badge?: string
  dot?: ThemeColor
  order: number
}
interface GroupAcc {
  label: string
  icon?: IconName
  to?: string
  badge?: string
  dot?: ThemeColor
  order: number
  leaves: LeafAcc[]
  isContainer: boolean
}
interface ModuleAcc {
  label: string
  icon?: IconName
  order: number
  groups: Map<string, GroupAcc>
}

/** A single route, reduced to what the menu needs. */
export interface NavRoute {
  fullPath: string
  staticData?: StaticDataRouteOption
}

/**
 * Pure menu builder — derives the 3-level nav tree (module → group → page) from a flat route list.
 * Kept router-free so it's unit-testable; `useNavTree` feeds it the live routes.
 */
export function buildNavTree(routes: NavRoute[]): { links: NavLeaf[]; modules: NavModule[] } {
  const entries: Array<{ path: string; name: string; sd: StaticDataRouteOption }> = []
  for (const route of routes) {
    const sd = route.staticData
    const path = trimSlashes(route.fullPath)
    if (!sd?.name || !path) continue
    entries.push({ path, name: sd.name, sd })
  }

  const metaByPath = new Map(entries.map((e) => [e.path, e]))
  const paths = entries.map((e) => e.path)
  const isContainer = (p: string) => paths.some((o) => o !== p && o.startsWith(`${p}/`))
  const rawFullPaths = new Set(routes.map((r) => r.fullPath))
  const groupHasOwnPage = (groupKey: string) => rawFullPaths.has(`/${groupKey}/`)

  const chrome = (key: string, seg: string) => {
    const e = metaByPath.get(key)
    return {
      label: e?.name ?? prettify(seg),
      icon: e?.sd.icon,
      badge: e?.sd.badge,
      dot: e?.sd.dot,
      order: e?.sd.order ?? Number.POSITIVE_INFINITY,
    }
  }

  const modules = new Map<string, ModuleAcc>()
  const getModule = (seg: string) => {
    let mod = modules.get(seg)
    if (!mod) {
      const c = chrome(seg, seg)
      mod = { label: c.label, icon: c.icon, order: c.order, groups: new Map() }
      modules.set(seg, mod)
    }
    return mod
  }

  const topLinks: LeafAcc[] = []
  for (const { path, name, sd } of entries) {
    const segs = path.split('/')
    // The menu is 3 levels deep by design (module → group → page). A path only counts as a
    // "container" (holds children instead of being its own row) at the module/group levels; a
    // depth-3+ route is always a leaf, so a named page with even-deeper children isn't dropped.
    // Routes deeper than 3 segments still appear — flattened as leaves under their depth-2 group
    // (their `to` stays correct) — the nav just can't nest beyond level 3.
    if ((segs.length <= 2 && isContainer(path)) || sd.hidden) continue
    if (segs.length === 1) {
      topLinks.push({
        label: name,
        to: `/${path}`,
        icon: sd.icon,
        badge: sd.badge,
        dot: sd.dot,
        order: sd.order ?? Number.POSITIVE_INFINITY,
      })
      continue
    }
    const mod = getModule(segs[0])
    if (segs.length === 2) {
      mod.groups.set(path, {
        label: name,
        icon: sd.icon,
        to: `/${path}`,
        badge: sd.badge,
        dot: sd.dot,
        order: sd.order ?? Number.POSITIVE_INFINITY,
        leaves: [],
        isContainer: false,
      })
    } else {
      const groupKey = segs.slice(0, 2).join('/')
      let group = mod.groups.get(groupKey)
      if (!group) {
        const c = chrome(groupKey, segs[1])
        group = {
          label: c.label,
          icon: c.icon,
          badge: c.badge,
          dot: c.dot,
          order: c.order,
          to: groupHasOwnPage(groupKey) ? `/${groupKey}` : undefined,
          leaves: [],
          isContainer: true,
        }
        mod.groups.set(groupKey, group)
      }
      group.leaves.push({
        label: name,
        to: `/${path}`,
        icon: sd.icon,
        badge: sd.badge,
        dot: sd.dot,
        order: sd.order ?? Number.POSITIVE_INFINITY,
      })
    }
  }

  return {
    links: topLinks
      .sort(byOrderThenLabel)
      .map((l) => ({ label: l.label, to: l.to, icon: l.icon, badge: l.badge, dot: l.dot })),
    modules: [...modules.values()].sort(byOrderThenLabel).map(
      (mod): NavModule => ({
        module: mod.label,
        icon: mod.icon,
        groups: [...mod.groups.values()].sort(byOrderThenLabel).map(
          (g): NavGroup => ({
            label: g.label,
            icon: g.icon,
            to: g.to,
            badge: g.badge,
            dot: g.dot,
            children: g.isContainer
              ? g.leaves.sort(byOrderThenLabel).map((l) => ({
                  label: l.label,
                  to: l.to,
                  icon: l.icon,
                  badge: l.badge,
                  dot: l.dot,
                }))
              : undefined,
          }),
        ),
      }),
    ),
  }
}

function useNavTree(): { links: NavLeaf[]; modules: NavModule[] } {
  const router = useRouter()
  const accessKeys = useAccessKeys() // re-render the menu when the user's roles change (login/logout)
  return useMemo(
    () =>
      buildNavTree(
        Object.values(router.looseRoutesById)
          .map((route) => ({
            fullPath: route.fullPath,
            staticData: route.options?.staticData,
          }))
          // Drop pages the current user can't access — empty groups/modules then vanish on their own.
          .filter((route) => hasAccess(route.staticData?.roles)),
      ),
    [router, accessKeys],
  )
}

/** The first menu destination (top link, else first group/leaf) — used by `FirstRouteRedirect`. */
export function firstNavTo(tree: { links: NavLeaf[]; modules: NavModule[] }): string | undefined {
  if (tree.links[0]) return tree.links[0].to
  for (const mod of tree.modules)
    for (const group of mod.groups) {
      if (group.to) return group.to
      const firstChild = group.children?.[0]
      if (firstChild) return firstChild.to
    }
  return undefined
}

function useFirstNavTo() {
  return firstNavTo(useNavTree())
}

/**
 * The current page's title — the `staticData.name` of the deepest matched route that declares one.
 * Used by `RootLayout` to label the header automatically (e.g. "Dashboard").
 */
export function usePageTitle(): string | undefined {
  const router = useRouter()
  const matches = useRouterState({ select: (s) => s.matches })
  for (let i = matches.length - 1; i >= 0; i--) {
    const route = router.looseRoutesById[matches[i].routeId]
    const name = route?.options?.staticData?.name
    if (name) return name
  }
  return undefined
}

/** One breadcrumb. `to` is set only when the crumb points at a real, navigable menu page. */
export interface Breadcrumb {
  label: string
  to?: string
}

/** Every `to` that the menu actually navigates to (top links, group pages, leaves). */
function navigablePaths(tree: { links: NavLeaf[]; modules: NavModule[] }): Set<string> {
  const set = new Set<string>()
  for (const link of tree.links) set.add(link.to)
  for (const mod of tree.modules)
    for (const group of mod.groups) {
      if (group.to) set.add(group.to)
      for (const leaf of group.children ?? []) set.add(leaf.to)
    }
  return set
}

/**
 * Breadcrumb trail for the current route, derived from the active match chain: one crumb per matched
 * route that declares a `staticData.name` (module → group → page). `homeTo` is the first allowed menu
 * page (same target as `FirstRouteRedirect`). Intermediate crumbs link only when they map to a real
 * navigable page; the last crumb (the current page) is always plain text.
 */
export function useBreadcrumbs(): { homeTo?: string; items: Breadcrumb[] } {
  const tree = useNavTree()
  const matches = useRouterState({ select: (s) => s.matches })
  const homeTo = firstNavTo(tree)
  const navigable = navigablePaths(tree)

  const items: Breadcrumb[] = []
  for (const match of matches) {
    const name = match.staticData?.name
    if (!name) continue
    const full = `/${trimSlashes(match.pathname)}`
    items.push({ label: name, to: navigable.has(full) ? full : undefined })
  }
  // The current page is where you already are — never a link.
  if (items.length > 0) items[items.length - 1] = { label: items[items.length - 1].label }
  return { homeTo, items }
}

/** Drop-in component for the `/` route: forwards to whatever sits FIRST in the menu. */
export function FirstRouteRedirect() {
  const to = useFirstNavTo()
  return to ? <Navigate to={to as LinkProps['to']} /> : null
}

/** Auto-generated navigation, derived from the routes' `staticData`. Rendered inside `RootLayout`. */
export function Sidebar() {
  const { links, modules } = useNavTree()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className={styles.nav}>
      {links.length > 0 ? (
        <List>
          {links.map((link) => (
            <NavLink
              key={link.to}
              as={Link}
              to={link.to}
              icon={link.icon}
              selected={pathname === link.to}
              clickable
              trailing={navTrailing(link.badge, link.dot)}
            >
              {link.label}
            </NavLink>
          ))}
        </List>
      ) : null}
      {modules.map((mod) => (
        <div className={styles.module} key={mod.module}>
          <div className={styles.moduleLabel}>{mod.module}</div>
          <List>
            {mod.groups.map((group) => (
              <NavGroupItem key={group.label} group={group} pathname={pathname} />
            ))}
          </List>
        </div>
      ))}
    </nav>
  )
}

/** A single searchable destination — a nav page flattened out of the tree, with a breadcrumb context. */
interface NavPage {
  label: string
  to: string
  /** Where it lives — e.g. `"Components · Forms"` — shown as the muted second line. */
  context?: string
}

/** Flatten the nav tree into every navigable page (top links + group pages + leaves). */
function flattenPages(tree: { links: NavLeaf[]; modules: NavModule[] }): NavPage[] {
  const pages: NavPage[] = []
  for (const link of tree.links) pages.push({ label: link.label, to: link.to })
  for (const mod of tree.modules)
    for (const group of mod.groups) {
      if (group.to) pages.push({ label: group.label, to: group.to, context: mod.module })
      for (const leaf of group.children ?? [])
        pages.push({
          label: leaf.label,
          to: leaf.to,
          context: `${mod.module} · ${group.label}`,
        })
    }
  return pages
}

const MAX_SEARCH_RESULTS = 8

/**
 * Header search over the sidebar's pages — type to filter the nav (by page name or its section) and
 * pick a suggestion to jump there. Data comes from the same `useNavTree` the sidebar uses (so it
 * respects RBAC). Keyboard: Up/Down move, Enter opens, Escape closes. Rendered by `RootLayout`'s header.
 */
export function NavSearch() {
  const tree = useNavTree()
  const navigate = useNavigate()
  const pages = useMemo(() => flattenPages(tree), [tree])

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return pages
      .filter(
        (p) => p.label.toLowerCase().includes(q) || (p.context?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, MAX_SEARCH_RESULTS)
  }, [pages, query])

  const showList = open && results.length > 0

  // reset the highlighted row whenever the query changes
  useEffect(() => setActive(0), [query])

  // clamp the highlight if the result set shrinks without a query change (e.g. RBAC pages update)
  useEffect(() => {
    setActive((a) => (a > results.length - 1 ? Math.max(0, results.length - 1) : a))
  }, [results.length])

  // close the suggestions on an outside pointerdown
  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const go = (to: string) => {
    navigate({ to: to as LinkProps['to'] })
    setQuery('')
    setOpen(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => (i + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (i - 1 + results.length) % results.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const hit = results[active]
      if (hit) go(hit.to)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div
      ref={rootRef}
      className={styles.search}
      role="combobox"
      aria-expanded={showList}
      aria-haspopup="listbox"
    >
      <TextField
        value={query}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        adornment={<Icon name="SearchNormal" />}
        placeholder="Search pages…"
        aria-label="Search pages"
        autoComplete="off"
      />
      {showList ? (
        <div className={styles.searchPanel}>
          <List role="listbox">
            {results.map((page, i) => (
              <ListItem
                key={page.to}
                description={page.context}
                clickable
                selected={i === active}
                // keep the input focused through the click so blur doesn't close the list first
                onMouseDown={(event: MouseEvent) => event.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(page.to)}
              >
                {page.label}
              </ListItem>
            ))}
          </List>
        </div>
      ) : null}
    </div>
  )
}

function groupIsActive(group: NavGroup, pathname: string): boolean {
  if (group.to && pathname === group.to) return true
  return group.children?.some((leaf) => leaf.to === pathname) ?? false
}

/** A small "New"-style pill rendered on a menu row from `staticData.badge`. */
function navBadge(text?: string) {
  return text ? <span className={styles.navBadge}>{text}</span> : null
}

/** A small colored dot indicator on a menu row from `staticData.dot`. */
function navDot(color?: ThemeColor) {
  return color ? (
    <span className={styles.navDot} style={{ background: `var(--tz-color-${color})` }} />
  ) : null
}

/** The menu row's trailing slot: dot + badge + an optional chevron (omitted entirely when empty). */
function navTrailing(badge?: string, dot?: ThemeColor, chevron?: ReactNode): ReactNode {
  if (badge == null && dot == null && chevron == null) return undefined
  return (
    <>
      {navBadge(badge)}
      {navDot(dot)}
      {chevron}
    </>
  )
}

function NavGroupItem({ group, pathname }: { group: NavGroup; pathname: string }) {
  const active = groupIsActive(group, pathname)
  const hasChildren = !!group.children?.length
  const [open, setOpen] = useState(active)

  // re-open when navigation makes this group active via a path the mount-time seed missed
  // (NavSearch, Breadcrumbs, back/forward) — collapsing an active group hides the current page
  useEffect(() => {
    if (active) setOpen(true)
  }, [active])

  // a plain level-2 page (no children) — just a link row
  if (!hasChildren && group.to) {
    return (
      <NavLink
        as={Link}
        to={group.to}
        icon={group.icon}
        selected={active}
        clickable
        trailing={navTrailing(group.badge, group.dot)}
      >
        {group.label}
      </NavLink>
    )
  }

  const chevron = (
    <Icon
      name="ArrowDown4"
      size="sm"
      className={styles.chevron}
      data-open={open ? 'true' : 'false'}
    />
  )

  return (
    <>
      {hasChildren && group.to ? (
        // "Case B": the row navigates (and expands); a separate chevron only toggles.
        <NavLink
          as={Link}
          to={group.to}
          icon={group.icon}
          selected={active}
          clickable
          onClick={() => setOpen(true)}
          trailing={navTrailing(
            group.badge,
            group.dot,
            <button
              type="button"
              className={styles.chevronButton}
              aria-label={`${open ? 'Collapse' : 'Expand'} ${group.label}`}
              aria-expanded={open}
              onClick={(event: MouseEvent) => {
                event.preventDefault()
                event.stopPropagation()
                setOpen((o) => !o)
              }}
            >
              {chevron}
            </button>,
          )}
        >
          {group.label}
        </NavLink>
      ) : (
        // a pure container — the whole row toggles its children
        <ListItem
          icon={group.icon}
          selected={active}
          clickable
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          trailing={navTrailing(group.badge, group.dot, chevron)}
        >
          {group.label}
        </ListItem>
      )}
      {hasChildren ? (
        // smooth collapse, same grid-template-rows technique as Card
        <div className={clsx(styles.collapsible, !open && styles.collapsibleClosed)}>
          <div className={styles.collapsibleInner}>
            <List className={styles.leaves}>
              {group.children?.map((leaf) => (
                <NavLink
                  key={leaf.to}
                  as={Link}
                  to={leaf.to}
                  icon={<span className={styles.leafDot} />}
                  selected={pathname === leaf.to}
                  size="md"
                  clickable
                  trailing={navTrailing(leaf.badge, leaf.dot)}
                >
                  {leaf.label}
                </NavLink>
              ))}
            </List>
          </div>
        </div>
      ) : null}
    </>
  )
}
