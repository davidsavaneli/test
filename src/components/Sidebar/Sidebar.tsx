import { useMemo, useState } from 'react'
import {
  Link,
  Navigate,
  useRouter,
  useRouterState,
  type LinkProps,
  type StaticDataRouteOption,
} from '@tanstack/react-router'
import { Icon } from '../Icon'
import type { IconName } from '../../icons/names'
import { hasAccess, useAccessKeys } from '../../helpers/access'
import styles from './Sidebar.module.css'

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
  }
}

export interface NavLeaf {
  label: string
  to: string
  icon?: IconName
}
export interface NavGroup {
  label: string
  icon?: IconName
  to?: string
  children?: NavLeaf[]
}
export interface NavModule {
  module: string
  icon?: IconName
  groups: NavGroup[]
}

const linkTo = (to: string) => to as LinkProps['to']
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
  order: number
}
interface GroupAcc {
  label: string
  icon?: IconName
  to?: string
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
    if (isContainer(path) || sd.hidden) continue
    const segs = path.split('/')
    if (segs.length === 1) {
      topLinks.push({
        label: name,
        to: `/${path}`,
        icon: sd.icon,
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
        order: sd.order ?? Number.POSITIVE_INFINITY,
      })
    }
  }

  return {
    links: topLinks.sort(byOrderThenLabel).map((l) => ({ label: l.label, to: l.to, icon: l.icon })),
    modules: [...modules.values()].sort(byOrderThenLabel).map(
      (mod): NavModule => ({
        module: mod.label,
        icon: mod.icon,
        groups: [...mod.groups.values()].sort(byOrderThenLabel).map(
          (g): NavGroup => ({
            label: g.label,
            icon: g.icon,
            to: g.to,
            children: g.isContainer
              ? g.leaves
                  .sort(byOrderThenLabel)
                  .map((l) => ({ label: l.label, to: l.to, icon: l.icon }))
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
        <div className={styles.navModule}>
          {links.map((link) => (
            <Link
              key={link.to}
              to={linkTo(link.to)}
              className={styles.navRow}
              data-active={pathname === link.to ? 'true' : undefined}
            >
              <GroupIcon icon={link.icon} />
              <span className={styles.navRowLabel}>{link.label}</span>
            </Link>
          ))}
        </div>
      ) : null}
      {modules.map((mod) => (
        <div className={styles.navModule} key={mod.module}>
          <div className={styles.navModuleLabel}>
            {mod.icon ? <Icon name={mod.icon} size="sm" /> : null}
            {mod.module}
          </div>
          {mod.groups.map((group) => (
            <NavGroupItem key={group.label} group={group} pathname={pathname} />
          ))}
        </div>
      ))}
    </nav>
  )
}

function groupIsActive(group: NavGroup, pathname: string): boolean {
  if (group.to && pathname === group.to) return true
  return group.children?.some((leaf) => leaf.to === pathname) ?? false
}

function NavGroupItem({ group, pathname }: { group: NavGroup; pathname: string }) {
  const active = groupIsActive(group, pathname)
  const hasChildren = !!group.children?.length
  const [open, setOpen] = useState(active)
  const toggle = () => setOpen((o) => !o)
  const toggleLabel = `${open ? 'Collapse' : 'Expand'} ${group.label}`

  if (!hasChildren && group.to) {
    return (
      <Link
        to={linkTo(group.to)}
        className={styles.navRow}
        data-active={active ? 'true' : undefined}
      >
        <GroupIcon icon={group.icon} />
        <span className={styles.navRowLabel}>{group.label}</span>
      </Link>
    )
  }

  const header =
    hasChildren && group.to ? (
      <div className={styles.navCombo} data-active={active ? 'true' : undefined}>
        <Link
          to={linkTo(group.to)}
          className={styles.navComboLink}
          data-active={active ? 'true' : undefined}
          onClick={() => setOpen(true)}
        >
          <GroupIcon icon={group.icon} />
          <span className={styles.navRowLabel}>{group.label}</span>
        </Link>
        <button
          type="button"
          className={styles.navComboChevron}
          onClick={toggle}
          aria-label={toggleLabel}
          aria-expanded={open}
        >
          <Icon
            name="ArrowDown2"
            size="sm"
            className={styles.navChevron}
            data-open={open ? 'true' : 'false'}
          />
        </button>
      </div>
    ) : (
      <button
        type="button"
        className={styles.navRow}
        data-active={active ? 'true' : undefined}
        aria-expanded={open}
        onClick={toggle}
      >
        <GroupIcon icon={group.icon} />
        <span className={styles.navRowLabel}>{group.label}</span>
        <Icon
          name="ArrowDown2"
          size="sm"
          className={styles.navChevron}
          data-open={open ? 'true' : 'false'}
        />
      </button>
    )

  return (
    <div>
      {header}
      {hasChildren && open ? (
        <div className={styles.navLeaves}>
          {group.children?.map((leaf) => (
            <Link key={leaf.to} to={linkTo(leaf.to)} className={styles.navLeaf}>
              {leaf.icon ? (
                <Icon name={leaf.icon} size="sm" />
              ) : (
                <span className={styles.navLeafDot} />
              )}
              {leaf.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function GroupIcon({ icon }: { icon?: IconName }) {
  if (!icon) return null
  return (
    <span className={styles.navIcon}>
      <Icon name={icon} size="sm" />
    </span>
  )
}
