# Flag

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A small rounded **country/language flag**. Given a **`code`** (a UI-language code like `'ka-GE'`), it
looks the flag up in the library's built-in flag registry (**`flagFor(code)`** in `src/i18n/messages.ts`,
matched by **base language** — `'ka-GE'` → `'ka'`) and renders that SVG. The markup is **library-shipped
(trusted)**, so it's injected via `dangerouslySetInnerHTML`; the component renders **nothing** (`null`)
when the language has no shipped flag, so it's safe to drop in unconditionally. **`size`** (default `16`)
is the flag **height** in px — the width follows the flag's **4:3** ratio via `aspect-ratio`, driven by
the inline `--tz-flag-height` var. The tile is `--tz-radius-xxs`-rounded with a hairline
`--tz-color-border` inset ring and `object-fit: cover`. Decorative by default (`aria-hidden`), since the
adjacent language label carries the meaning. `forwardRef` to the `<span>`; standard `className`/`style`
/`...props` pass through. Each shipped language ships its own flag from its `src/i18n/locales/<base>.ts`
file (e.g. `EN_FLAG`), registered in **`BUILTIN_FLAGS`**; a language with no entry simply renders no flag.
Used by the **`RootLayout`** header language `Dropdown` (each `ListItem`'s leading `icon`). Own CSS module.
