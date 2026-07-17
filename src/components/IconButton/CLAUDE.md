# IconButton

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

Square (width = height = `--tz-control-height-*`). Same `variant`/`color`/`size` system as Button,
plus `loading`, `rounded` (→ circle), `disabled`, and `nonClickable`. Pass an `<Icon />` as the
child; it's **auto-sized to the button's `size`** (cloned to match unless it sets its own `size`), and
while `loading` it's swapped for the `Loader`. **Requires `aria-label`** (no visible text).
