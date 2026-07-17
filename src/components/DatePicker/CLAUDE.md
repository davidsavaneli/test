# DatePicker

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A date field with a **typed, masked input + a calendar popover** (powered by **`dayjs`**, an optional
peer; `dateUtils.ts` extends the `utc` + `customParseFormat` plugins). Shares TextField chrome
(`label` · `size` · `error` + `helperText` · `required` · `fullWidth` default `true` · `disabled`):
the `<input>` accepts typing in **`format`** (default `'DD/MM/YYYY'`, masked numerically via
`maskFromFormat`) and parses **strictly**; a flush calendar `IconButton` (the TextField-adornment
treatment) toggles a popover, and a × clears (`clearable`, **on by default**). The popover (portaled,
flips, scroll-locked, animated — shared **`useFloatingPanel`**) holds the **`Calendar`** primitive,
which has **three views**: a `role="grid"` **day** view with full keyboard nav (**Arrows** move days,
**Home/End** the week, **PageUp/Down** the month, **Shift+PageUp/Down** the year, **Enter/Space**
select) whose header has **circle prev/next arrows** (`ArrowCircleLeft`/`ArrowCircleRight`) plus the
**month and year labels as separate buttons**, and a **month** + **year** picker view behind each
label (arrow-key roving, `Enter` selects). The **day cells are circles** (`border-radius: 50%`);
selected month/year cells are filled pills. **Picking a year advances to the month view; picking a
month returns to the day view** (the month/year pickers have **no nav arrows** — the year view lists
every year in range, ±100 unless `min`/`max` bound it, and **scrolls internally**). **All calendar math
runs in UTC** (so a date never drifts with the viewer's timezone); "today" is the viewer's local
calendar date anchored to UTC. The popover is a **focus-trapped** `role="dialog"` (`aria-modal`;
Tab/Shift+Tab cycle within it so focus can't strand on the scroll-locked page behind); the month/year
views are plain `role="group"`s of buttons (`aria-current` marks the selection) — only the day view is
a `role="grid"`. **Value contract — `valueFormat`** (dayjs tokens, default the ISO datetime
`'YYYY-MM-DDTHH:mm:ss'`), decoupled from the displayed `format`: **incoming `value`/`defaultValue` are
parsed leniently** (the `valueFormat` first, then any ISO-8601 string — so a richer **backend datetime**
like `'2026-06-10T09:35:49.6134342'` is accepted, dayjs capping the fractional seconds at ms), and
**`onChange` emits in exactly `valueFormat` at the start of the UTC day** (a date picker carries no
time-of-day, so the default emits e.g. `'2026-06-10T00:00:00'`; pass `'YYYY-MM-DD'` for a plain date).
A commit is gated on the **calendar day actually changing**, so focusing/blurring or re-picking the
same day never rewrites an unchanged value's time to midnight. Supports **`min`/`max`** (ISO),
**`disabledDate`** (`(iso) => boolean`), and
**`weekStartsOn`** (0–6, default `1` = Monday). Disabled days stay focusable for keyboard nav but
aren't selectable. Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`); binds to a
`<Form>` by **`name`** (value = the `valueFormat` string; the input carries `name` for
**scroll-to-error**; touched fires on blur outside the widget). Own CSS module (TextField chrome +
calendar). The masked typed input assumes a **numeric** `format` (month-name formats display fine but
type freeform; the `A`/`a` meridiem token is handled — see `DateTimePicker`). _The remaining date
components — `DateRangePicker`, `DateTimeRangePicker` — will follow, reusing `Calendar` + `dateUtils`._
