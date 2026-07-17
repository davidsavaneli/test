# Tooltip

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A **wrapper** that shows a floating label on hover/focus of a single child element:
`<Tooltip content="Save"><IconButton…/></Tooltip>`. `content: ReactNode` (empty → renders just the
child); `placement` (`top` default · `bottom` · `left` · `right`) with a matching arrow. Opens on
`mouseenter`/`focus`, closes on `mouseleave`/`blur`/`Escape`; the child is cloned to get
`aria-describedby` while open, and the label is `role="tooltip"`. **`color`** (theme palette token, default
`primary`) sets the fill via the shared **`--tz-btn-rgb` / `--tz-btn-on`** pattern (the label uses the
color's contrast, the arrow inherits the fill), flipping with the theme; `--tz-z-tooltip`,
`--tz-shadow-md`, opacity/visibility fade over `--tz-duration`. Takes a single `ReactElement` child
(cloned for a11y). Own CSS module.
