# Sidebar / FirstRouteRedirect / NavSearch

> Part of the `@techzy/ui` admin shell. The **full shell architecture** — floating layout, header,
> route `staticData`, and the RBAC menu-filtering that all drive the nav — lives as one narrative in
> [`../RootLayout/CLAUDE.md`](../RootLayout/CLAUDE.md). Read that for anything cross-cutting; the
> folder-local facts are below.

**Folder specifics**

- **`Sidebar`** auto-builds a 3-level menu (module → group → page) by walking
  `useRouter().looseRoutesById` and reading each route's `fullPath` + `staticData` — **no manual menu
  config**. Rows compose `List`/`ListItem` (links render `ListItem as={Link}`, bridged by a typed
  `NavLink` cast); the active row is `ListItem selected`; expandable groups fold with the same
  `grid-template-rows: 1fr → 0fr` transition as `Card`.
- **`FirstRouteRedirect`** (for the `/` route) forwards to the first **allowed** menu item.
- **`NavSearch`** (also exported here) is the header search over the sidebar pages — it flattens the
  same RBAC-filtered `useNavTree` into `{ label, to, context }` and shows suggestions in a floating
  `List` below a `TextField` (Up/Down + Enter navigate via `useNavigate`).
- Tree logic is a pure, tested **`buildNavTree(routes)`** (router-free); **`useNavTree`** feeds it the
  live RBAC-filtered routes. **Internal (not exported):** `buildNavTree`, `useNavTree`, `firstNavTo`,
  and the `NavLeaf`/`NavGroup`/`NavModule`/`NavRoute` types.
- **Gotcha:** never name a leaf route file `loader.tsx` (reserved by the router plugin) — use a
  `loader/index.tsx` folder.
