# Card

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A surface container with an optional header (`icon` + `title` + `subtitle` + `actions`), a body
(`children`), and a
`footer` for actions (solid top divider, right-aligned; `footerStart` pins content to the **left** of
the same row, so the row reads left-vs-right via `space-between`). A subtle **dashed** bottom divider
sets the header apart from the body while expanded. `collapsible` adds an `ArrowUp3` chevron `IconButton` that folds the body
**and** footer via a smooth `grid-template-rows: 1fr → 0fr` transition; while collapsed the header
**actions hide** (only the chevron stays) and the header divider fades out. Controlled (`collapsed` +
`onCollapsedChange`) or uncontrolled (`defaultCollapsed`). The fold wrapper (`.collapsibleInner`, a grid
item) carries **`min-width: 0`** as well as `min-height: 0` — so a wide, non-wrapping child (e.g. a `Table`
with its own horizontal scroll) shrinks and scrolls **inside the card** instead of forcing the card (and
the whole page) wider than the viewport. `icon` (an `IconName` or a node) renders in
a leading **filled, non-clickable `IconButton`** box (decorative → `aria-hidden`), tinted by `color`
(theme palette token, default `accent`). `subtitle` is a muted description line under the `title`; both `title`
and `subtitle` clamp to **two lines** then ellipsis (`-webkit-line-clamp`).
`--tz-color-surface` panel + border + `--tz-radius-md` — cards are **shadowless** (a flat, no-elevation
look). **`flat`** is a marker used by `PageLayout` (and kept for API); it deliberately does **not** change
the background, so with shadowless cards it currently carries no visual difference — a styling hook, not a
distinct look. Header omitted entirely when there's no title/icon/actions/collapsible.
**Responsive:** below **576px** the header / body / footer **horizontal** padding tightens from
`--tz-space-md` to `--tz-space-sm` (vertical padding unchanged), so cards use more of the narrow screen.
Own CSS module.
