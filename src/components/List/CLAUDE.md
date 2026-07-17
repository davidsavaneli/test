# List / ListItem

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

**`ListItem`** is a flexible, reusable row: a leading `icon` (`IconName` → `<Icon>`, or any node such
as an `Avatar`), a label (`children`) with an optional muted `description`, and a `trailing` slot
(icon, `Badge`, shortcut text, chevron). `selected` highlights it (tinted via the `--tz-btn-rgb`
pattern from `color`, default `primary`) and sets `aria-current`; `clickable` makes it interactive — hover

- cursor, and when rendered as a **plain** element it also gets `role="button"` + `tabIndex` +
  Enter/Space → click (a native `a`/`button` or a router `Link` keeps its own semantics). `disabled` dims
- inerts it. `size` is `sm/md/lg` (min-height a touch under the control height; the label **wraps**
  onto multiple lines — `overflow-wrap: break-word` — while the description truncates to one line).
  Render as a link/button/component via **`as`** (anchor `href`/`target`/`rel`/`download` are typed).
  The hover/selected tint is **container-overridable**: `--tz-list-accent-rgb` (a triplet — falls back
  to the color-prop's `--tz-btn-rgb`) + `--tz-list-hover-alpha` / `--tz-list-selected-alpha` (default
  `0.06`), so a themed container (the dark `RootLayout` sidebar) turns it into a frosted white pill
  without touching the defaults.
  **`List`** is a thin semantic container — a vertical stack (inline-styled like `Flex`/`Grid`) with
  `gap` (default `2px`) / `padding` and `role="list"` (override `role` to `"menu"` for a dropdown). Its
  `size` provides a default for every contained `ListItem` (via context; an explicit item `size` wins).
  Designed to compose inside a dropdown menu, the sidebar, or a standalone styled list. Own CSS module;
  `List` ships named **and** default, `ListItem` named.
