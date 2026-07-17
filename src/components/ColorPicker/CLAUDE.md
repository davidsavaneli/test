# ColorPicker

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A color field with a **beautiful popover picker**, with **opacity (alpha)** and **`rgb()`/`rgba()`**
support. The trigger reuses TextField-style chrome
(`label` · `size` · `error` + `helperText` · `required` · `fullWidth` default `true` · `disabled`):
the color value (or `placeholder`) on the left + a right-aligned color **swatch**; clicking the
**whole control** toggles the popover (no chevron). The popover is **portaled to `<body>` and behaves
exactly like `Dropdown`**: opens below, flips above only when it would overflow, **locks page scroll**
(`useLockBodyScroll`) while open, re-positions on scroll/resize, closes on outside-pointerdown/`Escape`,
and **enters with the same opacity + translate animation** (keyed off `data-open`/`data-side` + a
rAF-driven `visible` flag). It holds a **saturation/value square**, a **hue slider** and an **alpha
(opacity) slider** (all pointer-draggable), a **color input** (accepts `#rgb`/`#rrggbb`/`#rrggbbaa` hex
or `rgb()`/`rgba()`), and a grid of quick-pick **`swatches`** — led by a **"no color"** chip (a
diagonal-stripe swatch that clears the field). The curated default palette is overridable; the selected
swatch shows just a **tick** (no ring, no hover scale). **Value is a CSS color `string`: `#rrggbb` when
fully opaque, `rgba(r, g, b, a)` when translucent**; controlled (`value` + `onChange(color)`) or
uncontrolled (`defaultValue`). Working state is kept as **HSV + alpha** so hue survives dragging at
grey/black (hex would lose it) — re-derived from the value only on external changes. Binds to a
surrounding `<Form>` by **`name`** (form value = the color string; validate with e.g.
`z.string().regex(/^#[0-9a-f]{6}$/i, 'Pick a color')`, or a looser pattern if you allow `rgba()`); the
trigger carries `name` so the form's **scroll-to-error** can focus it. Color math (`hex⇄rgb⇄hsv`,
`normalizeHex`, plus `parseColor`/`formatColor` for hex/rgb/rgba + alpha) lives in `colorUtils.ts`.
Token-styled except the **spectrum gradients** (the SV square + hue rail) and the **alpha
checkerboard** — both use literal colors (an unavoidable exception); the dynamic hue is fed via an
inline `--cp-hue` var, the alpha fill via `--cp-fill` / `--cp-rgb`. Own CSS module. The picking surface
itself (SV square + hue/alpha sliders + input + swatches) is an internal **`ColorPickerPanel`**
(`{ value, onChange, swatches, clearable }`, controlled by one color string) that `ColorPicker` wraps in
its `FloatingPanel` — and the **`RichTextEditor`** text-color control reuses the same panel (import via
`../ColorPicker/ColorPickerPanel`; not in the public surface). `clearable` (default `true`) shows the
leading "no color" swatch; the RTE passes `clearable={false}` and a non-empty default so the first
swatch (the brand color) shows selected when the text has no explicit color.
