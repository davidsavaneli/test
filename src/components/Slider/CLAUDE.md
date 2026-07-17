# Slider

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A range slider — drag (or arrow-key / Home / End) a thumb along the track to pick a number, **snapping
to `step`**. Built on a **native `<input type="range">`**, so keyboard, dragging, step/min/max, and a11y
(`role="slider"`) come for free; the track / fill / thumb are styled via `--tz-*` tokens and tinted by
`color` (default `accent`, via the **`--tz-btn-rgb`** pattern). The filled portion is a hard-stop
gradient driven by an inline **`--tz-slider-fill`** percent (WebKit `::-webkit-slider-runnable-track`;
Firefox uses native `::-moz-range-progress`). Props: `min` (0) · `max` (100) · `step` (1) · `size`
(`sm`/`md`/`lg` → track + thumb px via `--sl-track`/`--sl-thumb`, one-off literals) · `valueLabel`
(show the current value at the end of the label row — `true` default, or a `(value) => node` formatter,
or `false`) · `marks` (`{ value, label? }[]` labeled ticks under the track) · `fullWidth` (default
`true`) · `error` + `helperText` + `required`. Reuses **`TextField.module.css`** for the label / helper /
required / error chrome (its own module styles only the track / thumb / value / marks). Controlled
(`value` + `onChange`) or uncontrolled (`defaultValue`, defaults to `min`); like the other fields, a
**`name`** binds it to a surrounding `<Form>` — the form value is a real **`number`** (validate with
`z.number().min(…)`), read/written via `values`/`setValue` while touched/error come from `field()`; the
input carries `name` for **scroll-to-error**. Pass **`range`** for a **two-thumb span** — the value
becomes a `[start, end]` tuple (validate with `z.tuple([z.number(), z.number()])`), rendered as two
overlaid transparent-track `<input type="range">`s over a custom rail + fill (the fill spans between the
thumbs; thumbs catch pointer events via `pointer-events: auto` and can't cross each other). Own CSS
module. _Custom labeled tooltips on the thumb during drag are a natural next iteration._
