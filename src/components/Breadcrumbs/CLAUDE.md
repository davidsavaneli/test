# Breadcrumbs

> Part of the `@techzy/ui` admin shell. Full shell architecture — route `staticData`, RBAC, and the
> nav tree it reuses — lives in [`../RootLayout/CLAUDE.md`](../RootLayout/CLAUDE.md). Folder-local
> facts below.

**Folder specifics**

- Built from the active match chain via **`useBreadcrumbs()`** — one crumb per matched route that
  declares a `staticData.name` (module → group → page). `RootLayout` renders `<Breadcrumbs/>` **only
  when `header.breadcrumbs` is `true`** (defaults to `false` — hidden).
- Always opens with a **home icon** linking to the first allowed menu page (same target as
  `FirstRouteRedirect`). Intermediate crumbs link only when they map to a real navigable menu page
  (reusing the access-filtered nav tree, so forbidden/non-page ancestors render as plain text); the
  current page is always plain text (`aria-current="page"`). Renders nothing when the route has no
  named matches.
- **`separator?: IconName | ReactNode`** (default `"ArrowRight4"`): a known `IconName` renders as an
  `<Icon>`, any other string as text, or pass a node. Every crumb shares one color
  (`--tz-color-primary-shade600`); links darken to `--tz-color-text` and underline on hover.
- Exported from `sava-test/components`; the **`useBreadcrumbs`** hook stays internal.
