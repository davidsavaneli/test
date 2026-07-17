# Popover

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

An **anchored popover for arbitrary content** — the generic floating surface (filter panels, forms,
detail cards) that `Dropdown` is **not** (Dropdown is a `role="menu"` of items). Built on the shared
**`FloatingPanel`**: portaled to `<body>`, opens **below the `trigger`** (flips above on overflow),
**locks page scroll**, dismisses on **outside-pointerdown** / **Escape** (refocusing the trigger), and
enters with the shared opacity + translate animation. The **`trigger`** element is cloned to wire
`onClick` (toggle) + `aria-haspopup="dialog"`/`aria-expanded`/`aria-controls` and a merged `ref` (so a
`Badge`-wrapped `IconButton` works as the trigger). **`children`** is any content. **`align`** picks the
horizontal anchor: `start` (default — left edges align, grows right) or `end` (right edges align, grows
**left** — for a trigger near the right edge; vertical side still auto-flips). **`trapFocus`** cycles Tab
within (for form/filter popovers — also sets `aria-modal`); **`matchTriggerWidth`** sizes the panel ≥ the
trigger (select-like); **`width`** sets a fixed panel width; **`ariaLabel`** names the `role="dialog"` panel. Controlled (`open` + `onOpenChange`) or uncontrolled (`defaultOpen`); `disabled`
blocks opening. The panel is `--tz-radius-sm` / `--tz-shadow-md` (from `FloatingPanel`) with
`overflow: hidden` so full-width dividers/footers meet the rounded corners — compose a header (tinted
icon box + title) + a `Divider` + body + footer (e.g. Clear / Close / Filter `Button`s) inside, mirroring
`Card`/`Modal`. Own CSS module. _Placement variants (top/left/right) + an arrow are natural next iterations._
