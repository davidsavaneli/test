# ThemeToggle

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

Wraps `IconButton` (default `variant="outlined"`). Shows `Icon name="Sun"` in light mode, `"Moon"`
in dark; flips `mode` via `useTheme().toggleMode` on click. `role="switch"`, `aria-checked`,
`aria-label="Toggle color theme"`. Props = `Omit<IconButtonProps, 'children'>`, so `variant`,
`color`, `size` pass through.
