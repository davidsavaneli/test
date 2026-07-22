# Accordion / AccordionItem

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A set of collapsible panels (settings sections, FAQs, grouped forms) — one folder, two exports (like
`Radio`/`RadioGroup`). **`Accordion`** is the group: **`exclusive`** picks single-open (`value` is a
`string | null` — opening one closes the others) vs multi-open (`value` is a `string[]`); **default
`false` (multiple)**. Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`) — `onChange`
emits the `exclusive` shape (`string | null` vs `string[]`), the same value pattern as
`ToggleButtonGroup`. Supply panels via the data-driven **`items`** (`{ value, label, icon?, content,
disabled? }[]`) or as **`<AccordionItem>`** children; the group shares the open state, `size`
(`sm`/`md`/`lg`), and `disabled` via context. **`AccordionItem`** renders a header `<button>` (`label`

- optional `icon` + a clean chevron `ArrowDown4` that rotates 180° when open — muted closed, full text
  color when open) over a body that **folds with
  the shared `grid-template-rows: 0fr → 1fr` animation** (the same CSS-only technique as `Card`'s
  `collapsible` + the Sidebar nav fold — no JS height measurement). The panels are **separated cards**
  (each a bordered, rounded `surface` panel with a gap between them, not a joined box); the **open
  panel** is set apart by a darker hairline only — **shadowless**, matching the flat Card look (no
  header hover fill either). The body text
  sizes with the accordion `size` (`--ac-font`). a11y: each header is a `<button>` with `aria-expanded` + `aria-controls` → its body
  `role="region"` (`aria-labelledby` back to the header). `AccordionItem` requires an `<Accordion>` ancestor
  (throws otherwise). `Accordion` ships named **and** default, `AccordionItem` named. Own CSS module. _A
  `<Form>` binding isn't relevant; keyboard arrow-roving between headers is a natural next iteration._
