# Pagination

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A page navigator — previous/next arrows around a numbered range with `…` gaps (the classic
`1 … 4 5 6 … 10`). Built to be **reused across tables / lists / galleries**: drive it with **`count`**
(total pages, **required** — from a row count pass `Math.ceil(total / pageSize)`) + `page` / `onChange`.
Controlled (`page` + `onChange(page)`) or uncontrolled (`defaultPage`, default `1`); pages are **1-based**
and the active page is clamped to `[1, count]`. The visible items come from a **pure, tested
`paginationRange({ count, page, siblingCount, boundaryCount })`** helper (the MUI algorithm — boundary
pages + the current page's siblings + `start`/`end` ellipses; **internal**, not exported, like
`buildNavTree`). **`siblingCount`** (default `1`) sets pages on each side of the current; **`boundaryCount`**
(default `1`) the pages pinned at each edge. **`variant`** is `outlined` (default — every page/arrow is a
bordered box) or `text` (borderless); the **selected** page is always a solid accent fill via the shared
**`--tz-btn-rgb` / `--tz-btn-on`** pattern (`color`, default `accent`). `size` (`sm/md/lg` → compact box
**28/32/36px** — a literal-px exception like the RTE toolbar, no token maps to these — + font/icon on the
shared scale), **`rounded`** (circular page buttons), **`disabled`** (disables every
button). Arrows: prev/next always shown (toggle with **`hidePrevButton`** / **`hideNextButton`**), each
disabled at its bound; **`showFirstButton`** / **`showLastButton`** (default `false`) add jump-to-end
controls (the `Previous` / `Next` ⏮/⏭ skip icons). The icon set has **no plain right arrow**, so the
next/last glyphs reuse the left-facing `ArrowLeft` mirrored with `transform: scaleX(-1)` (`.flip`) for
symmetry. Ellipses render a non-interactive muted `…`. a11y: a `<nav>` with a configurable `aria-label`
(default `"Pagination"`) wrapping a `<ul>`; the current page carries **`aria-current="page"`** and each
button an `aria-label` (`"Go to page N"` / `"Go to previous page"` / …). Own CSS module. _A `<Form>`
binding isn't relevant (it's navigation, not a field); a `count`-from-`total`+`pageSize` convenience prop
is a natural next iteration (URL-sync via `keys.page` / `keys.size` now lives in `Table`)._
