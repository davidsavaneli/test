# ToggleButton / ToggleButtonGroup

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A two-state button + its group — a **segmented control** (one folder, two exports, like `Radio`/
`RadioGroup`). **`ToggleButton`** is a `<button type="button">` that toggles selected/unselected:
`value` (its identity in a group) · `selected` + `onChange(selected, value)` (standalone) · `color`
(default `primary`) · `size` · `fullWidth` · `disabled`. Selected uses the soft **`filled` tint** of
`color` (the shared **`--tz-btn-rgb`** pattern); unselected is transparent with a token border;
`aria-pressed` carries the state. It reads a surrounding group via context (the group then owns
selection/size/color/disabled), or works standalone. **`ToggleButtonGroup`** is the usual entry point:
**`exclusive`** picks single-selection (`value` is a **`string | null`** — clicking the active button
deselects it, like MUI) vs multiple (`value` is a **`string[]`**); **default `false` (multiple)**.
Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`); supply buttons via the data-driven
**`options`** (`{ value, label?, icon? (IconName|node), disabled?, ariaLabel? }[]`) or as
`<ToggleButton>` children. `orientation` (`horizontal` default · `vertical`), `size`, `color`,
`disabled`, `fullWidth` (buttons share the width equally). The group is a flex container that
**collapses adjacent borders** (negative margin + outer-corner-only rounding) so the strip reads as one
joined control, raising the hovered/selected/focused button's `z-index` so its border shows. a11y:
`role="group"` on the container, `aria-pressed` per button (pass `ariaLabel` for icon-only buttons).
Both styles live in one `ToggleButton.module.css` (the group imports it so the joined-corner selectors
resolve). `ToggleButton` ships named **and** default, `ToggleButtonGroup` named. _A `<Form>` binding by
`name` (exclusive → `string` like `RadioGroup`, multiple → `string[]` like `MultiSelect`) is the
natural next iteration._
