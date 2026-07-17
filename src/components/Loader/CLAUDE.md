# Loader

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

`size` (matches Icon: 16/20/24px) · `color?: ThemeColor`. Circular CSS spinner; border uses
`currentColor` so it inherits text color. `role="status"`, `aria-label="Loading"`. Animation
`tz-loader-spin 0.6s linear infinite`.
