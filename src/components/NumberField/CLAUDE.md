# NumberField

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A numeric input with `+`/`−` stepper buttons. Shares **TextField's field chrome** — it imports
`TextField.module.css` for the label/control/helper/size/error styling (single source of truth) and
adds its own stepper. `label` · `size` · `error` + `helperText` · `required` · `fullWidth`
(**default `true`**) · `disabled` · `value`/`defaultValue` (`number | null`, `null` = empty) · `onChange(value)` (emits a
`number` or `null`) · `min` (**default `0`** — pass a negative `min` to allow negatives) · `max` ·
`step` (default `1`) · `hideStepper` · `thousandSeparator` (**live** grouped display, e.g. `"."` →
`32.345.345`, regrouped on every keystroke with the caret preserved — the value stays a plain
`number`; best for integers, `"."` precludes decimals). The `+`/`−` buttons add/subtract `step`,
clamp to `min`/`max`,
and disable at the matching bound; the value also clamps on blur. Internally it keeps a display-string
state so in-progress input (`-`, `1.`) survives while `onChange`/the form still receive the parsed
number. Like TextField, a **`name`** prop auto-binds it to a surrounding `<Form>` — but the form value
is a real **`number`** (validate with `z.number()`), read/written via `values`/`setValue` while
touched/error come from `field()`. The steppers are **`filled`** `IconButton`s sized via the shared
`.control .iconButton` rule (flush square, stretched to the control height, `scale(0.84)`), with
`onMouseDown`-preventDefault so clicking them doesn't pull the focus ring (the `−` button gets a tiny
negative `margin-right` to tighten the gap). NumberField has no CSS of its own; it reuses
`TextField.module.css` entirely.
