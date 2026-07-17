# SwatchPicker

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A grid of selectable color **swatches** (rounded tiles — `--tz-radius-sm`) — pick one from a **fixed
preset palette**. Unlike
`ColorPicker` (a full field + popover picker with hue/alpha/hex input), this is a lightweight primitive
for a curated set of colors — e.g. a brand-accent chooser (it backs the `RootLayout` **Settings**
drawer). Props: **`colors`** (required — the CSS color strings to render, hex / `rgb()` / …) ·
**`value`** / **`defaultValue`** (`string | null` — the selected color, matched **case-insensitively**
against `colors`; controlled vs uncontrolled) · **`onChange(color)`** (fires with the clicked color) ·
**`size`** (`sm` / `md` / `lg`, default `md` — each sets the tile size `30`/`36`/`42`px, its own corner
radius, and the tick size `16`/`20`/`24`px, all via per-size CSS vars) ·
**`labels`** (a `{ [color]: string }` map of per-swatch accessible names, falling back to the color
value). The swatches wrap in a flex row (`--tz-space-xs` gap) and are rounded tiles (a per-`size` corner
radius); the **selected** swatch shows a centered white **`TickCircle`** icon (a per-`size` tick — no
ring, no hover scale; a focus ring shows on keyboard focus only). Swatch fills come from an inline **`--sw`** var (arbitrary colors,
**not** `--tz-*` tokens — a deliberate exception,
like `ColorPicker`'s spectrum; everything else is token-styled). Controlled or uncontrolled;
`forwardRef` to the root `<div>`. a11y: `role="radiogroup"` (name it via `aria-label`) with per-swatch
`role="radio"` + `aria-checked` + `aria-label`. Own CSS module. _A `<Form>` binding by `name` (value =
the color string), a "no color" / clear swatch, and an optional square shape are natural next
iterations._
