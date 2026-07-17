# Badge

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A **wrapper** that pins a small count/dot to a child's corner — wrap a `Button`/`IconButton` (or any
node): `<Badge content={2}><IconButton…/></Badge>`. `content` (`number | string`) renders a count;
a `number` is capped to `${max}+` (`max` default `99`) and a numeric `0` is hidden unless `showZero`.
`dot` renders a plain indicator instead (decorative → `aria-hidden`); `content` wins over `dot`.
`color` (default `accent`) tints via the **`--tz-btn-rgb` / `--tz-btn-on`** pattern; `placement`
(`top-right` default · `top-left` · `bottom-right` · `bottom-left`) picks the corner. The badge has a
`box-shadow` ring in `--tz-color-surface` so it reads as cut-out over the control. Own CSS module.
