# FloatingPanel (internal)

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

The single shared popover, wrapping `useFloatingPanel` — **every floating popover in the library**
(`Select` / `MultiSelect`, `DatePicker` / `DateTimePicker` / `TimePicker`, `ColorPicker`, and the public
**`Popover`**) renders it, so the portal + positioned div + `data-open`/`data-side` + enter animation +
(optional) focus-trap aren't written per component. Props: `open` · `triggerRef` · `onClose(refocus)` ·
`align?` (`start` default · `end` right-aligns + grows left, used by `Popover`) ·
`id?` (for the trigger's `aria-controls`, used by `Popover`) · `role?` (`'dialog'`) · `ariaLabel?` ·
`trapFocus?` (traps Tab **and** sets `aria-modal` — for the modal date/time dialogs + form popovers) ·
`matchTriggerWidth?` (select-like, used by Select/MultiSelect) · `width?` (fixed, e.g. ColorPicker's
`232`) · `className` (merged after the shared chrome) · `style` (e.g. ColorPicker's `--cp-hue`). It
**forwards its ref** to the panel element so a consumer can still read it (blur bookkeeping, focus
moves). The base chrome (z-index, border, radius, surface, shadow, `overscroll-behavior`) **and** the
opacity/translate enter animation live once in `FloatingPanel.module.css` `.panel`; each consumer's
own `.popover` class keeps only its layout (padding / `display` / `overflow` / width). **Internal** —
no `index.ts`, so the build glob never exposes it as a `sava-test/components/*` subpath; consumers
import it via `../FloatingPanel/FloatingPanel`. **`Dropdown` is deliberately NOT built on it** — it
keeps its own placement variants + collision-flip + roving-menu keyboard nav + `closeOnSelect` +
cloned-trigger logic.
