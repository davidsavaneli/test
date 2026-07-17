# DateTimePicker

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

The **date + time sibling of `DatePicker`** — a typed masked input plus a popover that splits date and
time into **two tabs** (built with the library's own **`Tabs`**, `queryKey={null}` so the internal
Date/Time tabs never touch the page URL): a **Date** tab holding
the reused **`Calendar`** and a **Time** tab holding scrollable **time columns** (`TimeColumns`: hour /
minute / optional second, + an AM/PM toggle in 12-hour mode). It reuses DatePicker's field chrome
(`DatePicker.module.css` imported for control/input/clear/sizes/helper + the calendar) and adds its own
module for the tabbed popover layout (a fixed calendar-width popover so it never resizes when switching
to the narrower Time tab) and a **Done** footer button. The popover opens on the **Date** tab and the
`Tabs` is given **`autoFocus`** so the active tab takes focus on open (the `Calendar`'s own `autoFocus`
is **not** used here — a tab switch must not steal focus into the content). Shares the field
API (`label` · `size` · `error` + `helperText` · `required` · `fullWidth` default `true` · `disabled` ·
`min`/`max` · `disabledDate` · `weekStartsOn` · `clearable` · `<Form>` binding by **`name`**) and the
**`valueFormat`** value contract (default UTC ISO datetime `'YYYY-MM-DDTHH:mm:ss[Z]'` — the `Z` marks
the value as UTC — or no-`Z` `'YYYY-MM-DDTHH:mm:ss'` when `utc={false}`; lenient input parse) —
but unlike `DatePicker` the time is **meaningful**, so `onChange` emits the **chosen instant**
(not start-of-day). **Timezone — "store UTC, show local":** the `value`/`onChange` string is always
**UTC**, but the field **displays & edits in the viewer's local timezone** (e.g. a backend
`'2026-06-10T09:35:00'` shows as `13:35` in UTC+4, and editing back emits UTC). This is done by a thin
boundary conversion (`utcToLocalWall` on parse, `localWallToUtc` on emit) — the calendar/time machinery
still runs on a UTC-mode dayjs holding the local wall-clock, so nothing downstream changed. Opt out with
**`utc={false}`** — then there's **no timezone conversion** at all: the field shows and emits the value's
exact wall-clock (what you pick is what's sent). (`DatePicker`
stays UTC/tz-agnostic — a calendar date has no time to localize; for a plain `'2026-06-10'` value use
`valueFormat='YYYY-MM-DD'`.) Time props: **`hour12`** (1–12 + AM/PM vs 24-hour, default `false`; drives the
default `format`), **`minuteStep`** (minutes-column increment, default `1`), **`showSeconds`** (the
seconds column + `:ss`; **default `true`** — pass `false` to drop seconds). The display `format` defaults
to `'DD/MM/YYYY HH:mm:ss'` (→ `hh:mm:ss A` for `hour12`, `:ss` dropped when `showSeconds` is `false`);
the masked typed input supports the meridiem via `maskFromFormat`'s
`A`→`AA`/`a`→`aa` letter slots. **Picking a day keeps the current time and picking a time keeps the day** (each
column pick preserves the other parts), and — unlike DatePicker — selecting a day **does not close** the
popover; it closes on outside-pointerdown / `Escape` / the **Done** button. Typed-input commits are
gated on a change at the input's precision (driven by the `format` — second when it has `:ss`, else minute) so a no-op focus/blur
never zeroes finer time. `min`/`max` bound the calendar at **day** level (time-of-day isn't range-gated
in v1). The time columns are roving `role="listbox"`s (Up/Down/Home/End/Enter, auto-scroll the selected
into view). `TimeColumns` is internal (not exported). Own CSS module (`DateTimePicker.module.css`).
