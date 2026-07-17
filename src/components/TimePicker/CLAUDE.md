# TimePicker

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

The **time-only sibling** — `DateTimePicker` minus the calendar. A typed masked time input + a popover
holding just the reused **`TimeColumns`** (hour / minute / optional second + AM/PM in 12-hour mode) and a
**Done** footer. Reuses DatePicker's field chrome (`DatePicker.module.css`: control/input/clear/sizes/
helper/popover) and has a tiny own module (`TimePicker.module.css`: just the footer — the popover hugs
its time columns, no width constraint). The trigger icon is **`Clock`** (vs DatePicker/DateTimePicker's
`Calendar3`). Shares the
field API (`label` · `size` · `error` + `helperText` · `required` · `fullWidth` default `true` ·
`disabled` · `clearable` · `<Form>` binding by **`name`**) and the time props **`hour12`** /
**`minuteStep`** / **`showSeconds`** (default `true`). **Value contract — `valueFormat`** (dayjs tokens,
default the UTC time-of-day `'HH:mm:ss[Z]'`, or `'HH:mm:ss'` when `utc={false}`): incoming values are parsed leniently by **`parseTime`** (the `valueFormat`
first, then a numeric time anchored to a fixed date so `'09:35:49.6134342'` is accepted ms-capped, then
any ISO-8601 datetime whose time is used), and `onChange` emits the chosen time in that format. Like
`DateTimePicker` it follows **"store UTC, show local"** (value UTC, displayed/edited local;
`utcToLocalWall`/`localWallToUtc` at the boundary; the bare-time parse anchors to _today_ so the offset
is current) — and the same **`utc={false}`** opt-out disables the conversion (emit the picked wall-clock
as-is). **Only the time-of-day matters — the date part is
ignored** (all comparisons are time-component only via a `sameTime` helper, so a no-op focus/blur or
re-pick never rewrites finer time). The display `format` defaults to `'HH:mm:ss'` (→ `hh:mm:ss A` for
`hour12`, `:ss` dropped when `showSeconds` is `false`).
Picking keeps the popover open (closes on outside-pointerdown / `Escape` / **Done**); the hours column
**autoFocuses** on open (there's no calendar to take focus). No `min`/`max` in v1. All math is **UTC**.
Controlled or uncontrolled; binds to a `<Form>` by **`name`** (value = the time string).
