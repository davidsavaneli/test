# Divider

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A separator. Plain: `<Divider />` (full-width 1px line) or `<Divider orientation="vertical" />` (an
upright rule that stretches inside a flex row). With `children` it becomes a labeled divider
(`line — title — line`) positioned by `align` (`left` · `center` default · `right`), built with flex +
`::before`/`::after` lines (the short side uses `--tz-space-md`). Line color `--tz-color-border`,
label `--tz-color-primary-shade600` / `font-size-sm` / medium. `role="separator"` (+ `aria-orientation` when
vertical); a label is ignored for vertical. Own CSS module.
