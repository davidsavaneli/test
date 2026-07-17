# ChoiceCard / ChoiceCardGroup

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A group of **selectable cards** — rich checkboxes/radios with an `icon`, `label` and `description`
(role pickers, plan choices, permission sets); one folder, two exports (like `Radio`/`RadioGroup`).
**`ChoiceCardGroup`** is the usual entry: **`exclusive`** picks single-selection (**radio** semantics —
`value` is a `string | null`, the cards are **native radios** so Arrow keys rove between them and
re-clicking the selected card keeps it selected — unlike `ToggleButtonGroup`'s deselect) vs multiple
(**checkbox** semantics — `value` is a `string[]`); **default `false` (multiple)**. Controlled
(`value` + `onChange`, emitting the `exclusive` shape) or uncontrolled (`defaultValue`); cards come
via the data-driven **`options`** (`{ value, label?, description?, icon? (IconName|node), disabled? }[]`)
or as `<ChoiceCard>` children (shared state via context). The cards lay out on a **responsive grid** —
`repeat(auto-fill, minmax(min(100%, <minCardWidth>px), 1fr))`, **`minCardWidth`** default `160` — so
they wrap on narrow screens. Group chrome mirrors `RadioGroup`: `label` (+ `required` asterisk) ·
`size` (`sm`/`md`/`lg` — padding, icon circle 32/40/48px, indicator 16/18/20px; one-off literals) ·
`color` (default `primary`, the shared **`--tz-btn-rgb` / `--tz-btn-on`** pattern) · `disabled` ·
`error` (reddens the card borders + indicator — **no message text**, like `RadioGroup`). **Anatomy of
a card** (`ChoiceCard`): a `<label>` card wrapping a **visually-hidden native input**
(radio in `exclusive` groups, else checkbox — Space toggles, focus ring via `:has(:focus-visible)`),
a **top-right indicator that mirrors the semantics** — in an `exclusive` group a **radio-style hollow
ring + scaled-in inner dot** (the `Radio` look), else a circle that fills with the brand color + a
scaled-in **CSS tick** (the `Checkbox` corner trick, no icon dep) — an **icon circle** (soft neutral `primary-shade100` fill that
**fills solid brand + contrast icon while selected** — the polish flip), and the
`label`/`description`. **`align`** (`'left' | 'center'`, on the group or per card — the card's wins)
picks the alignment of the **same stacked layout** (icon above label above description): `center`
centers it, `left` anchors it to the left edge (an icon-less card's title keeps clear of the
indicator). The **smart default** needs no prop — a card **with** an icon centers, an **icon-less**
card left-aligns. Selected card:
brand border + faint `0.04` wash + a soft **halo ring** (`box-shadow: 0 0 0 2px rgba(btn, .12)`). `ChoiceCard` also works **standalone** as a single fancy
checkbox (`checked` + `onChange(checked)` — e.g. an agree-to-terms card). Binds to a `<Form>` by
**`name`** (on the **group**) — form value `string` when `exclusive` (`z.string().min(1)`), else
`string[]` (`z.array(z.string()).min(1)`); the form's error reddens the cards. a11y:
`role="radiogroup"`/`"group"` + `aria-invalid` on the group; the inputs stay focusable + announced.
`ChoiceCard` ships named **and** default, `ChoiceCardGroup` named. Own CSS module. _An
`orientation`/list (row) card layout and a `badge`/price slot are natural next iterations._
