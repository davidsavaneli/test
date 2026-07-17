# Typography

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

`variant` (`h1 h2 h3 h4 subtitle body bodySmall caption uppercase`, default `body`) ·
`as?: ElementType` (override the tag, keep the styling) · `color?: ThemeColor | 'text' | 'muted'`
(`muted` = `--tz-color-primary-shade600`, the soft secondary-text color; omit to inherit) · `align` ·
`truncate`. Default element per variant (`h1→h1 … body→p … caption/uppercase→
span`). Headings `h1–h4` are bold; everything else is `--tz-font-weight-regular`. No default
margins.
