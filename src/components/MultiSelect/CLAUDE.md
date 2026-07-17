# MultiSelect

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

The **`string[]` sibling of `Select`** (a separate component — kept separate so each has clean,
non-union value types; chosen over a `multiple` prop). Shares all of Select's popover plumbing via the
same **`useFloatingPanel`** hook and the `SelectOption` type. The trigger shows the chosen options as
deletable **`Chip`s** (wrapping + growing like `TagsField`; `color` (default `primary`) tints them, chip
`size` tracks the field) or the `placeholder`; clicking it opens the same listbox. Selecting an option **toggles** it and
**keeps the popover open**; the list is `role="listbox"` **`aria-multiselectable`**, selected options
show a `selected` tint + trailing `TickCircle`. **Keyboard:** Arrow/Home/End, Enter/Space **toggle**
(no close), **Backspace** pops the last chip, Escape closes, type-ahead. `searchable` + `clearable`
(clears all) + `noOptionsText` + **`onSearchChange`/`loading`** (server-side search) — all like Select.
The left inset tightens (`--tz-space-xs`) once chips show
(like `TagsField`). **Value is always a `string[]`**; controlled (`value` + `onChange(values)`) or
uncontrolled (`defaultValue`); binds to a `<Form>` by **`name`** reading the **raw** `form.values[name]`
(not `field().value`, which would String-coerce the array) and writing a real array — validate with
e.g. `z.array(z.string()).min(1, 'Pick at least one')`. Own CSS module (mirrors Select's popover +
TagsField's chip-trigger).
