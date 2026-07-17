# Timeline / TimelineItem

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A **vertical timeline** — events on a rail (order tracking, activity feeds, audit logs); one folder,
two exports (like `Accordion`/`AccordionItem`). Data-driven via **`items`**
(`TimelineEntry[]` = `{ label?, time?, content?, icon? (IconName|node), color? }[]`) or as
**`<TimelineItem>`** children (whose **`children`** is the body; `size`/`color` inherit via context).
**Anatomy of an entry:** a **node** on the rail — an entry **with** an `icon` gets a **soft tinted
circle** (`rgba(color, .12)` fill + the brand-colored icon), one **without** gets a small filled
**dot** (the compact activity-log look; same footprint, so the rail stays centered) — then a `label`
(medium weight), a muted **`time`** caption (the date line), and the **`content`** body (any node). A
lone label sits **level with the circle** (the min-height + centering trick from `ChoiceCard`); taller
bodies grow past it. Per-item **`color`** tints just that node (e.g. `success` for a delivered step —
semantic feeds read at a glance); the timeline's `color` (default `primary`) is the base. The **rail**
is a 1px `--tz-color-border` hairline between node centers that **hides itself after the last entry**
(`:last-child`). `size` (`sm`/`md`/`lg` — node 24/32/40px, dot 8/10/12px, one-off literals like
`Stepper`'s) scales nodes + type together. Display-only (no state, no `<Form>` binding). a11y: a
semantic `<ol>`/`<li>` list (name it with `aria-label`); nodes + rail are `aria-hidden`. The tint rides
a per-item inline **`--tl-rgb`** var (the `--tz-btn-rgb` idiom). `Timeline` ships named **and**
default, `TimelineItem` named. Own CSS module. _An `opposite`/two-column layout, a horizontal
orientation, and a collapsible "show more" tail are natural next iterations._
