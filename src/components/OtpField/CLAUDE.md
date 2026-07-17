# OtpField

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A **one-time-passcode input** — a row of single-character boxes for verification codes. **`length`**
(default `4`) sets the box count; **`type`** (`'numeric'` default · `'alphabetic'` · `'alphanumeric'`)
restricts the accepted characters (via a per-type regex) **and** the mobile keyboard (`inputMode`
`numeric` vs `text`). **Interaction:** typing a char advances to the next box (boxes **select-on-focus**,
so typing in a filled box replaces), **Backspace** clears + steps back, **Arrows** navigate, **Delete**
clears the box, and **paste / iOS SMS autofill** distribute the whole code across the boxes (a full code
landing in one box — the autofill case — is detected and spread, since a multi-char change can't be a
single keystroke). Autofill is wired via **`autocomplete="one-time-code"`** on the **first** box (the
others `off`). **Value is the concatenated string** — controlled (`value` + `onChange`) or uncontrolled
(`defaultValue`); **`onComplete(value)`** fires once every box is filled. Shares the field-family chrome
(imports `TextField.module.css` for `label` · `error` + `helperText` · `required` · `disabled`) + its
own module for the boxes; **`size`** (`sm`/`md`/`lg` — square box 40/48/56px + char font, one-off
literals) and **`color`** (default `primary`, the shared **`--tz-btn-rgb`** pattern → caret + focus ring

- active box), plus **`placeholder`** (a char in empty boxes) and **`autoFocus`**. Binds to a `<Form>` by
  **`name`** — form value is the code `string` (validate with e.g. `z.string().length(4)` or a
  `type`-matching regex); error/touched come from `field()`, and the **`name` rides the first box only** so
  the form's **scroll-to-error** can focus it (touched fires on blur outside the whole widget). a11y:
  `role="group"` (labelled by `label`, `aria-invalid` while error) with per-box `aria-label`s
  (`"Digit N of M"`). Own CSS module (+ TextField's chrome). _A masked/password mode and a `separator`
  (e.g. a dash between groups) are natural next iterations._
