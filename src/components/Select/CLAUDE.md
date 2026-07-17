# Select

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A single-select dropdown field. The trigger reuses TextField chrome (`label` · `size` · `error` +
`helperText` · `required` · `fullWidth` default `true` · `disabled`) and is a `role="combobox"` `<div>`
(so it can hold the clear button + chevron) showing the selected option's label/icon (or
`placeholder`, default `"Select…"`) + an `ArrowDown4` chevron that rotates while open. Clicking it opens
a popover that **behaves exactly like `Dropdown`** — portaled to `<body>`, opens below (flips above
only on overflow), **matches the trigger width**, locks page scroll, re-positions on scroll/resize,
closes on outside-pointerdown/`Escape`/select, and enters with the shared opacity + translate animation
(`data-open`/`data-side` + rAF `visible`) — **all via the shared internal `<FloatingPanel>` component**
(see below). The listbox padding
(`--tz-space-xs`) matches Dropdown's panel inset. Options are
data-driven (**`options: { value, label, disabled?, icon? }[]`**) rendered as **`ListItem`s** (with
`role="option"`, `tabIndex={-1}`) inside a `role="listbox"` **`List`**; the chosen option shows a
`selected` tint + a trailing `TickCircle` (drop just the tick with **`showSelectedTick={false}`** — the
tint stays; used by `Table`'s compact rows-per-page picker), disabled options are inert. **Keyboard:** Arrow up/down
(skipping disabled), Home/End, Enter/Space to select, Escape to close, and **type-ahead** (buffer with
a 500ms reset) when not searchable; the focused element carries `aria-activedescendant` →
the highlighted option (a `.active` row gets the same light hover tint as a selected row).
**`searchable`** adds a
sticky filter `<input>` (substring match on `label`) that the list scrolls under, with
`searchPlaceholder` + `noOptionsText` (default `"No options"`; pass a **`(query) => node`** to vary the
empty message by the search text — e.g. a "Type to search" hint vs a "No results" message). For
**server-side search**, pass
**`onSearchChange(query)`** — it fires on each keystroke and **disables the built-in local filter** (the
consumer owns `options` for the current query), and **`loading`** shows a centered `Loader` +
`loadingText` (default `"Loading…"`) in the popover. **`clearable`** (on by default) adds a ×
(`CloseCircle`) in the trigger that resets to `''` (`MultiSelect` clears the whole array). Controlled (`value` + `onChange(value)`) or uncontrolled
(`defaultValue`); binds to a surrounding `<Form>` by **`name`** (value = the option's `value`; validate
with e.g. `z.string().min(1, 'Required')`). The trigger carries `name` so the form's
**scroll-to-error** focuses it, and marks the field touched on blur **only when focus leaves the whole
widget** (not when it moves into the portaled popover). Own CSS module.
