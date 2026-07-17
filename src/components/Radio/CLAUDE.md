# Radio / RadioGroup

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A radio button + its group (one folder, two exports — like `Avatar`/`AvatarGroup`). **`Radio`** — the
native `<input type="radio">` is **visually hidden** (sr-only) but stays focusable + announced; a
styled `.circle` + scaled-in `.dot` shows the state (filled from `--tz-btn-rgb`). `value` (**required**)
· `label` · `color` · `size` (`sm`/`md`/`lg`) · `error` · `disabled`. It's built to live inside a
**`RadioGroup`**, which hands down the shared `name`, the current selection, and
`size`/`color`/`disabled`/`error` via context; it also works standalone (`checked` + `onChange(checked)`).
**`RadioGroup`** enforces single-selection and is the usual entry point: `value`/`defaultValue`
(`string`) · `onChange(value)` · `name` · `options` (data-driven `{ value, label?, disabled? }[]`, an
alternative to passing `<Radio>` children) · `orientation` (`vertical` default · `horizontal`) ·
`label` · `error` (reddens the radio rings — **no message text**, like `Checkbox`) · `required`
(asterisk) · `size` · `color` (default `brand`) · `disabled`. `role="radiogroup"` with `aria-invalid`;
the label renders through `Typography`. Binds to a
surrounding `<Form>` by **`name`** — its form value is a **`string`** (validate with e.g.
`z.string().min(1)`), read/written via `values`/`setValue`. Uses the `--tz-btn-rgb` pattern; own CSS
module. `Radio` ships named **and** default, `RadioGroup` named.
