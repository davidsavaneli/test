# Overlay (internal)

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

The single shared **backdrop** behind every dimmed, page-blocking surface — **`Modal`** (and thus
`RemoveDialog`) and the FileUploader **lightbox** (`FileUploaderPreview`) both render it, so the portal +
fixed scrim + scroll-lock + fade-in + dismissal aren't written per component. It's the backdrop analog of
`FloatingPanel` (which is for anchored, non-dimmed popovers — the two never overlap: `Overlay` dims + blocks
the page, `FloatingPanel` floats beside a trigger). Props: `open` (gates the portal + drives the fade) ·
`onClose?` · `closeOnBackdrop?` (default `true`) · `closeOnEscape?` (default `true`) · `lockScroll?`
(default `true`, via `useLockBodyScroll`) · `dim?` (scrim alpha, default `0.45`; fed to the CSS as an inline
`--tz-overlay-dim` var — the FileUploader lightbox passes `0.85`) · plus any `HTMLAttributes` (`className`,
`role`, `aria-*`, `data-*`). It `createPortal`s a fixed full-viewport scrim to `<body>` (literal black-alpha —
a brand tint would invert in dark mode), **centers its children** (flex), fades in via a rAF `visible` flag →
**`data-open`** on the scrim (consumers read that for their own box's enter transform), and dismisses on
**Escape** (`stopPropagation`-swallowed so a nested overlay's Escape can't reach an outer one — kept as a
React `onKeyDown` on the scrim, not a document listener, precisely to preserve that React-tree swallow) and
**backdrop-click** (gated on the pointer-down AND click both landing on the scrim, so a text-selection drag
ending on it doesn't close). A consumer `onKeyDown` still fires **after** the Escape handling (Modal adds its
Tab focus-trap that way). The base scrim/center/z-index/fade live once in `Overlay.module.css` `.overlay`;
each consumer's own class adds only its layout (Modal's padding + scroll/drawer variants keyed off
`.overlay[data-*]`; the lightbox's inset). **Internal** — no `index.ts`, so the build glob never exposes it
as a `sava-test/components/*` subpath; import it via `../Overlay/Overlay`. The ref points at the scrim div.
