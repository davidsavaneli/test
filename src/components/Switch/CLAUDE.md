# Switch

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A toggle switch — the on/off sibling of `Checkbox`. The native `<input type="checkbox" role="switch">`
is **visually hidden** (sr-only) but focusable + announced; a styled `.track` + sliding `.thumb` show
the state — the track fills from `--tz-btn-rgb` when on and the thumb slides across (token-sized per
`size`). `label` · `color` (on fill, default `brand`) · `size` (`sm`/`md`/`lg` — track/thumb + label)
· `error` · `required` · `disabled` · `checked`/`defaultChecked` · `onChange(checked)` (emits a
`boolean`). `:focus-visible` ring; `error` **reddens the track ring only (no helper text)**, like
`Checkbox`. Binds to a surrounding `<Form>` by **`name`** — its form value is a **`boolean`**. Own CSS
module.
