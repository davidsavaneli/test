# TextField

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A labeled text input. `label` · `size` · `error` + `helperText` (red border/ring + helper in the
error color) · `required` (asterisk) · `fullWidth` (**default `true`**) · `disabled` · `adornment` + `adornmentPosition`
(`left` default / `right`) · `onAdornmentClick` (makes an **icon** adornment a clickable `IconButton`;
needs `adornmentLabel` for its `aria-label`, default `"Field action"`; ignored for string adornments).
The `adornment` is type-driven: a **string/number** renders as a muted text prefix/suffix
(e.g. `"https://"`, `"$"`, `"kg"`) that reads into the input; any other **node** renders as an icon
inside an `IconButton` (`variant="text"`) — clickable when `onAdornmentClick` is set, otherwise
`nonClickable` + `aria-hidden` (decorative). The icon box fills the control's inner height as a flush
square (CSS overrides the `IconButton` size via `align-self: stretch` + `aspect-ratio: 1`), so the
icon's inset is identical on top, bottom and its outer side; the `<input>` drops its padding on whichever
side the adornment occupies. Passing **`type="password"`** auto-adds a show/hide reveal toggle
(`Eye`/`EyeSlash`) in the right adornment slot — it flips the input between `password`/`text` and
overrides the `adornment` props for that field (no separate `isPassword` prop; the standard `type`
drives it). **Password extras** (all default off except the toggle): **`passwordToggle`** (default
`true`) drops the reveal button when `false` (e.g. to keep your own right adornment);
**`capsLockWarning`** shows a **"Caps Lock is on"** hint (a `Danger` icon + `warning`-colored line)
under the field while it's focused and Caps Lock is active (detected from key events, so it appears
once typing starts, and clears on blur); **`passwordStrength`** shows a **segmented strength meter**
(3 bars + a `Weak`/`Medium`/`Strong` label colored `error`/`warning`/`success`) derived from the
current value via a cheap built-in score (length ≥ 8 · mixed case · a digit · a symbol → 0–4) — a UX
hint, **not** a security check. Input-level constraints:
`regex` (allowed-input filter — a change whose value fails the pattern is rejected, e.g. `/^\d*$/`)
and `mask` (`9` digit · `a` letter · `*` alphanumeric · other chars literal, e.g. `"(999) 999-9999"`).
Works controlled (`value`+`onChange`) or uncontrolled (`defaultValue`); with a `mask`, `onChange`
emits the **masked** value. Structure: `.control` owns the border/background and shows the focus
ring via `:focus-within`; the bare `<input>` is transparent. The label and helper text render
through `Typography` (consistent type scale; helper color flips to `error`), while the label stays
a native `<label htmlFor>` for the input association (Typography's types don't expose `htmlFor`).
a11y: label `htmlFor`, `aria-invalid` while `error`, `aria-describedby` → helper. TextField is purely
presentational on its own, but inside a `<Form>` a **`name`** prop auto-binds it to the form
(value/onChange/onBlur/error/helperText) via context — explicit props still win. The validation engine
is `useForm` (see the Form section).
