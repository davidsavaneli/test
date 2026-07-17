# Layout — `RootLayout` / `Sidebar` / `FirstRouteRedirect` (TanStack Router)

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

The admin-panel shell lives under `src/components/` (`RootLayout/`, `Sidebar/`, `Breadcrumbs/`) — it's
shipped as ordinary components, so it imports from `sava-test/components` like everything else. Powered
by **`@tanstack/react-router`** (optional peer, `>=1`, `external` in the build).
`RootLayout({ logo?, sidebarFooter?, header?, toaster?, children })` uses a **floating layout**: the
shell is a grid (`auto 1fr`, `--tz-space-sm` padding + gap) on the soft **`--tz-color-background`** canvas,
with a rounded, elevated **`--tz-color-surface` sidebar card** (border + `--tz-radius-lg` +
`--tz-shadow-xs`) beside the header + content; set it as the **root route's** component and pass
`<Outlet/>` as `children`. The sidebar card is **sticky** (`top: --tz-space-md`, `height: calc(100vh -
2*--tz-space-md)`) and split into three rows (`grid-template-rows: auto minmax(0,1fr) auto`) — the
`logo`/brand row fixed at the top, the nav scrolling (`overflow-y:auto`), and an optional
**`sidebarFooter`** card (any node — e.g. a "Need help?" promo) pinned at the bottom. A header
**toggle** `IconButton` (left, `filled`, `Menu` icon) collapses/hides the sidebar by animating its
`width` to `0` (the shell's first grid column is `auto`, so it follows); the `ThemeToggle` is `filled`
too. Nav icons match the row label (text) color via `--tz-list-icon-color`, and the active **pill** is a
touch stronger than the default `List` tint (bumped `--tz-list-hover-alpha`/`--tz-list-selected-alpha`
on the nav). The **header is borderless on the canvas** (transparent, scrolls with the content — not pinned), with
the sidebar toggle + a built-in **nav search** (`search`, default `true`) on the **left** and the
controls on the right, driven by the
`header` config (`HeaderConfig`) — `{ theme?: boolean /* default true */; fullscreen?: boolean /* default true */; search?: boolean /* default true */; breadcrumbs?: boolean /* default false */; pageTitle?: boolean /* default true */; onLogout?: () => void; user?: { name?; email?; avatar? } }`.
Set it **app-wide** via **`config.header`** (`<ConfigProvider>`) or **per shell** via the `RootLayout`
**`header` prop** — the prop is merged **over** `config.header` (prop wins).
The **`NavSearch`** (an internal `Sidebar` export) searches the sidebar's pages — it flattens the same
`useNavTree` (so it's RBAC-filtered) into `{ label, to, context }` and shows suggestions as a floating
`List` of `ListItem`s below a `TextField` (filter by page name or section; Up/Down + Enter navigate via
`useNavigate`, Escape/outside-pointerdown close). The right-side controls are
a `FullscreenToggle` + `ThemeToggle` (both `filled`, `size="sm"`, on by default) + a **Settings**
`IconButton` (`variant="text"`, `size="sm"`), plus an account `Avatar` — a focusable button whose
`Dropdown` menu has a single **Sign out** `ListItem` (calling `onLogout`), shown when `onLogout` is
given; when `user` is supplied the menu opens with a `User`-icon (or `user.avatar` image) plus a name +
email header above a divider. The **Settings** button (a `Setting5` gear beside the theme toggle that
**spins continuously** via a keyframe animation, always shown — independent of `onLogout`) opens the
internal **`SettingsDrawer`** — a right-side `Modal` (`placement="right"`, `size="sm"`) with **two
`SwatchPicker`s** (one labelled **Light theme**, one **Dark theme**) so both accents are chosen
independently at once — each a **per-mode** set (deeper tones for light, brighter for dark). Picking a
swatch calls **`useTheme().setAccentColor(color, mode)`**, which overrides that mode's `accent` and
persists it to `localStorage['tz-accent-color-<mode>']` (light + dark keep independent accents), so the
choice is restored next visit. Each list leads with the provider's configured default for that mode
(read via `useTheme().defaultAccentColors[mode]` — not hardcoded) — selected when there's no override,
and picking it clears that mode's override. `SettingsDrawer` is internal to the shell (no `index.ts`,
not a public export).

The content area stacks **the page title (the active route's `staticData.name`, via the internal
`usePageTitle()`, as an `h2`) → `children`** — pages wrap their own body in **`PageLayout`**; the
`Breadcrumbs` trail sits above the title **only when `header.breadcrumbs` is on** (default off).
Set **`header.pageTitle: false`** to drop that auto `h2` when pages render their own heading inside
their `PageLayout` header instead (icon + title + actions) — so the title isn't shown twice.
RootLayout also **mounts a `<Toaster>` by default** (so `toast.*()` works app-wide with no extra setup):
the top-level **`toaster`** prop is `true` (defaults), a `ToasterProps` object (`{ position, duration }`),
or `false` to opt out (e.g. you mount your own `<Toaster>` — two viewports would double every toast).
**`Sidebar`** auto-builds a 3-level menu (module → group → page) by
walking `useRouter().looseRoutesById` and reading each route's `fullPath` + `staticData` — no manual
menu config. Rows are composed from **`List` / `ListItem`** (links render via `ListItem as={Link}`,
bridged by a small typed `NavLink` cast since `to` is router-specific); the active row uses
`ListItem selected`, leaves use dot bullets (no icons) at `size="md"`, and an expandable group's leaf
`List` folds with the same smooth `grid-template-rows: 1fr → 0fr` transition as `Card` (chevron
`ArrowDown4`). The module label is a dark, `md`, uppercase heading (no icon). **`FirstRouteRedirect`** (for the `/` route) forwards to the first menu item. **`PageLayout`**
is a **flat `Card`** (`<Card flat>`) for a page's content — so it gains Card's full anatomy (optional
header `icon`/`title`/`subtitle`/`actions`, body, `footer`/`footerStart`, `collapsible`) while staying on
the `--tz-color-background` canvas with no shadow. The shell is a **floating layout** (the FreshCart look):
the whole app sits on a soft **`--tz-color-background`** canvas (the shell has `--tz-space-sm` padding +
gap via `--shell-pad`), and the **sidebar is a rounded,
elevated `--tz-color-surface` card** (border +
`--tz-radius-lg` + `--tz-shadow-xs`, sticky at `100vh - padding`) with the `logo` at the top, the nav
(a slightly stronger active **pill** via bumped `--tz-list-hover-alpha`/`--tz-list-selected-alpha` on the
nav), and an optional **`sidebarFooter`** card pinned at the bottom (grid rows `auto minmax(0,1fr) auto`).
The **header is borderless on the canvas** (sticky, `--tz-color-background` bg), and the page's
`PageLayout` is a **flat card on the `--tz-color-background` canvas** (it blends into it — no elevation;
individual `Card`s inside it are the `--tz-color-surface` panels that float). `PageLayout`'s props are
`Omit<CardProps, 'flat'>` (always flat) and it ships named **and** default from
`sava-test/components/PageLayout`.

Routes self-register via TanStack `staticData`, which the library augments (typed for consumers):
`{ name?: string; icon?: IconName; order?: number; hidden?: boolean; roles?: string[]; badge?: string; dot?: ThemeColor }`
— a route with **no `name`** never appears; `hidden` keeps it routed but off the menu; `order` sorts
(asc, then alphabetical); `roles` gates it by access (see RBAC below); `badge` shows a small "New"-style
pill on the menu row (a styled span, **not** the `Badge` component — `--tz-color-accent` fill, rendered
in the row's trailing slot before any chevron); `dot` shows a small colored dot on the row tinted by any
brand `ThemeColor` (e.g. `dot: 'error'`, via `var(--tz-color-<color>)`). **Dynamic/param routes** (e.g.
`/users/$userId`) work normally — give them no `name` (or `hidden`) and they route + render via the
`<Outlet/>` but stay off the menu; the page title and breadcrumb then fall back to the nearest named
ancestor (the menu reads only `staticData`, so it never tries to build a `$param` link).
Path segments infer structure: `/dashboard` (1 seg) → top-level link; `/components/theme-toggle`
(2 seg, no children) → clickable group row; `/components/forms/button` (3 seg) → module `components` →
group `forms` → page; an index route at a group path (`/components/forms/`) makes the group a
**"Case B"** page (icon/label navigate + expand, chevron only toggles). Module/group chrome
(label/icon/order) comes from that folder's `route.tsx` `staticData`, else the segment is prettified.

The tree logic is a pure, tested `buildNavTree(routes)` (router-free); `useNavTree` feeds it the live
routes. Styles are **CSS Modules** co-located in each folder (`RootLayout.module.css`,
`Sidebar.module.css`, `Breadcrumbs.module.css`, token-only → light/dark-safe), bundled into
`dist/index.css`. The `declare module '@tanstack/react-router'` augmentation ships in the published
`.d.ts`. **Public exports:** `RootLayout`, `Sidebar`, `Breadcrumbs`, `FirstRouteRedirect` (from
`sava-test/components`) with types `RootLayoutProps`, `RootLayoutHeader`, `IconName`; the RBAC
functions `setAccessKeys`/`getAccessKeys`/`hasAccess` (from `sava-test/helpers`) and `useAccessKeys`
(from `sava-test/hooks`). **Internal (not exported):** `buildNavTree`, `useNavTree`, `firstNavTo`,
`usePageTitle`, `useBreadcrumbs`, and the `NavLeaf`/`NavGroup`/`NavModule`/`NavRoute`/`Breadcrumb`
types — RootLayout/Breadcrumbs use them via direct file imports. Gotcha: never name a leaf route file
`loader.tsx` (reserved by the router plugin) — use a `loader/index.tsx` folder.

**Breadcrumbs.** `RootLayout` renders `<Breadcrumbs/>` at the top of the content area **only when
`header.breadcrumbs` is `true`** (it defaults to **`false`** — hidden). It's built from the active match chain via `useBreadcrumbs()` — one crumb per
matched route that declares a `staticData.name` (module → group → page). It always opens with a home
icon linking to the first allowed menu page (same target as `FirstRouteRedirect`). Intermediate crumbs
link only when they map to a real navigable menu page (reusing the access-filtered nav tree, so
forbidden/non-page ancestors render as plain text); the current page is always plain text
(`aria-current="page"`). Renders nothing when the route has no named matches. The `Breadcrumbs`
component is also exported from `sava-test/components` if an app wants the trail elsewhere (the
`useBreadcrumbs` hook stays internal). **`separator?: IconName | ReactNode`** (default `"ArrowRight4"`):
a known `IconName` renders as an `<Icon>`, any other string as text, or pass a node.
Every crumb shares one color (`--tz-color-primary-shade600`); links darken to `--tz-color-text` and underline
on hover.

**RBAC — role-based menu filtering (`src/helpers/access.ts`).** A page declares allowed `accessKeys`
via `staticData.roles: string[]` (**OR** semantics — the user needs any one; omitted/empty = public).
Access is a **module singleton** with a React subscription, so it's readable both inside React
(`useAccessKeys()` — reactive, re-renders the `Sidebar`) and outside it (`hasAccess(roles)` — for
TanStack `beforeLoad` guards, which run before React). The app calls `setAccessKeys(keys)` after
login/`getUser` (and `setAccessKeys([])` on logout); `getAccessKeys()` is the non-reactive read.
`useNavTree` subscribes via `useAccessKeys()` (a `useMemo` dep) and **filters routes through
`hasAccess(sd.roles)` before `buildNavTree`**, keeping the builder pure — forbidden pages drop out
live, and empty groups/modules vanish on their own (they're only created when a child is added).
`FirstRouteRedirect` needs no change — it lands on the first item of the already-filtered tree, i.e.
the first allowed page. Defaults are inert: pages without `roles`, and apps that never call
`setAccessKeys` (keys stay `[]`), behave exactly as before. For direct-URL defense-in-depth, guard the
route too: `beforeLoad: () => { if (!hasAccess(['Analyst'])) throw redirect({ to: '/' }) }`.

```tsx
// app: src/routes/__root.tsx — logo + optional sidebarFooter in the sidebar card; header = theme toggle + logout
export const Route = createRootRoute({
  component: () => (
    <RootLayout logo={<Icon name="Box" />} header={{ theme: true, onLogout: () => auth.logout() }}>
      <Outlet />
    </RootLayout>
  ),
})
// app: src/routes/index.tsx  →  component: FirstRouteRedirect
// app: a page  →  createFileRoute('/dashboard/')({ staticData: { name: 'Dashboard', icon: 'Category', order: 0 } })

// RBAC: feed the user's roles in once (after login), gate pages with `roles`, guard direct URLs.
import { setAccessKeys, hasAccess } from '@techzy/ui'
setAccessKeys((await getUser()).response.accessKeys) //   [] on logout
// a gated page:
createFileRoute('/dashboard/')({
  staticData: {
    name: 'Dashboard',
    icon: 'Category',
    order: 0,
    roles: ['Analyst', 'SystemUserManager'],
  },
  beforeLoad: () => {
    if (!hasAccess(['Analyst', 'SystemUserManager'])) throw redirect({ to: '/' })
  },
})
```
