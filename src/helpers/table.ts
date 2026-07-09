// Framework-agnostic query builder for the `<Table>` server-request mapping. `<Table>` calls this
// internally (with `config.table.query` merged with its `queryMapping` prop) and emits the result as
// `params` / `query` in `onChange`; it's exported too so a consumer can build the same query outside a
// table (e.g. a prefetch). Pure — no React, no DOM beyond the standard `URLSearchParams`.
import type { TableQueryConfig } from '../theme'

/** The `<Table>` state a server request is built from — a structural subset of `TableChangeState`. */
export interface TableQueryState {
  /** 1-based page number. */
  page: number
  /** Rows per page (the "All" choice is a sentinel larger than any real dataset). */
  size: number
  /** Current search query (empty string when none). */
  search: string
  /** Active sort, or `null`. */
  sort: { key: string; direction: 'asc' | 'desc' } | null
}

/** Resolved defaults for the page/size/search/sort fields (filter fields are handled by `buildFilterQuery`). */
const DEFAULTS: Required<
  Omit<TableQueryConfig, 'allValue' | 'multiSelectFormat' | 'rangeMinSuffix' | 'rangeMaxSuffix'>
> = {
  pageParam: 'page',
  sizeParam: 'size',
  searchParam: 'search',
  sortParam: 'sort',
  pagination: 'page',
  sortFormat: 'field',
  sortOrderParam: 'order',
  ascValue: 'asc',
  descValue: 'desc',
}

/**
 * Build the server-request params for a table's `{ page, size, search, sort }` state, applying a
 * `TableQueryConfig` mapping (defaults reproduce `?page=1&size=10&search=…&sort=-key`):
 * - **pagination** — `'page'` emits the 1-based page; `'offset'` emits `(page - 1) * size` under the
 *   `pageParam` name (e.g. `skip`).
 * - **size** — the page size. When the **"All"** sentinel is active there's no meaningful page, so the
 *   **page/offset param is dropped entirely** and only the size param is emitted — and only when
 *   `allValue` is set (e.g. `limit=0` = all); with no `allValue`, "All" emits no page and no size.
 * - **search** — omitted when empty.
 * - **sort** — `'field'` emits a single `-`-prefixed param (`sort=-price`); `'separate'` emits the key in
 *   `sortParam` + the direction (`ascValue`/`descValue`) in `sortOrderParam` (`sortBy=price&order=desc`);
 *   `'suffix'` appends the direction value to the key in one param (`sort=priceAsc` / `sort=priceDesc`).
 */
export function buildTableQuery(
  state: TableQueryState,
  mapping: TableQueryConfig = {},
): URLSearchParams {
  const m = { ...DEFAULTS, ...mapping }
  const params = new URLSearchParams()
  // the "All" rows-per-page choice is a sentinel size larger than any real dataset (see Table's ALL_ROWS)
  const isAll = state.size >= Number.MAX_SAFE_INTEGER

  if (isAll) {
    // "All" = everything on one page → there's no meaningful page/offset, so the page param is dropped
    // entirely; only the size param is emitted, and only when `allValue` is set (e.g. `limit=0` = all).
    if (mapping.allValue !== undefined) params.set(m.sizeParam, String(mapping.allValue))
  } else {
    // pagination — a page number, or a zero-based offset for skip/offset APIs
    if (m.pagination === 'offset') {
      params.set(m.pageParam, String((state.page - 1) * state.size))
    } else {
      params.set(m.pageParam, String(state.page))
    }
    params.set(m.sizeParam, String(state.size))
  }

  // search — only when present
  if (state.search) params.set(m.searchParam, state.search)

  // sort — a `-`-prefixed field, a separate key + direction pair, or the direction appended to the key
  if (state.sort) {
    const dirValue = state.sort.direction === 'desc' ? m.descValue : m.ascValue
    if (m.sortFormat === 'separate') {
      params.set(m.sortParam, state.sort.key)
      params.set(m.sortOrderParam, dirValue)
    } else if (m.sortFormat === 'suffix') {
      params.set(m.sortParam, state.sort.key + dirValue) // e.g. priceAsc / priceDesc
    } else {
      params.set(m.sortParam, (state.sort.direction === 'desc' ? '-' : '') + state.sort.key)
    }
  }

  return params
}

/**
 * Read a `{ page, size, search, sort }` state back out of URL / request params — the **inverse of
 * `buildTableQuery`** for the same `mapping`. `page` / `size` are `null` when absent (the caller falls back
 * to its defaults). Used by `<Table>` to restore its URL-synced state on mount / Back-Forward, so the
 * address bar and the request share one shape.
 */
export function parseTableQuery(
  params: URLSearchParams,
  mapping: TableQueryConfig = {},
): { page: number | null; size: number | null; search: string; sort: TableQueryState['sort'] } {
  const m = { ...DEFAULTS, ...mapping }

  // size first — an offset-based page needs it to convert back to a 1-based page
  let size: number | null = null
  const rawSize = params.get(m.sizeParam)
  if (rawSize != null) {
    if (mapping.allValue !== undefined && rawSize === String(mapping.allValue)) {
      size = Number.MAX_SAFE_INTEGER // the "All" sentinel
    } else {
      const n = Number(rawSize)
      if (Number.isFinite(n)) size = n
    }
  }

  // page — a 1-based page, or converted from a zero-based offset (`page = floor(offset / size) + 1`)
  let page: number | null = null
  const rawPage = params.get(m.pageParam)
  if (rawPage != null) {
    const n = Number(rawPage)
    if (Number.isFinite(n)) page = m.pagination === 'offset' ? Math.floor(n / (size || 1)) + 1 : n
  }

  const search = params.get(m.searchParam) ?? ''

  // sort — inverse of the three sort formats
  let sort: TableQueryState['sort'] = null
  const rawSort = params.get(m.sortParam)
  if (m.sortFormat === 'separate') {
    if (rawSort)
      sort = {
        key: rawSort,
        direction: params.get(m.sortOrderParam) === m.descValue ? 'desc' : 'asc',
      }
  } else if (m.sortFormat === 'suffix') {
    if (rawSort) {
      if (rawSort.endsWith(m.descValue))
        sort = { key: rawSort.slice(0, -m.descValue.length), direction: 'desc' }
      else if (rawSort.endsWith(m.ascValue))
        sort = { key: rawSort.slice(0, -m.ascValue.length), direction: 'asc' }
      else sort = { key: rawSort, direction: 'asc' }
    }
  } else if (rawSort) {
    sort = rawSort.startsWith('-')
      ? { key: rawSort.slice(1), direction: 'desc' }
      : { key: rawSort, direction: 'asc' }
  }

  return { page, size, search, sort }
}
