# Checkbox

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A labeled checkbox. The native `<input type="checkbox">` is **visually hidden** (sr-only) but stays
focusable + announced; a styled `.box` shows the state, and the tick is a **CSS checkmark** (rotated
corner — no icon dependency). `label` · `color` (checked fill, default `brand`) · `size` (box +
label) · `error` · `required` · `disabled` · `checked`/`defaultChecked` ·
`onChange(checked)` (emits a `boolean`). Uses the `--tz-btn-rgb`/`--tz-btn-on` pattern: checked →
`background: rgb(var(--tz-btn-rgb))` with a contrast-colored tick; `:focus-visible` ring; `error`
**reddens the box only (no helper text)** + sets `aria-invalid`. Like the other fields, a **`name`**
prop binds it to a surrounding `<Form>` — its form value is a **`boolean`** (validate with e.g.
`z.boolean().refine((v) => v, 'Required')` for a must-accept box); the form's error reddens the box,
but its message isn't rendered. Own CSS module (`Checkbox.module.css`).
