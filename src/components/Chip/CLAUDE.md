# Chip

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A compact pill tag/token. `variant` (`contained` · `filled` **default** · `outlined` · `text`),
`color` (default `primary`), `size` (`sm`/`md`/`lg`) — tinted via the shared `--tz-btn-rgb` /
`--tz-btn-on` pattern across the four variants. **Static by default**; `clickable` makes it interactive
(`role="button"`, pointer + hover, Enter/Space → click), `disabled` dims + inerts it. A leading
`startIcon` **or** `avatar` (the avatar is sized to the chip and flush-left via a scoped
`.<size> .avatar > *` rule), and a trailing delete button when `onDelete` is given (its click
`stopPropagation`s so it never fires the chip's `onClick`; `deleteIcon`/`deleteLabel` customize it,
default `CloseCircle` / `"Remove"`; **`deleteTabIndex`** takes the delete button out of the tab order
(pass `-1` when the chip lives inside a composite widget that owns focus, e.g. `MultiSelect`)). Root is
a `<div>` (not a `<button>`) so the delete `<button>` doesn't nest. Default variant is `filled` (a deliberate, chip-appropriate deviation from the
`contained` default in §6's vocab). Own CSS module.
