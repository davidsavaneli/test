# EmptyState

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

The empty-state placeholder — drop it wherever a page / table / list / gallery has nothing to show (no
records yet, no search matches). A centered column: a muted glyph in a **soft neutral circle**
(`--tz-color-primary-shade200` fill + `-shade600` icon — deliberately neutral, not tinted by a semantic
color) + a **`title`** (default `"No Results Found"`) + an optional muted **`description`** + an **`action`** slot
(e.g. an "Add Item" / "Clear Filters" button). **`icon`** is an `IconName` (default `FolderOpen`), any node (pass
a tinted `<Icon>`/illustration), or **`false`** to hide it. **`size`** (`sm`/`md`/`lg`) scales the circle
(42 / 56 / 70px — one-off literals), the icon, the title font, and the vertical padding so it fills the
empty area; `children` renders extra content below the action. **`pattern`** is the polished
"hero" look — a **faded grid backdrop** (token `--tz-color-border` lines on a 40px cell, radial-masked
so it fades out toward the edges, never a hard box) + an **elevated icon puck** (a `surface →
primary-shade100` gradient + `--tz-shadow-md`) — and is **on by default**; pass `pattern={false}` for the
flat, compact placeholder (e.g. a small inline / table empty state). Reuse it for empty data **and** empty filters/search, not just "no
records". `title` uses medium weight; the description caps its line length (`max-width: 42ch`) for
readability. Token-only (the grid cell + radial mask are decorative one-offs). Own CSS module. _A
compact inline (row) variant is a natural next iteration._
