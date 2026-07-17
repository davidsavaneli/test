# MultilineTextField

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

The **textarea sibling of `TextField`** — same chrome and behavior, but a `<textarea>` with a
**dynamic height**. It shares TextField's label/helper/error/`required`/`fullWidth`/`disabled`/`size`
(`sm/md/lg` → font size; height is dynamic, not fixed) and `<Form>` binding by **`name`** (form value
is a `string`, like TextField). The textarea **auto-grows** with its content from **`minRows`** (default
`3`, the starting + smallest height) up to **`maxRows`** (default `6`; pass `Infinity` for unbounded) —
past it the field caps and scrolls (the auto-grow logic flips `overflow-y` to `auto`). It does **not**
carry the input-only extras (adornment /
password reveal / `mask` / `regex`). Resize is JS-driven (`resize: none`): on every value change a
`useLayoutEffect` collapses the height to `auto`, then sets it to `scrollHeight` clamped to `maxRows`
(line-height/padding read from `getComputedStyle`); it also re-runs on window resize (re-wrap). The
forwarded ref + an internal ref are merged so the field can measure itself. Controlled (`value` +
`onChange`) or uncontrolled (`defaultValue`). Own CSS module (mirrors `TextField.module.css`, minus the
adornment rules; the `.control` has no fixed height and `align-items` defaults so the textarea fills).
