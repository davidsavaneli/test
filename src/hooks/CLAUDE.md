# Hooks

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

`useDisclosure(initial = false)` → `{ isOpen, open, close, toggle }`. Model new hooks on this:
small, typed return interface, `useCallback`-stable handlers. **`useLockBodyScroll(locked)`** locks
scrolling on `<html>` + `<body>` while `locked` (e.g. an open `Dropdown`/modal/drawer) using
**`overflow: clip`** (not `hidden`, so it doesn't establish a scroll container and `position: sticky`
elements like the sidebar/header keep working), compensating for the removed scrollbar with
`padding-right` and restoring the prior inline styles on unlock; it's public from `sava-test/hooks`.

**`useMediaQuery(query)`** → `boolean` — subscribes to a CSS media query (e.g.
`useMediaQuery('(max-width: 640px)')`) and re-renders when it flips. Built on `useSyncExternalStore`,
so the first client render already has the correct value (no flash) and it's SSR-safe (returns `false`
on the server / where `matchMedia` is absent). **Use this for any responsive JS branch** instead of
hand-rolling `window.matchMedia` + effects; public from `sava-test/hooks`.

**`useFloatingPanel({ open, triggerRef, onClose })`** (internal hook, `src/hooks/`) → `{ popoverRef,
position, visible, reposition }`: the floating-panel plumbing — a `<body>`-portaled panel that opens
below its trigger (flips above only on overflow), exposes the trigger width, clamps to the viewport,
re-positions on scroll/resize (+ `ResizeObserver`), locks page scroll, and dismisses on
outside-pointerdown / `Escape`. Not in the public hooks surface.
