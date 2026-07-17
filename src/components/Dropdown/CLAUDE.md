# Dropdown

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A floating menu anchored to a `trigger` (a `Button`/`IconButton`/anything), composing `ListItem`s as
`children` inside a `role="menu"` `List`. The panel is **portaled to `document.body`** and positioned
by an inline (JS) algorithm with **collision handling**: it opens at `placement` (`bottom-start`
default · `bottom-end` · `top-start` · `top-end`), **flips** to the opposite vertical side when it
would overflow, clamps within the viewport (8px edge padding), caps its height + scrolls when too
tall, and **re-positions on `scroll`/`resize`** (plus a `ResizeObserver` on the panel & trigger). The
panel is `--tz-radius-sm`, `--tz-space-xs` padding, with spaced dividers; `size` (`sm`/`md`/`lg`, default
`md`) sets its **min-width** (150 / 190 / 220px) and the items' density (passed through to the inner
`List size`, which `ListItem`s inherit). **`minWidth`** (default `true`) toggles that size-based
min-width — pass `false` to let the menu size to its content (the items' density still tracks `size`).
While open it **locks page scroll** via `useLockBodyScroll`.
Opens on trigger click; closes on outside `pointerdown`, `Escape` (returns focus to the trigger), or
selecting an item (`closeOnSelect`, default `true`). The trigger is cloned to wire
`onClick` + `aria-haspopup="menu"`/`aria-expanded`/`aria-controls` and a merged `ref` (reads
`props.ref`, React 19). Keyboard: `ArrowDown`/`ArrowUp` rove between focusable items; the first item
is focused on open. Controlled (`open` + `onOpenChange`) or uncontrolled (`defaultOpen`);
`matchTriggerWidth` makes the menu ≥ the trigger width (select-like); `offset` (px, default `6`) is the
trigger gap; `disabled` blocks opening. Enter transition keyed off `data-open`/`data-side` (opacity +
a token-sized translate). Uses `react-dom` `createPortal` (peer dep). Own CSS module.
