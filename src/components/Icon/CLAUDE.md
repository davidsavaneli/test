# Icon

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

`name: IconName` (required) · `color?: ThemeColor` · `size` (`sm` 16 / `md` 18 / `lg` 22px).
Renders an inline SVG from the generated registry; `fill: currentColor` so it follows text color
unless a `color` token is set. `aria-hidden`, `focusable={false}`.
