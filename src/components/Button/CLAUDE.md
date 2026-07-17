# Button

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

`variant` (`contained` default) · `color` · `size` · `loading` · `fullWidth` · `rounded` ·
`disabled` · `startIcon` · `endIcon`. Heights from `--tz-control-height-*`; horizontal padding
`--tz-space-sm`; font size `sm 12 / md 14 / lg 16`. `border: 1px solid transparent` on the base so
height is identical across variants. Label wrapped in `.label`; while `loading` the loader replaces
the `startIcon` if present, otherwise it **trails the label at the end (right)** — so a plain button
(no icons) shows the spinner on the right. The text stays visible. `startIcon`/`endIcon` are
**auto-sized to the button's `size`** (the icon child is cloned to match, unless it sets its own
`size`).
