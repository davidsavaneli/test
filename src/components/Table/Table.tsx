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
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type ClientRect,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS, type Transform } from '@dnd-kit/utilities'
import { useTableQueryConfig, type TableQueryConfig } from '../../theme'
import { buildTableQuery, parseTableQuery } from '../../helpers/table'
import {
  applyFilters,
  buildFilterQuery,
  parseFilterQuery,
  type TableFilter,
  type TableFilterState,
} from './tableFilter'
import { TableFilters } from './TableFilters'
import { Badge } from '../Badge'
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

// Stripped from production builds: `process.env.NODE_ENV` is inlined by every consumer bundler (React's own
// convention). Declared locally since the library ships without `@types/node`.
declare const process: { env: { NODE_ENV?: string } } | undefined

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

/** Details of a single row-reorder drag, passed to `onReorder` alongside the reordered rows. */
export interface TableReorderMeta {
  /** The stable row id (from `getRowId`) of the dragged row. */
  id: string
  /** The dragged row's original index in `data`. */
  from: number
  /** The index the row was dropped at (its new position in the reordered array). */
  to: number
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
  /** Active filter values, keyed by filter `key` (empty when none set). */
  filters: TableFilterState
  /**
   * The **built server-request params** for this state, from the query mapping (`config.table.query`
   * merged with the `queryMapping` prop) — ready to append to your endpoint, so you don't hand-map
   * page/size/search/sort. E.g. `fetch(`/products?${state.query}`)`.
   */
  params: URLSearchParams
  /** `params.toString()` — e.g. `"skip=0&limit=10&q=phone&sortBy=price&order=desc"`. */
  query: string
}

/** Props shared by both table modes (everything except the mode-specific `manualPagination` / `rowCount`). */
interface TableBaseProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'title'> {
  /** Column definitions — keep them simple: a `key` + `header`, plus an optional `cell` renderer. */
  columns: TableColumn<T>[]
  /**
   * Row data. **Local mode** (default): the full dataset — the table searches / sorts / paginates it
   * client-side. **Server mode** (`manualPagination`): only the current page's rows — you fetch them in
   * `onChange` and pass `rowCount` for the total.
   */
  data: T[]
  /**
   * Stable row id from a row — used as the React key, so a row keeps its DOM identity (and any focus /
   * in-cell state) across sort / filter / refetch. Defaults to the row **index**, which is fine for static
   * data but reuses DOM by position when rows reorder or a server page swaps in — pass a real id (e.g.
   * `(row) => row.id`) for any table with row interactions or changing data.
   */
  getRowId?: (row: T, index: number) => string
  /** Optional heading shown at the top-left of the toolbar. */
  title?: ReactNode
  /** Extra toolbar content (e.g. future filter controls), rendered in the right group before sort/export. */
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
  /** Initial sort. */
  defaultSort?: TableSortState | null
  /**
   * Fires with the full `{ page, size, search, sort, params, query }` state on mount and whenever it
   * changes — wire this to your fetch in server mode (append `state.query` to your endpoint). Search
   * changes are debounced (`debounceMs`).
   */
  onChange?: (state: TableChangeState) => void
  /**
   * Per-table override for how `state.params` / `state.query` are built (param names, `page` vs `offset`
   * pagination, sort format) — merged over the app-wide `config.table.query`. Use it when one table hits a
   * differently-shaped endpoint (e.g. `{ pageParam: 'skip', sizeParam: 'limit', searchParam: 'q', pagination: 'offset' }`).
   */
  queryMapping?: TableQueryConfig
  /**
   * Handler for the toolbar **export** menu's built-in **"Send On Email"** item (label + icon are baked in).
   * Set it to show the export `Dropdown`; on click it fires with the current `TableChangeState` (incl.
   * `query`), so you just wire your endpoint — e.g. `onExportToEmail={(s) => exportCustomers(s.query)}`. Omit it
   * to hide the export menu.
   */
  onExportToEmail?: (state: TableChangeState) => void
  /**
   * Declarative filters — each renders a field in a toolbar **Filters** panel (a `Modal`). In **local**
   * mode the table filters `data` client-side; in **server** mode the active values ride in `onChange`
   * (`state.filters`). Core types: `text` / `number` / `numberRange` / `select` / `multiSelect` /
   * `boolean` / `date` / `dateRange` (`select` / `multiSelect` take `options`).
   */
  filters?: TableFilter[]
  /** Initial filter values, keyed by filter `key`. */
  defaultFilters?: TableFilterState
  /** Called when a body row is clicked (makes rows interactive). */
  onRowClick?: (row: T, index: number) => void
  /**
   * Per-row actions — return the action UI (your own `IconButton`s / menu / etc.) for a row and the table
   * renders it in a **pinned-right actions column** it adds for you (no column boilerplate). The cell is
   * `stopPropagation`-wrapped, so clicks inside it never fire the row's `onClick` — you don't handle that.
   */
  actions?: (row: T, index: number) => ReactNode
  /**
   * Enable **row drag-and-drop reordering** — a leading **drag-handle** column (a grip icon) is prepended,
   * and dragging it (or keyboard: focus the handle → Space → Arrows → Space) reorders the rows, firing
   * **`onReorder`**. **Local mode only**, and best with no active sort (a sort fights a manual order);
   * **requires `getRowId`** (dnd needs stable row ids). Built on `@dnd-kit`. Defaults to `false`.
   */
  reorderable?: boolean
  /**
   * Fired after a drag reorder with the **full `data` reordered** — you own `data`, so set it from this
   * (e.g. `onReorder={setRows}`). A second **`meta`** arg carries the drag details (`{ id, from, to }` —
   * the dragged row's id + its old/new index). Only fires while `reorderable`.
   */
  onReorder?: (rows: T[], meta: TableReorderMeta) => void
  /** Show a loading overlay over the table (e.g. while fetching a server page). Defaults to `false`. */
  loading?: boolean
  /** Custom content for the empty state (replaces the default `EmptyState`). */
  empty?: ReactNode
  /**
   * Mirror page + rows-per-page + search + sort + filters to the URL query, using the **same shape as the
   * server request** (`config.table.query` merged with `queryMapping`) — so the address bar matches
   * `state.query` exactly (e.g. `?page=1&size=10&sortBy=rating&orderBy=desc`). Read back on mount + restored
   * on Back/Forward. Defaults to `true`; pass `false` to opt out entirely. (Two synced tables on one page
   * need distinct param names via their `queryMapping`, since both write the same params otherwise.)
   */
  urlSync?: boolean
  // ── Controlled state ─────────────────────────────────────────────────────────
  // Each pairs with its `default*` counterpart: pass the controlled prop (with its `on*Change`) to own the
  // state from outside; omit it to let the table manage that piece internally (seeded from `default*`). Mix
  // freely — e.g. control only `filterValues` while page/sort stay uncontrolled. Pass **stable** values.
  /** Controlled 1-based page (pair with `onPageChange`); omit for uncontrolled (`defaultPage`). */
  page?: number
  /** Fired with the new 1-based page — on user paging, or a reset to page 1 from a size/sort/search/filter change. */
  onPageChange?: (page: number) => void
  /** Controlled rows-per-page (pair with `onPageSizeChange`); omit for uncontrolled (`defaultPageSize`). */
  pageSize?: number
  /** Fired with the new rows-per-page. */
  onPageSizeChange?: (size: number) => void
  /** Controlled (committed, debounced) search query (pair with `onSearchChange`); omit for uncontrolled (`defaultSearch`). */
  search?: string
  /** Fired with the committed (debounced) search query. */
  onSearchChange?: (search: string) => void
  /** Controlled sort, or `null` (pair with `onSortChange`); omit for uncontrolled (`defaultSort`). */
  sort?: TableSortState | null
  /** Fired with the new sort (or `null` when cleared). */
  onSortChange?: (sort: TableSortState | null) => void
  /** Controlled filter values, keyed by filter `key` (pair with `onFiltersChange`); omit for uncontrolled (`defaultFilters`). */
  filterValues?: TableFilterState
  /** Fired with the filter values on Apply / Clear. */
  onFiltersChange?: (filters: TableFilterState) => void
  /** Pin the header row while the body scrolls. Defaults to `false`. */
  stickyHeader?: boolean
  /** Zebra-stripe alternate rows. Defaults to `false`. */
  striped?: boolean
  /** Highlight rows on hover. Defaults to `true`. */
  hoverable?: boolean
}

/**
 * `Table` props. A discriminated union on `manualPagination` so the type enforces the server-mode contract:
 * **local mode** (default) needs no `rowCount`; **server mode** (`manualPagination`) **requires** it (the
 * table can't derive the total page count from a single fetched page).
 */
export type TableProps<T> =
  | (TableBaseProps<T> & {
      /** Local mode (default) — the table slices / sorts / filters `data` itself. */
      manualPagination?: false
      /** Ignored in local mode (the table knows the full count from `data`). */
      rowCount?: number
    })
  | (TableBaseProps<T> & {
      /**
       * **Server mode** — the table doesn't slice / sort / filter `data`; it tracks state and fires
       * `onChange`. Pass the current page's rows in `data` and the total in `rowCount`.
       */
      manualPagination: true
      /** Total row count across all pages — **required** in server mode to compute the page count. */
      rowCount: number
    })

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

/**
 * `URLSearchParams.toString()`, but with the commonly-unencoded chars `,` `:` `[` `]` left raw — all read
 * cleanly in a query and are accepted by servers in practice (`brand=a,b`, `created=…T09:00:00`,
 * `cat[0]=a`). Non-ASCII (e.g. Georgian text) stays percent-encoded — that's unavoidable in a URL. This
 * makes `state.query` pretty; `state.params.toString()` stays strictly encoded for consumers who want that.
 */
function prettyQuery(params: URLSearchParams): string {
  return params
    .toString()
    .replace(/%2C/gi, ',')
    .replace(/%3A/gi, ':')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']')
}

/** aria-label for the row drag handle (row reordering). */
const DRAG_HANDLE_LABEL = 'Drag to reorder'

/** Clamp a transform so the dragged node stays within a bounding rect (dnd-kit's `restrictToBoundingRect`). */
function restrictToBoundingRect(
  transform: Transform,
  rect: ClientRect,
  boundingRect: ClientRect,
): Transform {
  const value = { ...transform }
  if (rect.top + transform.y <= boundingRect.top) {
    value.y = boundingRect.top - rect.top
  } else if (rect.bottom + transform.y >= boundingRect.top + boundingRect.height) {
    value.y = boundingRect.top + boundingRect.height - rect.bottom
  }
  if (rect.left + transform.x <= boundingRect.left) {
    value.x = boundingRect.left - rect.left
  } else if (rect.right + transform.x >= boundingRect.left + boundingRect.width) {
    value.x = boundingRect.left + boundingRect.width - rect.right
  }
  return value
}

// dnd-kit modifiers for row drag (inlined — no `@dnd-kit/modifiers` dep): keep the drag on the **vertical
// axis**, and **clamp it to the parent** (`<tbody>`) so a row dragged past the table's top/bottom can't
// extend beyond it and grow the scroll container / add a scrollbar.
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 })
const restrictToParentElement: Modifier = ({ containerNodeRect, draggingNodeRect, transform }) =>
  draggingNodeRect && containerNodeRect
    ? restrictToBoundingRect(transform, draggingNodeRect, containerNodeRect)
    : transform
const rowDragModifiers = [restrictToVerticalAxis, restrictToParentElement]

/**
 * A reorderable body row — wraps `useSortable` (dnd-kit) and renders a leading **drag-handle** cell (the
 * grip `IconButton`) before the row's data cells. The handle carries the drag listeners; the rest of the
 * row stays clickable (`onRowClick`). Only rendered when the table is `reorderable`.
 */
function SortableRow({
  id,
  cells,
  clickable,
  onClick,
}: {
  id: string
  cells: ReactNode
  clickable: boolean
  onClick?: () => void
}) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({
    id,
  })
  return (
    <tr
      ref={setNodeRef}
      className={clsx(styles.tr, clickable && styles.clickable, isDragging && styles.dragging)}
      style={
        {
          // Translate (not Transform) — skip dnd-kit's scaleX/scaleY, which would squish/stretch the
          // dragged row to the target's size when rows have different heights; keep the row's own size
          transform: CSS.Translate.toString(transform),
          transition,
          position: isDragging ? 'relative' : undefined,
          zIndex: isDragging ? 1 : undefined,
        } as CSSProperties
      }
      onClick={onClick}
    >
      <td className={clsx(styles.td, styles.dragHandleCell)}>
        <button
          type="button"
          className={styles.dragHandle}
          aria-label={DRAG_HANDLE_LABEL}
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <Icon name="Menu" size="sm" />
        </button>
      </td>
      {cells}
    </tr>
  )
}

/** Wraps the table body in a dnd-kit `DndContext` only when reordering is on — a passthrough otherwise. */
function ReorderProvider({
  enabled,
  sensors,
  onDragEnd,
  children,
}: {
  enabled: boolean
  sensors: ReturnType<typeof useSensors>
  onDragEnd: (event: DragEndEvent) => void
  children: ReactNode
}) {
  if (!enabled) return <>{children}</>
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={rowDragModifiers}
      onDragEnd={onDragEnd}
    >
      {children}
    </DndContext>
  )
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
    queryMapping,
    onExportToEmail,
    filters,
    defaultFilters,
    onRowClick,
    actions,
    reorderable = false,
    onReorder,
    loading = false,
    empty,
    urlSync = true,
    page,
    onPageChange,
    pageSize,
    onPageSizeChange,
    search,
    onSearchChange,
    sort,
    onSortChange,
    filterValues,
    onFiltersChange,
    stickyHeader = false,
    striped = false,
    hoverable = true,
    className,
    ...props
  }: TableProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  // the query mapping — the app-wide `config.table.query` merged with this table's override. It drives BOTH
  // the server-request query (`state.query`) AND the browser-URL sync, so the two share one shape.
  const configQueryMapping = useTableQueryConfig()
  const queryMappingRef = useRef<TableQueryConfig>({})
  queryMappingRef.current = { ...configQueryMapping, ...queryMapping }

  // keep the latest onChange for the stable emit effect (avoids re-subscribing)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  // filter defs for the stable URL write / popstate closures
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  // horizontal-scroll state → a soft shadow on a pinned column's inner edge when content is hidden under
  // it (so it reads as "content scrolls under here", not a hard cut)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const tableRef = useRef<HTMLTableElement | null>(null)
  const [pinShadow, setPinShadow] = useState({ start: false, end: false })

  // seed the URL-synced state once, parsing the browser query with the SAME mapping the request uses (so the
  // URL the table writes round-trips). `page` / `size` fall back to the defaults when absent from the URL.
  const [urlSeed] = useState(() => {
    const params =
      urlSync && typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    if (!params) {
      return {
        page: null as number | null,
        size: null as number | null,
        search: '',
        sort: null as TableSortState | null,
        filters: {} as TableFilterState,
      }
    }
    return {
      ...parseTableQuery(params, queryMappingRef.current),
      filters: filters?.length ? parseFilterQuery(filters, params, queryMappingRef.current) : {},
    }
  })

  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: (urlSeed.page ?? defaultPage) - 1,
    pageSize: urlSeed.size ?? defaultPageSize,
  }))
  // `searchInput` is the immediate input value; `globalFilter` is the committed (debounced) query — both
  // seed from the URL when synced, else `defaultSearch`
  const [searchInput, setSearchInput] = useState(urlSeed.search || defaultSearch)
  const [globalFilter, setGlobalFilter] = useState(urlSeed.search || defaultSearch)
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (urlSeed.sort) return [{ id: urlSeed.sort.key, desc: urlSeed.sort.direction === 'desc' }]
    return defaultSort ? [{ id: defaultSort.key, desc: defaultSort.direction === 'desc' }] : []
  })
  const [filterState, setFilterState] = useState<TableFilterState>(() => ({
    ...defaultFilters,
    ...urlSeed.filters,
  }))

  const manual = manualPagination

  // ── controlled-or-uncontrolled resolution ──────────────────────────────────────
  // Each piece reads its controlled prop when provided, else the internal state above. Every mutation goes
  // through a `commit*` helper, which fires the `on*Change` callback AND updates the internal fallback (only
  // for the pieces that aren't controlled) — so controlled + uncontrolled behave identically downstream.
  const pageControlled = page !== undefined
  const sizeControlled = pageSize !== undefined
  const searchControlled = search !== undefined
  const sortControlled = sort !== undefined
  const filtersControlled = filterValues !== undefined

  const resolvedPagination: PaginationState = {
    pageIndex: pageControlled ? page - 1 : pagination.pageIndex,
    pageSize: sizeControlled ? pageSize : pagination.pageSize,
  }
  const resolvedGlobalFilter = searchControlled ? search : globalFilter
  const resolvedSorting = useMemo<SortingState>(
    () =>
      sortControlled ? (sort ? [{ id: sort.key, desc: sort.direction === 'desc' }] : []) : sorting,
    [sortControlled, sort, sorting],
  )
  const resolvedFilterState = useMemo<TableFilterState>(
    () => (filtersControlled ? filterValues : filterState),
    [filtersControlled, filterValues, filterState],
  )

  // commit a pagination change: notify the controlled page/size callbacks + update the internal fallback for
  // whichever piece is uncontrolled. A pagination change never resets the page (that's the point of paging).
  const commitPagination = (updater: Updater<PaginationState>) => {
    const cur = resolvedPagination
    const next = resolveUpdater(updater, cur)
    if (next.pageIndex !== cur.pageIndex) onPageChange?.(next.pageIndex + 1)
    if (next.pageSize !== cur.pageSize) onPageSizeChange?.(next.pageSize)
    setPagination((p) => ({
      pageIndex: pageControlled ? p.pageIndex : next.pageIndex,
      pageSize: sizeControlled ? p.pageSize : next.pageSize,
    }))
  }
  // resetting to the first page is the shared side effect of a size / search / sort / filter change
  const resetToFirstPage = () =>
    commitPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }))

  const commitSearch = (value: string, resetPage = true) => {
    if (!searchControlled) setGlobalFilter(value)
    onSearchChange?.(value)
    if (resetPage) resetToFirstPage()
  }
  const commitSorting = (updater: Updater<SortingState>, resetPage = true) => {
    const next = resolveUpdater(updater, resolvedSorting)
    if (!sortControlled) setSorting(next)
    onSortChange?.(next[0] ? { key: next[0].id, direction: next[0].desc ? 'desc' : 'asc' } : null)
    if (resetPage) resetToFirstPage()
  }
  const commitFilters = (next: TableFilterState, resetPage = true) => {
    if (!filtersControlled) setFilterState(next)
    onFiltersChange?.(next)
    if (resetPage) resetToFirstPage()
  }

  // local mode: filter `data` client-side before TanStack (search / sort / paginate then run on the result);
  // server mode: pass it through — the consumer fetches per the emitted `state.filters`
  const filteredData = useMemo(
    () =>
      filters && filters.length > 0 && !manual
        ? applyFilters(data, filters, resolvedFilterState)
        : data,
    [filters, manual, data, resolvedFilterState],
  )
  // applying / clearing filters resets to the first page (the filtered set changes what "page 1" means)
  const handleFiltersChange = commitFilters

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

  // the sortable columns drive the toolbar sort menu — each lists an explicit ascending + descending entry
  const sortableColumns = useMemo(() => columns.filter((c) => c.sortable), [columns])
  // one row per sortable column; clicking cycles that column through ascending → descending → unsorted
  const cycleSort = (key: string) =>
    commitSorting((prev) => {
      const cur = prev[0]
      if (!cur || cur.id !== key) return [{ id: key, desc: false }] // → ascending
      if (!cur.desc) return [{ id: key, desc: true }] // ascending → descending
      return [] // descending → unsorted
    })

  const table = useReactTable<T>({
    data: filteredData,
    columns: tanstackColumns,
    state: {
      pagination: resolvedPagination,
      globalFilter: resolvedGlobalFilter,
      sorting: resolvedSorting,
    },
    onPaginationChange: commitPagination,
    onGlobalFilterChange: (updater) =>
      commitSearch(resolveUpdater(updater as Updater<string>, resolvedGlobalFilter)),
    onSortingChange: commitSorting,
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

  // row drag-and-drop reordering (dnd-kit) — pointer (5px activation) + keyboard sensors; the sortable ids
  // are the TanStack row ids (= `getRowId`), and a drop moves the item within the full `data` and emits it
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const rowIdOf = (row: T, index: number) => (getRowId ? getRowId(row, index) : String(index))
  const handleReorder = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !onReorder) return
    const from = data.findIndex((r, i) => rowIdOf(r, i) === active.id)
    const to = data.findIndex((r, i) => rowIdOf(r, i) === over.id)
    if (from < 0 || to < 0) return
    onReorder(arrayMove(data, from, to), { id: String(active.id), from, to })
  }

  const totalRows = manual ? (rowCount ?? data.length) : table.getFilteredRowModel().rows.length
  const { pageIndex, pageSize: resolvedPageSize } = resolvedPagination
  const pageCount = Math.max(1, Math.ceil(totalRows / resolvedPageSize))
  const currentPage = pageIndex + 1
  const rangeStart = totalRows === 0 ? 0 : pageIndex * resolvedPageSize + 1
  const rangeEnd = manual
    ? Math.min(totalRows, pageIndex * resolvedPageSize + rows.length)
    : Math.min(totalRows, currentPage * resolvedPageSize)

  // keep the search box in sync when `search` is controlled externally (e.g. cleared from a parent button)
  useEffect(() => {
    if (search !== undefined) setSearchInput(search)
  }, [search])

  // debounce a typed search into the committed query, resetting to the first page when it actually changes
  useEffect(() => {
    if (searchInput === resolvedGlobalFilter) return
    const handle = setTimeout(() => commitSearch(searchInput), debounceMs)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, resolvedGlobalFilter, debounceMs])

  // clamp the page if the row count shrank beneath it (e.g. a local search filtered rows away)
  useEffect(() => {
    if (pageIndex > 0 && pageIndex >= pageCount) {
      commitPagination((p) => ({ ...p, pageIndex: pageCount - 1 }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount, pageIndex])

  const sortState: TableSortState | null = resolvedSorting[0]
    ? { key: resolvedSorting[0].id, direction: resolvedSorting[0].desc ? 'desc' : 'asc' }
    : null
  // the current table state, with the ready-to-use server-request params built from the query mapping (so a
  // consumer fetch / export is a one-liner). Rebuilt on demand — the emit effect + the export actions share it.
  const getTableState = (): TableChangeState => {
    const currentPageNum = pageIndex + 1
    const size = resolvedPageSize
    const params = buildTableQuery(
      { page: currentPageNum, size, search: resolvedGlobalFilter, sort: sortState },
      queryMappingRef.current,
    )
    // fold the active filters into the same server-request query (config-driven param names/format)
    if (filters?.length) {
      buildFilterQuery(filters, resolvedFilterState, queryMappingRef.current).forEach((v, k) =>
        params.append(k, v),
      )
    }
    return {
      page: currentPageNum,
      size,
      search: resolvedGlobalFilter,
      sort: sortState,
      filters: resolvedFilterState,
      params,
      query: prettyQuery(params),
    }
  }
  // emit the full state on mount + whenever it changes — the server-mode fetch driver
  useEffect(() => {
    onChangeRef.current?.(getTableState())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, resolvedPageSize, resolvedGlobalFilter, resolvedSorting, resolvedFilterState])

  const hasExport = onExportToEmail != null
  const hasFilters = filters != null && filters.length > 0

  // mirror the table's state to the URL using the SAME builder as the server request (`state.query`), so the
  // address bar matches the request shape (e.g. `?page=1&size=10&sortBy=rating&orderBy=desc`). `replaceState`
  // (no history spam); canonicalizes on mount; params the table doesn't own are preserved. Gated by `urlSync`.
  const writeQuery = useCallback(
    (
      page: number,
      pageSize: number,
      search: string,
      sort: TableSortState | null,
      activeFilters: TableFilterState,
    ) => {
      if (typeof window === 'undefined' || !urlSync) return
      const mapping = queryMappingRef.current
      const defs = filtersRef.current
      // build the same params the request uses (page/size/search/sort + the active filters)
      const built = buildTableQuery({ page, size: pageSize, search, sort }, mapping)
      if (defs?.length) {
        buildFilterQuery(defs, activeFilters, mapping).forEach((v, k) => built.append(k, v))
      }
      // the param names the table owns (resolved from the mapping) — cleared before copying `built` in, so a
      // now-empty piece (cleared search, unset filter, "All" dropping page/size) drops out of the URL too
      const m = {
        pageParam: 'page',
        sizeParam: 'size',
        searchParam: 'search',
        sortParam: 'sort',
        sortOrderParam: 'order',
        ...mapping,
      }
      const minSuffix = mapping.rangeMinSuffix ?? 'Min'
      const maxSuffix = mapping.rangeMaxSuffix ?? 'Max'
      const owned = [m.pageParam, m.sizeParam, m.searchParam, m.sortParam, m.sortOrderParam]
      for (const f of defs ?? []) {
        const p = f.queryKey ?? f.key
        owned.push(p, p + minSuffix, p + maxSuffix)
      }
      // keep unrelated params (another widget's `?tab=…`), drop ours (incl. indexed `key[0]`), copy in built
      const params = new URLSearchParams(window.location.search)
      for (const key of [...params.keys()]) {
        if (owned.includes(key) || owned.some((b) => key.startsWith(`${b}[`))) params.delete(key)
      }
      built.forEach((v, k) => params.append(k, v))

      const query = prettyQuery(params)
      const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
      // skip a no-op write (e.g. the mount canonicalization when the URL already matches)
      if (url === `${window.location.pathname}${window.location.search}${window.location.hash}`)
        return
      window.history.replaceState(window.history.state, '', url)
    },
    [urlSync],
  )
  useEffect(() => {
    writeQuery(
      pageIndex + 1,
      resolvedPageSize,
      resolvedGlobalFilter,
      sortState,
      resolvedFilterState,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pageIndex,
    resolvedPageSize,
    resolvedGlobalFilter,
    resolvedSorting,
    resolvedFilterState,
    writeQuery,
  ])

  // Back/Forward → restore state from the query (parsed with the same mapping). Kept fresh behind a stable
  // ref (the commit* helpers + resolved values change each render), so the listener never re-subscribes. It
  // restores WITHOUT resetting the page (the URL carries the intended page) and routes through the commit*
  // helpers so a controlled parent is notified of the Back/Forward navigation too.
  const popStateRef = useRef<() => void>(() => {})
  popStateRef.current = () => {
    const params = new URLSearchParams(window.location.search)
    const mapping = queryMappingRef.current
    const parsed = parseTableQuery(params, mapping)
    commitPagination(() => ({
      pageIndex: (parsed.page ?? defaultPage) - 1,
      pageSize: parsed.size ?? resolvedPageSize,
    }))
    setSearchInput(parsed.search)
    commitSearch(parsed.search, false)
    commitSorting(
      () => (parsed.sort ? [{ id: parsed.sort.key, desc: parsed.sort.direction === 'desc' }] : []),
      false,
    )
    const defs = filtersRef.current
    if (defs?.length) commitFilters(parseFilterQuery(defs, params, mapping), false)
  }
  useEffect(() => {
    if (typeof window === 'undefined' || !urlSync) return
    const handler = () => popStateRef.current()
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [urlSync])

  // dev-only: a row-interactive table that relies on the index as its React key can misplace row DOM (and
  // in-cell focus / state) when rows reorder or a server page swaps in — hint to pass `getRowId`. Fires once.
  useEffect(() => {
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV !== 'production' &&
      !getRowId &&
      (onRowClick != null || actions != null || reorderable)
    ) {
      console.warn(
        '[Table] No `getRowId` provided, so the row index is used as the React key. For a table with row ' +
          'interactions or changing / paged data, pass `getRowId` (e.g. `(row) => row.id`) so each row keeps ' +
          'its identity across sort / filter / refetch.',
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const hasToolbar =
    title != null ||
    toolbar != null ||
    searchable ||
    hasFilters ||
    sortableColumns.length > 0 ||
    hasExport

  // the data `<td>`s for one row — shared by the plain and the reorderable (`SortableRow`) row paths
  const rowCells = (row: (typeof rows)[number]) =>
    renderColumns.map((col) => (
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
          col.cell ? col.cell(row.original, row.index) : formatCell(row.getValue(col.key)),
        )}
      </td>
    ))

  return (
    <div ref={ref} className={clsx(styles.root, className)} {...props}>
      {hasToolbar && (
        <div className={styles.toolbar}>
          {/* left group — title + search */}
          <div className={styles.toolbarStart}>
            {title != null && (
              <Typography variant="h4" as="div" className={styles.title}>
                {title}
              </Typography>
            )}
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
          </div>
          {/* right group — custom toolbar content + filters + sort + export */}
          <div className={styles.toolbarEnd}>
            {toolbar}
            {hasExport && (
              // export menu — a baked "Send On Email" item; the consumer only wires `onExportToEmail`
              <Dropdown
                placement="bottom-end"
                trigger={
                  <IconButton variant="filled" size="sm" aria-label="Export">
                    <Icon name="ExportArrow" />
                  </IconButton>
                }
              >
                <Typography as="div" variant="caption" color="muted" className={styles.menuTitle}>
                  Export
                </Typography>
                <ListItem clickable icon="Sms" onClick={() => onExportToEmail?.(getTableState())}>
                  Send On Email
                </ListItem>
              </Dropdown>
            )}
            {sortableColumns.length > 0 && (
              // sort menu — one row per sortable column; clicking cycles that column asc → desc → unsorted.
              // The menu **stays open** (`closeOnSelect={false}`) so you can cycle without reopening; the
              // active row shows a `selected` tint + a direction arrow, and a dot `Badge` on the trigger
              // flags that a sort is applied.
              <Dropdown
                placement="bottom-end"
                closeOnSelect={false}
                trigger={
                  <Badge dot={resolvedSorting.length > 0} color="primary">
                    <IconButton variant="filled" size="sm" aria-label="Sort">
                      <Icon name="Sort" />
                    </IconButton>
                  </Badge>
                }
              >
                <Typography as="div" variant="caption" color="muted" className={styles.menuTitle}>
                  Sort By
                </Typography>
                {sortableColumns.map((col) => {
                  const active = sortState?.key === col.key
                  return (
                    <ListItem
                      key={col.key}
                      clickable
                      selected={active}
                      // active column shows its direction (↑ asc / ↓ desc); clicking cycles asc → desc → off
                      trailing={
                        active ? (
                          <Icon name={sortState?.direction === 'desc' ? 'ArrowDown' : 'ArrowUp2'} />
                        ) : undefined
                      }
                      onClick={() => cycleSort(col.key)}
                    >
                      {col.header}
                    </ListItem>
                  )
                })}
              </Dropdown>
            )}
            {hasFilters && (
              <TableFilters filters={filters} value={filterState} onChange={handleFiltersChange} />
            )}
          </div>
        </div>
      )}

      <ReorderProvider enabled={reorderable} sensors={sensors} onDragEnd={handleReorder}>
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
                {reorderable && (
                  <th className={clsx(styles.th, styles.dragHandleCell)} scope="col" aria-hidden />
                )}
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
                reorderable ? (
                  // dnd-kit sortable rows — each `SortableRow` renders a leading drag-handle cell + `rowCells`
                  <SortableContext
                    items={rows.map((row) => row.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {rows.map((row) => (
                      <SortableRow
                        key={row.id}
                        id={row.id}
                        clickable={!!onRowClick}
                        onClick={onRowClick ? () => onRowClick(row.original, row.index) : undefined}
                        cells={rowCells(row)}
                      />
                    ))}
                  </SortableContext>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className={clsx(styles.tr, onRowClick && styles.clickable)}
                      onClick={onRowClick ? () => onRowClick(row.original, row.index) : undefined}
                    >
                      {rowCells(row)}
                    </tr>
                  ))
                )
              ) : (
                // no rows → a centered placeholder cell: the loader while fetching (mirrors the empty
                // state's presence), otherwise the empty state
                <tr>
                  <td
                    colSpan={Math.max(1, renderColumns.length + (reorderable ? 1 : 0))}
                    className={styles.stateCell}
                  >
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
      </ReorderProvider>

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
                  value={resolvedPageSize >= ALL_ROWS ? 'all' : String(resolvedPageSize)}
                  onChange={(value) =>
                    commitPagination(() => ({
                      pageIndex: 0,
                      pageSize: value === 'all' ? ALL_ROWS : Number(value),
                    }))
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
              onChange={(nextPage) => commitPagination((p) => ({ ...p, pageIndex: nextPage - 1 }))}
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
