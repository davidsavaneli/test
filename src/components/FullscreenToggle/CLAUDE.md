# FullscreenToggle

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

Wraps `IconButton` (default `variant="outlined"`), mirroring `ThemeToggle`. Toggles the browser
**Fullscreen API** on click — `document.documentElement.requestFullscreen()` to maximize,
`document.exitFullscreen()` to restore — and flips its `Maximize3` icon 180° while fullscreen (so it
reads as "minimize"), keeping state in sync via the `fullscreenchange` event. **Renders nothing where
the Fullscreen API is unavailable** (e.g. iOS Safari on iPhone), so it auto-hides on devices that
can't go fullscreen. Both calls are `?.`-guarded (no-op where the
API is unavailable) and `.catch`-swallowed (a blocked request is ignored). `role="switch"`,
`aria-checked`, `aria-label="Toggle fullscreen"`. Props = `Omit<IconButtonProps, 'children'>`.
