# SpeedDial / SpeedDialAction

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A floating action button (FAB) that reveals related actions on hover / click — the lib's quick-action
surface (one folder, two exports). **`SpeedDial`** requires an **`ariaLabel`** (the FAB is icon-only) and
takes **`icon`** (default `Add` — a `+`) + an optional **`openIcon`**; with no `openIcon` the FAB icon
**rotates 45°** when open (`+` → `×`), else the two glyphs swap. **`direction`** (`up` default · `down` ·
`left` · `right`) fans the actions out; `color` (default `primary`) tints the FAB (a `contained`
`rounded` `IconButton`), `size` (`sm`/`md`/`lg`) sizes the FAB while actions render **one step smaller**.
**Opens on hover** (`openOnHover`, default `true`) **and click**; closes on **outside-pointerdown**,
**Escape** (refocusing the FAB), or selecting an action (`closeOnActionClick`, default `true`).
**`tooltipOpen`** shows every action's label **persistently** while the dial is open (no hover) — a
static label pill beside each (like MUI); per-action `<SpeedDialAction tooltipOpen>` overrides it.
Controlled (`open` + `onOpenChange`) or uncontrolled (`defaultOpen`). Supply actions via the data-driven
**`actions`** (`{ icon, label?, onClick?, disabled?, key? }[]`) or as **`<SpeedDialAction>`** children.
**`SpeedDialAction`** is a small `contained` `secondary` (surface) `rounded` `IconButton` with a
**`Tooltip`** `label` (also its `aria-label`); placement derives from the dial `direction` (left for
vertical, top for horizontal). Because the surface (`secondary`) matches the page background, the action
gets a hairline **`--tz-color-border`** (like `Card`/inputs) so the circle reads — `button.action`
outranks `IconButton`'s contained border. The actions sit in an **absolutely-positioned container** (a DOM child,
so it never shifts the FAB and hover treats it as inside) that animates open (opacity + per-action
`scale`); a padding **hover bridge** keeps FAB→action moves from closing it. a11y: the FAB carries
`aria-haspopup`/`aria-expanded`/`aria-controls`; actions are `aria-label`led buttons, tabbable only while
open (the container is `visibility: hidden` when closed). The ref points at the root — **position it
yourself** (e.g. `fixed` bottom-right) via `style`/`className`. `SpeedDial` ships named **and** default,
`SpeedDialAction` named. _Arrow-key roving between actions + an optional backdrop are natural next
iterations._
