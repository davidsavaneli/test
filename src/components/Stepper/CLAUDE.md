# Stepper

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A step-progress indicator (checkout / wizard / multi-section form). Data-driven via **`steps`**
(`StepItem[]` = `{ label?, description?, optional?, icon?, completed?, error?, disabled?, content? }`) —
**controlled** (**`activeStep`**, **0-based**) or **uncontrolled** (**`defaultStep`**; falls back to the
URL, else the first enabled step): steps **before** the active read **completed** (filled circle + a
`Check` icon), the one **at** it is **active** (filled + a soft **halo ring** so it stands out from the
completed ones), and those **after** it are **upcoming** (muted outline + the 1-based number). A
controlled `activeStep` renders verbatim even past the last step (the "all completed" pattern). **URL
query sync — opt-in, off by default:** pass **`queryKey`** (`boolean | string` — the bare/`true` form
resolves the param name from `config.keys.stepQueryKey`, else `'step'`; a string is a custom name) and
the active step syncs to that query param, written **1-based** (`?step=2` = index 1) via the native
History API, so a refresh restores it (uncontrolled reads the URL on mount; controlled canonicalizes to
its value); restored values are gated by validity (in-range + not `disabled`), an out-of-range active
(e.g. `steps.length` = all done) leaves the URL alone, `popstate` restores on Back/Forward (firing
**`onStepChange(index)`** — wire it to your state in controlled mode), and synced step changes
**replace** by default (pass **`pushHistory`** to walk steps with Back). **With no `queryKey` the URL is
never touched** (unlike `Tabs` — a stepper is often a display-only progress indicator); two synced
steppers on one page need distinct keys. **Two layouts only:** `horizontal` (default) — equal-width columns with each label
**centered under its circle** and an absolute connector line spanning between circle centers — and
`vertical` — steps stacked along an absolute **rail** line down the circle column. Per-step
**`content`** renders while that step is active: **below the whole strip** (a `.panel`) in horizontal
mode, and **inline under the step** (indented past the circle, beside the rail) in vertical mode — the
wizard's page body. Per-step **`icon`** (an `IconName` or node) overrides the number; **`completed`**
forces the done look regardless of `activeStep`; **`error`** reddens the circle + label (a section that
failed validation); **`disabled`** dims it. When the steps don't fit, the **horizontal strip scrolls
sideways** (`overflow-x: auto`, scrollbar hidden — the `Tabs` idiom; each step has a `110px` min-width
so the strip overflows instead of squeezing) and the active step is **kept in view** by moving the
strip's **own `scrollLeft`** on `activeStep` change (not `scrollIntoView`, which also scrolls every
scrollable ancestor — the page would jump to the stepper on mount) — so it fits a phone as-is, with no
vertical collapse. **`onStepClick(index)`**
makes each step head a `<button>` (a `disabled` step never fires; an **uncontrolled** stepper also
selects the clicked step itself) — omit it for a display-only indicator. `size` (`sm`/`md`/`lg` — circle 24/30/38px, one-off literals like `Pagination`'s box px) and
`color` (brand token, default `primary`, via the shared **`--tz-btn-rgb` / `--tz-btn-on`** pattern, set
once on the root). The forwarded ref points at the **root `<div>`** (it wraps the `<ol>` list + the
horizontal content panel); the `<ol>` carries the `aria-label`, the active step `aria-current="step"`,
connectors are `aria-hidden`. Own CSS module. _A `<Form>` binding isn't relevant; a linear/non-linear
click guard and per-step optional-skip are natural next iterations._
