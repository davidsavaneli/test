import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ForwardedRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type Updater,
} from '@tanstack/react-table'
import { usePageQueryKey, useSizeQueryKey, useSearchQueryKey, useSortQueryKey } from '../../theme'
import { Badge } from '../Badge'
import { Divider } from '../Divider'
import { Dropdown } from '../Dropdown'
import { EmptyState } from '../EmptyState'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { ListItem } from '../List'
import { Loader } from '../Loader'
import { Pagination } from '../Pagination'
import { Select } from '../Select'
import { TextField } from '../TextField'
import { Typography } from '../Typography'
import styles from './Table.module.css'

export type TableAlign = 'left' | 'center' | 'right'
export type TableSortDirection = 'asc' | 'desc'

/** Sentinel page size for the "All" rows-per-page choice — larger than any real dataset, so everything
 *  lands on a single page. Emitted verbatim in `onChange` (server consumers should treat it as unbounded). */
const ALL_ROWS = Number.MAX_SAFE_INTEGER

/** Default max width for a `wrap` column with no explicit `maxWidth` — a readable text width, so `wrap`
 *  alone caps + wraps without the consumer having to pick a number. */
const DEFAULT_WRAP_MAX_WIDTH = 280

/** A single column definition — the simple, engine-agnostic shape a consumer writes. */
export interface TableColumn<T> {
  /** Field key on the row — the column id, the default cell accessor, and the local sort/search key. */
  key: string
  /** Header content. */
  header: ReactNode
  /** Custom cell renderer. Defaults to the row's `key` value stringified. */
  cell?: (row: T, index: number) => ReactNode
  /** Enable sorting on this column (click the header to toggle asc → desc → none). Defaults to `false`. */
  sortable?: boolean
  /** Fixed column width — a px `number` or any CSS width string. Opts the column out of the default cap. */
  width?: number | string
  /**
   * Cap the column's width (px `number` or CSS string) — long content **wraps** within it onto 2+ lines
   * (the row grows) instead of stretching the table. **Implies `wrap`.** Only needed to override the
   * default wrap cap (`280px`); otherwise plain `wrap` is enough.
   */
  maxWidth?: number | string
  /**
   * Let this column's content **wrap** onto multiple lines (rows grow) instead of the single-line default —
   * a long unbroken token breaks too. On its own it caps the column at a readable **`280px`** (set
   * `maxWidth` for a different cap). Cells are single-line by default (the table scrolls horizontally); opt
   * a long-text column (name / note / address) in with `wrap`.
   */
  wrap?: boolean
  /** Cell + header text alignment. Defaults to `left`. */
  align?: TableAlign
  /**
   * Pin the column to an edge so it stays visible while the rest scrolls horizontally (e.g. an actions
   * column pinned `'right'`). One column per edge; a hairline separates it from the scrolling body. A
   * pinned column with **no `width`** shrinks to its content (so an actions column fits its buttons); set
   * `width` to override.
   */
  pinned?: 'left' | 'right'
}

/** The current sort — the column `key` + direction, or `null` when unsorted. */
export interface TableSortState {
  key: string
  direction: TableSortDirection
}

/** The table's live state, emitted on every change — the server-mode fetch driver. */
export interface TableChangeState {
  /** 1-based page number. */
  page: number
  /** Rows per page. */
  size: number
  /** Current search query. */
  search: string
  /** Active sort, or `null`. */
  sort: TableSortState | null
}

export interface TableProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'title'> {
  /** Column definitions — keep them simple: a `key` + `header`, plus an optional `cell` renderer. */
  columns: TableColumn<T>[]
  /**
   * Row data. **Local mode** (default): the full dataset — the table searches / sorts / paginates it
   * client-side. **Server mode** (`manualPagination`): only the current page's rows — you fetch them in
   * `onChange` and pass `rowCount` for the total.
   */
  data: T[]
  /** Stable row id from a row (for React keys + selection). Defaults to the row index. */
  getRowId?: (row: T, index: number) => string
  /** Optional heading shown at the top-left of the toolbar. */
  title?: ReactNode
  /** Extra toolbar content (e.g. future filter controls), rendered left of the search box. */
  toolbar?: ReactNode
  /** Show the search box in the toolbar. Defaults to `false`. */
  searchable?: boolean
  /** Placeholder for the search box. Defaults to `"Search…"`. */
  searchPlaceholder?: string
  /** Initial search query. */
  defaultSearch?: string
  /** Debounce (ms) before a typed search commits (local filter + `onChange`). Defaults to `300`. */
  debounceMs?: number
  /** Initial page (1-based). Defaults to `1` (overridden by the URL param when `urlSync`). */
  defaultPage?: number
  /** Initial rows per page. Defaults to `10` (overridden by the URL param when `urlSync`). */
  defaultPageSize?: number
  /** Rows-per-page choices in the footer `Select`. Defaults to `[10, 20, 50, 100, 200]`. */
  pageSizeOptions?: number[]
  /**
   * Add an **"All"** rows-per-page choice that puts every row on one page. Defaults to `true` — pass
   * `false` to hide it (e.g. for a large server dataset where fetching everything is undesirable).
   */
  allowAllRows?: boolean
  /** Show the rows-per-page `Select` in the footer. Defaults to `true`. */
  showPageSize?: boolean
  /** Show the jump-to-first-page (⏮) button in the pagination. Defaults to `false`. */
  showFirstButton?: boolean
  /** Show the jump-to-last-page (⏭) button in the pagination. Defaults to `false`. */
  showLastButton?: boolean
  /**
   * **Server mode** — the table doesn't slice / sort / filter the `data` itself; it just tracks state and
   * fires `onChange`. Pass the current page in `data` + the total in `rowCount`. Defaults to `false`.
   */
  manualPagination?: boolean
  /** Total row count across all pages — **required in server mode** to compute the page count. */
  rowCount?: number
  /** Initial sort. */
  defaultSort?: TableSortState | null
  /**
   * Fires with the full `{ page, size, search, sort }` state on mount and whenever it changes — wire this
   * to your fetch in server mode. Search changes are debounced (`debounceMs`).
   */
  onChange?: (state: TableChangeState) => void
  /** Called when a body row is clicked (makes rows interactive). */
  onRowClick?: (row: T, index: number) => void
  /**
   * Per-row actions — return the action UI (your own `IconButton`s / menu / etc.) for a row and the table
   * renders it in a **pinned-right actions column** it adds for you (no column boilerplate). The cell is
   * `stopPropagation`-wrapped, so clicks inside it never fire the row's `onClick` — you don't handle that.
   */
  actions?: (row: T, index: number) => ReactNode
  /** Show a loading overlay over the table (e.g. while fetching a server page). Defaults to `false`. */
  loading?: boolean
  /** Custom content for the empty state (replaces the default `EmptyState`). */
  empty?: ReactNode
  /** Sync page + rows-per-page + search + sort to the URL query (`?page=1&size=10&search=…&sort=…`). Defaults to `true`. */
  urlSync?: boolean
  /** URL query key for the page. `null` opts out of syncing the page; omit for the configured default. */
  pageQueryKey?: string | null
  /** URL query key for the rows-per-page. `null` opts out; omit for the configured default. */
  sizeQueryKey?: string | null
  /** URL query key for the search query (`?search=…`). `null` opts out; omit for the configured default. */
  searchQueryKey?: string | null
  /** URL query key for the sort (`?sort=key` asc / `?sort=-key` desc). `null` opts out; omit for the default. */
  sortQueryKey?: string | null
  /** Pin the header row while the body scrolls. Defaults to `false`. */
  stickyHeader?: boolean
  /** Zebra-stripe alternate rows. Defaults to `false`. */
  striped?: boolean
  /** Highlight rows on hover. Defaults to `true`. */
  hoverable?: boolean
}

/** Resolve a TanStack `Updater` (a value or an `(old) => next` function) against the current value. */
function resolveUpdater<S>(updater: Updater<S>, old: S): S {
  return typeof updater === 'function' ? (updater as (o: S) => S)(old) : updater
}

/**
 * A wrap column's width cap — its own `maxWidth`, else the readable default when it just sets `wrap`, else
 * none. Used as BOTH the preferred `width` and the `max-width` so the column sits at that width and its
 * content wraps within it (without a preferred width, `overflow-wrap` would starve it to near-zero as the
 * unbounded single-line columns grab the table's spare width).
 */
function wrapCap<T>(col: TableColumn<T>): number | string | undefined {
  return col.maxWidth ?? (col.wrap ? DEFAULT_WRAP_MAX_WIDTH : undefined)
}

/** Stringify a primitive cell value; complex values should use a column `cell` renderer. */
function formatCell(value: unknown): ReactNode {
  if (value == null) return ''
  if (typeof value === 'object') return ''
  return String(value)
}

/**
 * Wrap a cell's rendered content: a blank cell (`null` / `undefined` / `''` / `false`, from an empty value
 * or a `cell` renderer that returned nothing) shows a muted "—" placeholder so it reads as "no value" rather
 * than a rendering glitch. A `0` / `'0'` is a real value and stays as-is (not treated as empty).
 */
function renderCellContent(content: ReactNode): ReactNode {
  if (content == null || content === '' || content === false) {
    return (
      <span className={styles.empty} aria-hidden>
        —
      </span>
    )
  }
  return content
}

/** The rows-per-page URL param → a page size: `'all'` → the sentinel, a valid option → itself, else the fallback. */
function parseUrlSize(
  raw: string | null,
  options: number[],
  allowAll: boolean,
  fallback: number,
): number {
  if (raw === 'all') return allowAll ? ALL_ROWS : fallback
  const n = Number(raw)
  return Number.isFinite(n) && options.includes(n) ? n : fallback
}

/** A page size → its URL param: the "All" sentinel serializes as `'all'`, else the plain number. */
function sizeToParam(size: number): string {
  return size >= ALL_ROWS ? 'all' : String(size)
}

/** A sort → its URL param: `key` ascending, `-key` descending; `null` → `''` (removed from the query). */
function sortToParam(sort: SortingState[number] | undefined): string {
  return sort ? (sort.desc ? `-${sort.id}` : sort.id) : ''
}

/** The sort URL param → TanStack sorting state: a leading `-` means descending (`-price` → desc by price). */
function parseSortParam(raw: string | null): SortingState {
  if (!raw) return []
  const desc = raw.startsWith('-')
  const id = desc ? raw.slice(1) : raw
  return id ? [{ id, desc }] : []
}

/** Read a single URL query param (null when the key is disabled or off-DOM). */
function readUrlParam(key: string | undefined): string | null {
  if (!key || typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(key)
}

/**
 * A data table built on **TanStack Table** (headless — an optional peer, `external`) styled entirely with
 * `--tz-*` tokens. Pass `columns` + `data` and it renders a sortable, paginated, searchable table. Works
 * two ways: **local** (hand it the full `data` — it searches / sorts / paginates client-side) or **server**
 * (`manualPagination` — pass the current page in `data` + the total in `rowCount`, and fetch in `onChange`).
 * Composes the library's `TextField` (search), `Select` (rows per page), `Pagination`, `EmptyState`, and
 * `Loader`; syncs page + size to the URL (`?page=1&size=10`) by default. The ref points at the root.
 *
 * @example
 * <Table data={users} columns={[
 *   { key: 'name', header: 'Name', sortable: true },
 *   { key: 'role', header: 'Role', cell: (u) => <Chip>{u.role}</Chip> },
 * ]} searchable />
 */
export const Table = forwardRef(function Table<T>(
  {
    columns,
    data,
    getRowId,
    title,
    toolbar,
    searchable = false,
    searchPlaceholder = 'Search…',
    defaultSearch = '',
    debounceMs = 300,
    defaultPage = 1,
    defaultPageSize = 10,
    pageSizeOptions = [10, 20, 50, 100, 200],
    allowAllRows = true,
    showPageSize = true,
    showFirstButton = false,
    showLastButton = false,
    manualPagination = false,
    rowCount,
    defaultSort = null,
    onChange,
    onRowClick,
    actions,
    loading = false,
    empty,
    urlSync = true,
    pageQueryKey,
    sizeQueryKey,
    searchQueryKey,
    sortQueryKey,
    stickyHeader = false,
    striped = false,
    hoverable = true,
    className,
    ...props
  }: TableProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  // resolve the URL-sync keys: syncing off, or a `null` per-param, opts that param out
  const configPageKey = usePageQueryKey()
  const configSizeKey = useSizeQueryKey()
  const configSearchKey = useSearchQueryKey()
  const configSortKey = useSortQueryKey()
  const pageKey = urlSync && pageQueryKey !== null ? (pageQueryKey ?? configPageKey) : undefined
  const sizeKey = urlSync && sizeQueryKey !== null ? (sizeQueryKey ?? configSizeKey) : undefined
  const searchKey =
    urlSync && searchQueryKey !== null ? (searchQueryKey ?? configSearchKey) : undefined
  const sortKey = urlSync && sortQueryKey !== null ? (sortQueryKey ?? configSortKey) : undefined

  // keep the latest options + onChange for the stable effects / popstate listener (avoids re-subscribing)
  const optionsRef = useRef(pageSizeOptions)
  optionsRef.current = pageSizeOptions
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // horizontal-scroll state → a soft shadow on a pinned column's inner edge when content is hidden under
  // it (so it reads as "content scrolls under here", not a hard cut)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const tableRef = useRef<HTMLTableElement | null>(null)
  const [pinShadow, setPinShadow] = useState({ start: false, end: false })

  const [pagination, setPagination] = useState<PaginationState>(() => {
    const params =
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : undefined
    const urlPage = pageKey && params ? Number(params.get(pageKey)) : NaN
    const pageSize = parseUrlSize(
      sizeKey && params ? params.get(sizeKey) : null,
      pageSizeOptions,
      allowAllRows,
      defaultPageSize,
    )
    const page = Number.isInteger(urlPage) && urlPage > 0 ? urlPage : defaultPage
    return { pageIndex: page - 1, pageSize }
  })
  // `searchInput` is the immediate input value; `globalFilter` is the committed (debounced) query — both
  // seed from the URL (`?search=`) when synced, else `defaultSearch`
  const [searchInput, setSearchInput] = useState(() => readUrlParam(searchKey) ?? defaultSearch)
  const [globalFilter, setGlobalFilter] = useState(() => readUrlParam(searchKey) ?? defaultSearch)
  const [sorting, setSorting] = useState<SortingState>(() => {
    const fromUrl = parseSortParam(readUrlParam(sortKey)) // `?sort=` wins over `defaultSort`
    if (fromUrl.length) return fromUrl
    return defaultSort ? [{ id: defaultSort.key, desc: defaultSort.direction === 'desc' }] : []
  })

  const manual = manualPagination

  const tanstackColumns = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((col) => ({
        id: col.key,
        accessorFn: (row: T) => (row as Record<string, unknown>)[col.key],
        enableSorting: !!col.sortable,
      })),
    [columns],
  )

  // rows-per-page choices + an optional trailing "All"
  const pageSizeChoices = useMemo(() => {
    const opts = pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))
    return allowAllRows ? [...opts, { value: 'all', label: 'All' }] : opts
  }, [pageSizeOptions, allowAllRows])

  // the columns actually rendered — the consumer's, plus an auto-built pinned-right actions column when
  // `actions` is given (display-only, so it stays out of `tanstackColumns` / sort / filter)
  const renderColumns = useMemo<TableColumn<T>[]>(() => {
    if (!actions) return columns
    const actionsColumn: TableColumn<T> = {
      key: '__actions',
      header: '',
      align: 'right',
      pinned: 'right',
      // render the consumer's action UI right-aligned; the wrapper swallows clicks so they never reach
      // the row's `onClick` — the consumer's own handlers don't need to `stopPropagation`
      cell: (row, index) => (
        <div className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
          {actions(row, index)}
        </div>
      ),
    }
    return [...columns, actionsColumn]
  }, [columns, actions])

  // sorting resets to the first page (the sorted order changes what "page 1" means)
  const handleSortingChange = useCallback((updater: Updater<SortingState>) => {
    setSorting((old) => resolveUpdater(updater, old))
    setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }))
  }, [])

  // the sortable columns drive the toolbar sort menu — each lists an explicit ascending + descending entry
  const sortableColumns = useMemo(() => columns.filter((c) => c.sortable), [columns])
  const setSort = useCallback(
    (key: string, desc: boolean) =>
      handleSortingChange((prev) => {
        const cur = prev[0]
        // clicking the already-active entry clears the sort; otherwise apply exactly this key + direction
        return cur && cur.id === key && cur.desc === desc ? [] : [{ id: key, desc }]
      }),
    [handleSortingChange],
  )

  const table = useReactTable<T>({
    data,
    columns: tanstackColumns,
    state: { pagination, globalFilter, sorting },
    onPaginationChange: (updater) => setPagination((old) => resolveUpdater(updater, old)),
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: handleSortingChange,
    globalFilterFn: 'includesString',
    // first click always sorts ascending (A→Z / 0→9), for every column type — the intuitive default
    sortDescFirst: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    manualPagination: manual,
    manualFiltering: manual,
    manualSorting: manual,
    ...(manual
      ? { rowCount: rowCount ?? data.length }
      : {
          getPaginationRowModel: getPaginationRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          getSortedRowModel: getSortedRowModel(),
        }),
  })

  const rows = table.getRowModel().rows
  const totalRows = manual ? (rowCount ?? data.length) : table.getFilteredRowModel().rows.length
  const pageCount = Math.max(1, Math.ceil(totalRows / pagination.pageSize))
  const currentPage = pagination.pageIndex + 1
  const rangeStart = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const rangeEnd = manual
    ? Math.min(totalRows, pagination.pageIndex * pagination.pageSize + rows.length)
    : Math.min(totalRows, currentPage * pagination.pageSize)

  // debounce a typed search into the committed filter, resetting to the first page when it actually changes
  useEffect(() => {
    if (searchInput === globalFilter) return
    const handle = setTimeout(() => {
      setGlobalFilter(searchInput)
      setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }))
    }, debounceMs)
    return () => clearTimeout(handle)
  }, [searchInput, globalFilter, debounceMs])

  // clamp the page if the row count shrank beneath it (e.g. a local search filtered rows away)
  useEffect(() => {
    if (pagination.pageIndex > 0 && pagination.pageIndex >= pageCount) {
      setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }))
    }
  }, [pageCount, pagination.pageIndex])

  // emit the full state on mount + whenever it changes — the server-mode fetch driver
  const sortState: TableSortState | null = sorting[0]
    ? { key: sorting[0].id, direction: sorting[0].desc ? 'desc' : 'asc' }
    : null
  useEffect(() => {
    onChangeRef.current?.({
      page: pagination.pageIndex + 1,
      size: pagination.pageSize,
      search: globalFilter,
      sort: sortState,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize, globalFilter, sorting])

  // mirror page + size + search + sort into the URL query (replace, so it doesn't spam history);
  // canonicalizes on mount. A key set to `undefined` (opted out) is skipped; an empty value is removed.
  const writeQuery = useCallback(
    (page: number, pageSize: number, search: string, sort: SortingState[number] | undefined) => {
      const anyKey = pageKey || sizeKey || searchKey || sortKey
      if (typeof window === 'undefined' || !anyKey) return
      const params = new URLSearchParams(window.location.search)
      let changed = false
      const set = (key: string | undefined, value: string) => {
        if (!key) return
        if (value) {
          if (params.get(key) !== value) {
            params.set(key, value)
            changed = true
          }
        } else if (params.has(key)) {
          params.delete(key)
          changed = true
        }
      }
      set(pageKey, String(page))
      set(sizeKey, sizeToParam(pageSize))
      set(searchKey, search)
      set(sortKey, sortToParam(sort))
      if (!changed) return
      const query = params.toString()
      const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
      window.history.replaceState(window.history.state, '', url)
    },
    [pageKey, sizeKey, searchKey, sortKey],
  )
  useEffect(() => {
    writeQuery(pagination.pageIndex + 1, pagination.pageSize, globalFilter, sorting[0])
  }, [pagination.pageIndex, pagination.pageSize, globalFilter, sorting, writeQuery])

  // Back/Forward → restore page + size + search + sort from the query
  useEffect(() => {
    if (typeof window === 'undefined' || (!pageKey && !sizeKey && !searchKey && !sortKey)) return
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search)
      const urlPage = pageKey ? Number(params.get(pageKey)) : NaN
      setPagination((p) => ({
        pageIndex: Number.isInteger(urlPage) && urlPage > 0 ? urlPage - 1 : p.pageIndex,
        pageSize: parseUrlSize(
          sizeKey ? params.get(sizeKey) : null,
          optionsRef.current,
          allowAllRows,
          p.pageSize,
        ),
      }))
      if (searchKey) {
        const s = params.get(searchKey) ?? ''
        setSearchInput(s)
        setGlobalFilter(s)
      }
      if (sortKey) setSorting(parseSortParam(params.get(sortKey)))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [pageKey, sizeKey, searchKey, sortKey, allowAllRows])

  // track horizontal scroll so a pinned column shows its shadow only while content is hidden under it
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      const canScroll = el.scrollWidth > el.clientWidth + 1
      const atStart = el.scrollLeft <= 0
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1
      const next = { start: canScroll && !atStart, end: canScroll && !atEnd }
      setPinShadow((s) => (s.start === next.start && s.end === next.end ? s : next))
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    ro?.observe(el)
    if (ro && tableRef.current) ro.observe(tableRef.current)
    return () => {
      el.removeEventListener('scroll', update)
      ro?.disconnect()
    }
  }, [])

  const hasToolbar = title != null || toolbar != null || searchable || sortableColumns.length > 0

  return (
    <div ref={ref} className={clsx(styles.root, className)} {...props}>
      {hasToolbar && (
        <div className={styles.toolbar}>
          {title != null && (
            <Typography variant="h4" as="div" className={styles.title}>
              {title}
            </Typography>
          )}
          <div className={styles.toolbarEnd}>
            {toolbar}
            {searchable && (
              <TextField
                className={styles.search}
                fullWidth={false}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={searchPlaceholder}
                adornment={<Icon name="SearchNormal" />}
                aria-label="Search"
              />
            )}
            {sortableColumns.length > 0 && (
              // sort menu — each sortable column lists an explicit "ascending" + "descending" entry; picking
              // one applies exactly that sort (clicking the active one clears it). The active entry is shown
              // by its `selected` tint alone (no icons); a dot `Badge` on the trigger flags that a sort is on.
              <Dropdown
                placement="bottom-end"
                trigger={
                  <Badge dot={sorting.length > 0} color="primary">
                    <IconButton
                      variant={sorting.length > 0 ? 'filled' : 'outlined'}
                      aria-label="Sort"
                    >
                      <Icon name="Sort" />
                    </IconButton>
                  </Badge>
                }
              >
                <Typography as="div" variant="bodySmall" color="muted" className={styles.sortTitle}>
                  Sort By:
                </Typography>
                <Divider className={styles.sortDivider} />
                {sortableColumns.flatMap((col) =>
                  (['asc', 'desc'] as const).map((direction) => {
                    const active = sortState?.key === col.key && sortState.direction === direction
                    return (
                      <ListItem
                        key={`${col.key}:${direction}`}
                        clickable
                        selected={active}
                        onClick={() => setSort(col.key, direction === 'desc')}
                      >
                        {col.header} {direction === 'asc' ? 'ascending' : 'descending'}
                      </ListItem>
                    )
                  }),
                )}
              </Dropdown>
            )}
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className={styles.scroll}
        data-pin-start={pinShadow.start ? 'true' : 'false'}
        data-pin-end={pinShadow.end ? 'true' : 'false'}
      >
        <table
          ref={tableRef}
          className={clsx(
            styles.table,
            striped && styles.striped,
            hoverable && styles.hoverable,
            stickyHeader && styles.sticky,
          )}
        >
          <thead>
            <tr>
              {renderColumns.map((col) => {
                const column = table.getColumn(col.key)
                const sorted = column?.getIsSorted() || false
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={clsx(
                      styles.th,
                      col.pinned === 'left' && styles.pinnedLeft,
                      col.pinned === 'right' && styles.pinnedRight,
                      (col.wrap || col.maxWidth != null) && styles.wrapCell,
                    )}
                    style={
                      {
                        // a pinned column with no explicit width shrinks to its content (the `width: 1px`
                        // min-content trick); a wrap column sits at its cap (so it doesn't get starved),
                        // others size to content
                        width: col.width ?? (col.pinned ? 1 : wrapCap(col)),
                        maxWidth: wrapCap(col),
                        textAlign: col.align,
                      } as CSSProperties
                    }
                    aria-sort={
                      col.sortable
                        ? sorted === 'asc'
                          ? 'ascending'
                          : sorted === 'desc'
                            ? 'descending'
                            : 'none'
                        : undefined
                    }
                  >
                    {/* sorting lives in the toolbar's sort menu, not the header; `aria-sort` above still
                        reflects the current sort for a11y */}
                    {col.header}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={clsx(styles.tr, onRowClick && styles.clickable)}
                  onClick={onRowClick ? () => onRowClick(row.original, row.index) : undefined}
                >
                  {renderColumns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx(
                        styles.td,
                        col.pinned === 'left' && styles.pinnedLeft,
                        col.pinned === 'right' && styles.pinnedRight,
                        (col.wrap || col.maxWidth != null) && styles.wrapCell,
                      )}
                      style={
                        {
                          width: col.width ?? (col.pinned ? 1 : wrapCap(col)),
                          maxWidth: wrapCap(col),
                          textAlign: col.align,
                        } as CSSProperties
                      }
                    >
                      {renderCellContent(
                        col.cell
                          ? col.cell(row.original, row.index)
                          : formatCell(row.getValue(col.key)),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              // no rows → a centered placeholder cell: the loader while fetching (mirrors the empty
              // state's presence), otherwise the empty state
              <tr>
                <td colSpan={Math.max(1, renderColumns.length)} className={styles.stateCell}>
                  {loading ? (
                    <div className={styles.loadingState}>
                      <Loader size="lg" />
                      <Typography variant="bodySmall" color="muted" as="span">
                        Loading…
                      </Typography>
                    </div>
                  ) : (
                    (empty ?? <EmptyState />)
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* while refetching with rows already shown, dim them + spinner; the no-rows case is handled in
            the body above (a centered loader), not this overlay */}
        {loading && rows.length > 0 && (
          <div className={styles.loadingOverlay}>
            <Loader size="lg" />
          </div>
        )}
      </div>

      {totalRows > 0 && (
        <div className={styles.footer}>
          <div className={styles.footerStart}>
            {showPageSize && (
              <div className={styles.pageSize}>
                <Typography variant="bodySmall" color="muted" as="span">
                  Rows per page
                </Typography>
                <Select
                  className={styles.pageSizeSelect}
                  fullWidth={false}
                  clearable={false}
                  showSelectedTick={false}
                  value={pagination.pageSize >= ALL_ROWS ? 'all' : String(pagination.pageSize)}
                  onChange={(value) =>
                    setPagination({
                      pageIndex: 0,
                      pageSize: value === 'all' ? ALL_ROWS : Number(value),
                    })
                  }
                  options={pageSizeChoices}
                />
              </div>
            )}
            <Typography variant="bodySmall" color="muted" as="span" className={styles.rangeText}>
              {rangeStart}–{rangeEnd} of {totalRows}
            </Typography>
          </div>
          {/* the page navigator is pointless with a single page (few rows, or the "All" size) — hide it,
              keeping the rows-per-page select + range count */}
          {pageCount > 1 && (
            <Pagination
              count={pageCount}
              page={currentPage}
              onChange={(page) => setPagination((p) => ({ ...p, pageIndex: page - 1 }))}
              showFirstButton={showFirstButton}
              showLastButton={showLastButton}
              disabled={loading}
            />
          )}
        </div>
      )}
    </div>
  )
}) as <T>(props: TableProps<T> & { ref?: ForwardedRef<HTMLDivElement> }) => ReactElement
