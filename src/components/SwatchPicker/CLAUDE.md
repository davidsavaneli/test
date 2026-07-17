# SwatchPicker

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A grid of selectable color **swatches** (rounded tiles — `--tz-radius-sm`) — pick one from a **fixed
preset palette**. Unlike
`ColorPicker` (a full field + popover picker with hue/alpha/hex input), this is a lightweight primitive
for a curated set of colors — e.g. an accent-color chooser (it backs the `RootLayout` **Settings**
drawer). Props: **`colors`** (required — the CSS color strings to render, hex / `rgb()` / …) ·
**`value`** / **`defaultValue`** (`string | null` — the selected color, matched **case-insensitively**
against `colors`; controlled vs uncontrolled) · **`onChange(color)`** (fires with the clicked color) ·
**`size`** (`sm` / `md` / `lg`, default `md` — each sets the tile size `30`/`36`/`42`px, its own corner
radius, and the tick size `16`/`20`/`24`px, all via per-size CSS vars) ·
**`labels`** (a `{ [color]: string }` map of per-swatch accessible names, falling back to the color
value) · **`label`** · **`error`** + **`helperText`** · **`required`** — the field-family chrome (it
reuses **`TextField.module.css`** for the label / helper / required / error styling, like `Slider` /
`NumberField`; the helper shows in the **error color** while `error`, so a validation message appears on
error). The swatches wrap in a flex row (`--tz-space-xs` gap) and are rounded tiles (a per-`size` corner
radius); the **selected** swatch shows a centered white **`TickCircle`** icon (a per-`size` tick — no
ring, no hover scale; a focus ring shows on keyboard focus only). Swatch fills come from an inline
**`--sw`** var (arbitrary colors, **not** `--tz-*` tokens — a deliberate exception, like `ColorPicker`'s
spectrum; everything else is token-styled). Controlled (`value` + `onChange`) or uncontrolled
(`defaultValue`); like the other fields, a **`name`** binds it to a surrounding `<Form>` — the form value
is the **color `string`** (validate with e.g. `z.string().min(1, 'Pick a color')`), read from
`form.values[name]` / written via `setValue` while `error`/`helperText` come from `field()`; the group
carries `name` + `tabIndex={-1}` for **scroll-to-error**. `forwardRef` to the root `<div>`. a11y:
`role="radiogroup"` (labelled by `label` or `aria-label`) with per-swatch `role="radio"` +
`aria-checked` + `aria-label`. Own CSS module. _A "no color" / clear swatch and an optional square shape
are natural next iterations._
