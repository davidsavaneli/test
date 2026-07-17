# Flex / Row / Col / Grid

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

Flexbox layout primitives — set layout via props instead of inline `style`. **`Flex`** is the engine
(`direction` `row`/`column` · `gap` · `align` `start/center/end/stretch/baseline` · `justify`
`start/center/end/between/around/evenly` · `wrap` · `padding` · `inline` · `grow`). **`Row`** = `Flex`
`direction="row"` + `align="center"`; **`Col`** = `Flex` `direction="column"`. `gap`/`padding` take a
**`Spacing`**: a `--tz-space-*` scale key (`"md"`), a raw px `number`, or any CSS string (e.g.
`"24px 8px"`) — scale keys resolve to tokens, numbers to px. Styled via **inline style** (the values
are fully dynamic — a deliberate exception to the CSS-Modules rule for this layout primitive); consumer
`style` merges last. All three `forwardRef` to the `<div>` and live in `src/components/Flex/`.
**`Grid`** (same folder) is the CSS-grid sibling: `cols` (fixed count → `repeat(n, minmax(0,1fr))`, or a
raw template string) or **`minItemWidth`** (responsive `repeat(auto-fit, minmax(<w>, 1fr))` — wraps to
one column when narrow; `fill` switches it to `auto-fill` so a few items keep their min width instead
of stretching to fill the row — e.g. a search-filtered gallery), plus `gap`/`align`/`padding`/`inline`.
