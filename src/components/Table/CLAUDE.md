# Table

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A data table built on **TanStack Table** (`@tanstack/react-table` `>=8`, **headless** — an optional peer,
`external`/never bundled, like `zod`/`dayjs`). TanStack ships **zero markup/CSS** — it's the state engine
(sort / filter / pagination); the library renders its **own** `<table>` styled entirely with `--tz-*`
tokens and **composes the existing components**: **`TextField`** (search, `SearchNormal` adornment),
**`Select`** (rows-per-page), **`Pagination`** (footer nav), **`EmptyState`** (no rows), **`Loader`**
(loading overlay). **Column API — deliberately simple** (`TableColumn<T>`, hides TanStack): `{ key,
header, cell?, sortable?, width?, maxWidth?, wrap?, align?, pinned? }[]` — `key` is the field accessor +
column id + sort/search key; `cell?: (row, index) => ReactNode` for custom renders (a `Chip`, `Avatar`,
formatted date), else the `key` value stringified. An **empty cell** (a blank value, or a `cell` that
returns `null`/`''`/`false`) shows a muted **"—" placeholder** so it reads as "no value" — a real `0` is
kept (not treated as empty). Cells are **single-line by default** (`white-space:
nowrap` → the table scrolls horizontally instead of squeezing); opt a long-text column in with **`wrap`** —
content flows onto 2+ lines (the row grows, `overflow-wrap: break-word` breaks a long unbroken token) and it
caps at a readable **`280px`** on its own (the cell sits at that width via an inline `width`, so it doesn't
get starved by the unbounded single-line columns), so `wrap` alone is usually enough. **`maxWidth`** overrides that
cap (and also implies `wrap`) for a wider/narrower column. Rows are a **minimum 51px** tall (a
table-cell `height`, so a wrapped/multi-line cell grows past it). **`pinned: 'left' | 'right'`** sticks the
column to that edge
(`position: sticky` + an opaque bg + a **persistent hairline separator** — an **inset** `box-shadow`, not a **`pinned: 'left' | 'right'`** sticks the column to that edge
(`position: sticky` + an opaque bg + a **persistent hairline separator** — an **inset** `box-shadow`, not a
`border`, which renders unreliably on a sticky cell under `border-collapse: collapse` and vanishes while
scrolled — **plus** an outset edge shadow layered on for depth only while content is hidden under it, driven
by a `data-pin-start`/`data-pin-end` scroll flag; the stripe/hover tint is layered over the pinned bg). A
pinned column with **no `width`** defaults to **content-width** (the `width: 1px` min-content trick) so an
actions column fits its buttons instead of absorbing the table's spare width — set `width` to override. So
it stays put while the rest scrolls — e.g. an actions column pinned `'right'` (one column per edge).
**Row actions — the shortcut:** rather than hand-building that pinned column, pass
**`actions: (row, index) => ReactNode`** — return your own action UI (`IconButton`s / a menu / etc.) and the
table renders it right-aligned in a **pinned-right actions column** it appends for you. The cell is
`stopPropagation`-wrapped, so clicks inside never fire the row's `onClick` — your handlers don't deal with
that. (It's just a render slot, so anything goes; use a full `pinned` column in `columns` only if you also
need it sortable/searchable.) **Two data modes, one flag:** **local** (default — pass the full `data`; the
table searches / sorts / paginates client-side via TanStack's row models) or **server**
(**`manualPagination`** — pass only the current page in `data` + the total in `rowCount`; TanStack tracks
state but slices nothing, and you fetch in **`onChange`**). `TableProps` is a **discriminated union on
`manualPagination`**, so the type **requires `rowCount` in server mode** (it can't be derived from a single
fetched page) and treats it as optional/ignored in local mode. **`onChange(state)`** fires on mount + every
change with the full **`TableChangeState`** `{ page (1-based), size, search, sort: { key, direction } |
null, params, query }` — the server-mode fetch driver (search changes are **debounced** by **`debounceMs`**,
default `300`). **`params`** (a `URLSearchParams`) / **`query`** (its string) are the **ready-built
server-request query** so the fetch doesn't hand-map anything — `fetch(`/x?${state.query}`)`. They're built
from the **query mapping** (app-wide `config.table.query` merged with the per-table **`queryMapping`** prop —
see §5's `table.query`): param names + `page`-vs-`offset` (`skip`) + sort format (`sort=-price` vs
`sortBy=price&order=desc`), so e.g. DummyJSON needs only `queryMapping={{ pageParam: 'skip', sizeParam: 'limit', searchParam:
'q', sortParam: 'sortBy', pagination: 'offset', sortFormat: 'separate' }}`. The **endpoint/path/fetch stay yours**
(Table never fetches); the pure builder is exported as **`buildTableQuery`** (`sava-test/helpers`). **Search** (`searchable`) is a debounced global substring filter (`globalFilterFn:
'includesString'`) in local mode, or emitted in `onChange` for server mode. **Sorting** is per-column
(`sortable`) but **not from the header** — it lives in a **toolbar sort menu**: a `Sort`-icon `Dropdown`
next to the search that opens a quiet uppercase **"Sort By" label** over **one row per sortable column** (the
column header as the label). Clicking a row **cycles that column asc → desc → unsorted**; the **active** row
gets the `selected` tint + a trailing direction arrow (`ArrowUp2` asc / `ArrowDown` desc). While a sort is
applied the trigger reads `filled` **and carries a dot `Badge`**, and the header carries no sort control,
only `aria-sort` (a11y) reflecting the current sort. Local sorts client-side, server emits it in `onChange`. **Pagination**
reuses the `Pagination` component (prev/next + numbered pages; the **first/last jump arrows** are opt-in via
**`showFirstButton`** / **`showLastButton`**, off by default); the footer also shows a rows-per-page `Select` (**`pageSizeOptions`**, default
`[10, 20, 50, 100, 200]`; **`showPageSize`**; the Select passes **`showSelectedTick={false}`** for a
compact look) plus an **"All"** choice (**`allowAllRows`**, default `true` — pass `false` to hide it for
large datasets) that puts every row on one page, and a `"1–10 of N"` range. "All" is a **sentinel page
size** (`Number.MAX_SAFE_INTEGER`) — `state.size` carries it verbatim in `onChange` (server consumers treat
it as unbounded; the server query drops the size param unless `allValue` is set), and it is **not written to
the browser URL** (see URL sync below). Changing size / sort resets to page 1; the page clamps if the
row count shrinks beneath it. **Controlled or uncontrolled, per piece** (like the rest of the library):
each of **`page`** / **`pageSize`** / **`search`** / **`sort`** / **`filterValues`** may be passed with its
**`onPageChange`** / **`onPageSizeChange`** / **`onSearchChange`** / **`onSortChange`** / **`onFiltersChange`**
callback to own that state from outside (e.g. reset filters from an external button, or drive the page from
a parent) — omit it to let the table manage that piece internally (seeded from the matching `default*`). Mix
freely; each is resolved as `controlled ?? internal`, and every mutation still fires the aggregate `onChange`
too. (These granular callbacks are the controlled channel; `onChange` stays the full-state fetch driver.) The **page navigator hides entirely when everything fits on one page**
(`pageCount ≤ 1` — e.g. the "All" size or few rows); the rows-per-page select + `"1–N of N"` range stay.
**URL sync — ON by default, and it mirrors the server request exactly:** page + size + search + sort +
filters are written to the query with the **same builder as `state.query`** (`config.table.query` merged
with the `queryMapping` prop), so the address bar matches the request one-to-one (e.g.
`?page=1&size=10&sortBy=rating&orderBy=desc`, and filters like `?category=a&category=b&price_gte=10&price_lte=100`).
Written via the native History API (`replaceState`, like `Tabs`, preserving params the table doesn't own),
read back on mount (via the exported **`parseTableQuery`** + the internal `parseFilterQuery` — a URL value
wins over `defaultSort` / `defaultSearch` / `defaultFilters`) and restored on `popstate`. An empty
search / sort / filter drops out of the URL, and on the **"All"** size the page + size params drop entirely
(a clean URL, since there's no meaningful page — "All" isn't persisted, so a reload falls back to the default
size). Pass **`urlSync={false}`** to opt out. (There's **no separate `keys.*QueryKey` layer** any more — the
URL param names ARE the `table.query` names, so two URL-synced tables on one page need distinct param names
via their `queryMapping`.) The table renders at a single (md) density — no `size` prop. Other props: **`title`** +
**`toolbar`** (extra toolbar content, e.g. a future filters slot), **`getRowId`** (stable row id — the React
key; defaults to the row **index**, fine for static data but reuses DOM by position when rows reorder or a
server page swaps in, so pass a real id like `(row) => row.id` for any interactive/changing table; a
**dev-only `console.warn`** nudges this when `onRowClick`/`actions` is set without `getRowId`),
**`onRowClick`**, **`loading`** (**with rows already shown** — a token-scrim overlay + `Loader`
dims them while refetching; **with no rows** — a centered `Loader` + `"Loading…"` caption fills the body,
mirroring the empty state's presence rather than a lone tiny spinner), **`empty`** (custom empty node — the
default is a full patterned `EmptyState`), **`stickyHeader`**, **`striped`**, **`hoverable`**
(default `true`). **Row reorder** (**`reorderable`**): prepends a **drag-handle** column (a grip `Menu`
icon, content-width) and makes rows drag-sortable via **`@dnd-kit`** (`PointerSensor` 5px + `KeyboardSensor`:
focus the grip → Space → Arrows → Space). The handle sets **`touch-action: none`** so the pointer sensor
owns the touch gesture (otherwise a touch-drag scrolls the page and reordering never starts on phones); a drop fires **`onReorder(rows, meta)`** with the **full `data`
reordered** (the consumer owns `data` and sets it) + a **`meta`** (`TableReorderMeta` = `{ id, from, to }` —
the dragged row's id + its old/new index, e.g. to log or persist the move). **Local mode**, best with no active sort (a sort fights a
manual order), and **requires `getRowId`** for stable dnd ids (the dev warning above also fires for
`reorderable` without it). The dragged row lifts with a subtle highlight; the body wraps in a `DndContext`
only while `reorderable` (a `SortableContext` of the row ids, each row a `SortableRow`). The drag is
**clamped** by two inlined dnd-kit modifiers (no `@dnd-kit/modifiers` dep) — vertical-axis + restrict-to-parent
(`<tbody>`) — so a row dragged past the table's top/bottom edge can't extend beyond it and grow the
`overflow` scroll container (which is vertically scrollable since `overflow-x: auto` forces `overflow-y: auto`).
The drag itself relies on trusted pointer/keyboard events, so it's verified in a real browser, not jsdom
(tests cover the render contract — a handle per row, gated by the prop). **Export** (**`onExportToEmail`**): a toolbar export `Dropdown` (an export-icon trigger next to
sort) opening an uppercase **"Export" label** over a **single baked "Send On Email" item** (label + icon
hardcoded). Set the **`onExportToEmail`** prop (`(state: TableChangeState) => void`) to show the menu; on click
it fires with the current state so you just wire your endpoint — e.g.
`onExportToEmail={(s) => exportCustomers(s.query)}`. There's **no built-in client-side CSV**; the menu hides
when `onExportToEmail` is omitted.
**Filters** (**`filters`**): declarative filter defs (`TableFilter[]` = `{ key, label, type, options?,
placeholder? }`) render a toolbar **Filters** button (a `Filter` icon with a **count `Badge`**) opening a
right **drawer** (`Modal placement="right"`) — a `Modal`, not a popover, so the nested `Select` /
`DatePicker` popovers work inside it (the `FloatingPanel` outside-pointerdown would otherwise close a
popover-based panel). The drawer has a `Filter`-icon header + a right-aligned footer with **Clear** (`text`,
Trash icon — resets the draft fields) + **Apply** (commit); it edits a **draft** committed only on Apply.
There's no Cancel — the Modal's **×** / **Escape** / **backdrop** dismiss the drawer, discarding the draft. Core types: **`text`** (contains) · **`number`** (=) · **`numberRange`** (two open-bounded Min/Max
`NumberField`s — either can be empty) · **`numberRangeSlider`** (same value shape, but a two-thumb `Slider`
— bounds via **`min`**/**`max`**/**`step`**; a thumb at an extent maps back to an open (`null`) bound so a
full-range slider is inactive) · **`select`** · **`multiSelect`** (∈) · **`boolean`** (a `RadioGroup` —
Any/Yes/No → off/`true`/`false`; relabel via **`booleanLabels`** `{ any, yes, no }`) · **`date`** (same
day) · **`dateRange`** · **`time`** (same `HH:mm`) · **`timeRange`** · **`dateTime`** (same minute) ·
**`dateTimeRange`** — the temporal types compare ISO substrings at their precision (day / `HH:mm` /
minute), both bounds sliced the same so lexical compare works; `date`/`dateRange` use `DatePicker`, `time`
/`timeRange` `TimePicker`, `dateTime`/`dateTimeRange` `DateTimePicker` (ranges = a From/To pair).
`select`/`multiSelect` take `options` (`SelectOption[]`). **Local mode** filters `data` client-side (the pure **`applyFilters`** — AND across set
filters — pre-filters before TanStack search/sort/paginate); **server mode** emits the active values as
**`state.filters`** in `onChange` **and folds them into `state.query`** (via the pure **`buildFilterQuery`**,
config-driven): each filter uses its **`queryKey` ?? `key`**; a scalar emits `param=value`, a `multiSelect`
emits repeated params or a CSV (**`multiSelectFormat`**), and a range emits `<param><rangeMinSuffix>` /
`<param><rangeMaxSuffix>` (defaults `Min`/`Max`; set `_gte`/`_lte`, `[gte]`/`[lte]`, … per your API). So a
server fetch appends `state.query` as before, filters included. Applying/clearing resets to page 1; initial
values via **`defaultFilters`**; each active filter also mirrors to the URL under its `key` (see URL sync).
The panel is the internal `TableFilters`; the model + matcher + query builders live in `tableFilter.ts`.
_Per-column filters, an operator picker (contains vs equals), controlled filters + async filter options, and
active-filter chips are natural next iterations._ Because the component is
**generic** (`Table<T>`) it uses the standard `forwardRef(...) as <T>(props) => ReactElement` cast (the one
sanctioned deviation from the plain `forwardRef` anatomy — generics don't survive `forwardRef`'s typing).
**Responsive:** cells are `white-space: nowrap` and the surface (`.scroll`) is `overflow-x: auto` with
`min-width: 0` (+ the root's `max-width: 100%`), so when the columns exceed the width the **table scrolls
horizontally inside its container** instead of squeezing/wrapping or widening the page (the flex-parent
overflow guard). a11y: a real `<table>`/`<thead>`/`<tbody>`, `scope="col"` + `aria-sort` on sortable
headers, the search box `aria-label`led, the `Loader` `role="status"`. **Note:** the tests run in jsdom
(TanStack needs no DOM measurement) — they cover render / columns / custom cell, local search (debounced) /
sort / pagination, the pinned-column class, the empty-cell "—" placeholder, server-mode `onChange` (+ the
`queryMapping`-built `query`), the toolbar sort menu, empty + loading, URL sync (mirrors `state.query`:
page/size canonicalize + read + write + opt-out — incl. the clean URL on "All" — and search/sort/filters
read + write), the query builders (`buildTableQuery` / `parseTableQuery` round-trip), the **export** menu (a
the baked `onExportToEmail` item firing with the state), the **filters** (`applyFilters` per type; the Filters panel filtering local data on Apply +
emitting `state.filters` in server mode; the server-query + URL round-trip via
`buildFilterQuery` / `parseFilterQuery`), controlled mode (page / sort / search / filters), and
`onRowClick`. Own CSS module. _Row selection (checkboxes), per-column filters, filter operator pickers,
async filter options, column resize/pinning,
and virtualization are natural next iterations._
