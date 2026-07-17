# Alert

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A message banner — the inline feedback surface (info / success / warning / error). `variant`
(`contained` · `filled` **default** · `outlined` · `text`) and **`color`** (default `info`) tint it via
the shared **`--tz-btn-rgb` / `--tz-btn-on`** pattern: `filled` is a soft `0.1` wash with dark text + a
colored icon, `contained` is the solid fill with contrast (white) text + icon, `outlined` is the
`surface` panel + a `0.5` color border, `text` is bare. A **semantic leading `icon` is auto-picked
per color** (`success → TickCircle`, `error → CloseCircle`, `warning → Warning`, `info → InfoCircle`;
other colors → `InfoCircle`) — override with **`icon`** (an `IconName` or node) or drop it with
**`icon={false}`**. The icon is the brand color on the light variants and inherits the contrast text on
`contained`. A trailing **`action`** slot (a `Button`, e.g. `UNDO`) sits before an optional **`onClose`**
× **`IconButton`** (`variant="text"`, `closeLabel` default `"Close"`) that the alert CSS shrinks below
the `sm` preset to a compact 24px box and re-tints — its × inherits the alert text color (dark on light
variants, contrast on `contained`) over a faint color wash (a literal white-alpha on `contained`, where a
brand tint wouldn't read; `.alert .close` outranks IconButton's own size/variant rules). `children` is the
message. `role="alert"`. The 24px close box / 14px × are one-off literal sizes. Own CSS module. _A `title`
line + auto-dismiss timer are natural next iterations._
