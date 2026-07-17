# PageLayout

> Part of the `@techzy/ui` admin shell — full shell architecture in
> [`../RootLayout/CLAUDE.md`](../RootLayout/CLAUDE.md); the base Card anatomy it inherits in
> [`../Card/CLAUDE.md`](../Card/CLAUDE.md). Folder-local facts below.

**Folder specifics**

- A **flat `Card`** (`<Card flat>`) for a page's content — so it gains Card's full anatomy (optional
  header `icon`/`title`/`subtitle`/`actions`, body, `footer`/`footerStart`, `collapsible`) while
  staying on the `--tz-color-background` canvas with **no shadow** (blends into the shell canvas).
- Props are **`Omit<CardProps, 'flat'>`** (always flat). Ships **named and default** from
  `sava-test/components/PageLayout`.
