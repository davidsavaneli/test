# TagsField

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A tags / token input sharing TextField's chrome (label/helper/error/`required`/`fullWidth`/`disabled`/
`size`/`<Form>` binding by **`name`** for validation). Existing tags render as **`Chip`s** (with delete
buttons) wrapping inside the `.control`, followed by an inline `<input>` and a flush-right **add**
`IconButton`. **Committing a tag:** press **Enter**, click the add button, or type the **`separator`**
key (single-char separators only); **removing:** a chip's delete button, or **Backspace** on the empty
input pops the last; a typed-but-uncommitted value is also committed on **blur**. The **`separator`**
(default `,`) splits **pasted** text too — pasting `"react;typescript"` with `separator=";"` adds both.
**Dual value shape:** `value`/`defaultValue` accept **either a `string[]` or a `separator`-joined
`string`**, and `onChange` **mirrors the input's shape** (emits a `string` when the value is a string,
else a `string[]`) — so it binds to a `<Form>` whose schema is `z.array(z.string())` **or** `z.string()`.
Duplicates are ignored unless `allowDuplicates`; `color` (default `primary`) tints the chips (chip
`size` tracks the field `size` 1:1). The input carries `name` so the form's **scroll-to-error** focuses it. The add
button uses `onMouseDown`-preventDefault (clicking it doesn't blur → no double-add), disables when the
input is empty, and is the same flush-square icon treatment as a TextField adornment (`align-self:
stretch` + `height: auto` so it conforms to the control instead of imposing its native height). A
single-row control matches the field family's `--tz-control-height-*` (and grows as tags wrap); the
left inset matches TextField (`--tz-space-sm`) while empty (so the placeholder lines up) and tightens
to `--tz-space-xs` once at least one chip is present. Own CSS module (mirrors `TextField.module.css`;
the `.control` wraps and grows with the tags). Controlled (`value` + `onChange`) or uncontrolled
(`defaultValue`).
