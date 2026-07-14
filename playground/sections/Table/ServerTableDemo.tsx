import { useCallback, useRef, useState } from 'react'
import {
  Chip,
  Icon,
  IconButton,
  Table,
  type TableChangeState,
  type TableColumn,
  type TableFilter,
  type TableQueryConfig,
  type ThemeColor,
} from '../../../src'
import { Block, Section } from '../../shared'
import { QueryPreview } from './QueryPreview'

/* Shared server-mode demo against a REAL free API — https://dummyjson.com (no key, CORS-enabled). Reused by
   the Server pages; each passes its own `queryMapping` (or OMITS it to use the app-wide `config.table.query`
   from main.tsx), so the `state.query` shown live below reflects that mapping. DummyJSON only returns
   title/brand/category/price/rating/stock, so the remaining filter fields (inStock / created / … / endAt) are
   derived per row in `augment` — every column then shows real data. */

// what DummyJSON returns
interface RawProduct {
  id: number
  title: string
  brand: string
  category: string
  price: number
  rating: number
  stock: number
}
// the row shape the table uses — the raw fields + the derived ones (one per filter field)
interface Product extends RawProduct {
  inStock: boolean
  created: string
  updated: string
  openAt: string
  shiftAt: string
  startAt: string
  endAt: string
}

const pad = (n: number) => String(n).padStart(2, '0')
// give every filter field a real, deterministic value (DummyJSON doesn't return these) so no column reads "—"
const augment = (p: RawProduct): Product => {
  const month = pad((p.id % 12) + 1)
  const day = pad((p.id % 28) + 1)
  const hh = pad(p.id % 24)
  const mm = pad((p.id * 7) % 60)
  return {
    ...p,
    inStock: p.stock > 0,
    created: `2026-${month}-${day}`,
    updated: `2026-${month}-${day}`,
    openAt: `${hh}:${mm}:00`,
    shiftAt: `${hh}:00:00`,
    startAt: `2026-${month}-${day}T${hh}:${mm}:00`,
    endAt: `2026-${month}-${day}T${hh}:${mm}:00`,
  }
}

const ratingColor = (r: number): ThemeColor => (r >= 4.5 ? 'success' : r >= 3 ? 'warning' : 'error')

// a column per filter field, so every filter has a matching, populated column
const columns: TableColumn<Product>[] = [
  { key: 'title', header: 'Title', sortable: true, wrap: true },
  {
    key: 'rating',
    header: 'Rating',
    align: 'right',
    sortable: true,
    cell: (p) => <Chip color={ratingColor(p.rating)}>{p.rating.toFixed(1)}</Chip>,
  },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    sortable: true,
    cell: (p) => `$${p.price.toFixed(2)}`,
  },
  { key: 'stock', header: 'Stock', align: 'right', sortable: true },
  { key: 'category', header: 'Category' },
  { key: 'brand', header: 'Brand' },
  { key: 'inStock', header: 'In Stock', cell: (p) => (p.inStock ? 'Yes' : 'No') },
  { key: 'created', header: 'Created' },
  { key: 'updated', header: 'Updated' },
  { key: 'openAt', header: 'Open At' },
  { key: 'shiftAt', header: 'Shift At' },
  { key: 'startAt', header: 'Starts At' },
  { key: 'endAt', header: 'Ends At' },
]

interface ServerTableDemoProps {
  label: string
  description: string
  /** The per-table query mapping (param names, offset/page, sort format, filter suffixes). Omit to use the
   *  app-wide `config.table.query` (no per-table override) — the URL then follows main.tsx. */
  queryMapping?: TableQueryConfig
  /** Optional filter defs — their active values fold into `state.query` (visible in the preview). */
  filters?: TableFilter[]
}

export function ServerTableDemo({
  label,
  description,
  queryMapping,
  filters,
}: ServerTableDemoProps) {
  const [rows, setRows] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('') // the last built query string — shown live so the format is visible
  // abort the in-flight request when a newer one starts, so a slow response can't overwrite a newer page
  const abortRef = useRef<AbortController | null>(null)

  const fetchPage = useCallback((state: TableChangeState) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setQuery(state.query)

    // the query is already built by the table from `queryMapping` — we only pick the endpoint (DummyJSON
    // puts search on a different path) and append `state.query` (only with a `?` when it's non-empty, so an
    // empty query — e.g. "All" with no `allValue` — hits a clean `/products`, not `/products?`)
    const path = state.search ? 'products/search' : 'products'
    const url = `https://dummyjson.com/${path}${state.query ? `?${state.query}` : ''}`
    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { products?: RawProduct[]; total?: number }) => {
        setRows((data.products ?? []).map(augment))
        setTotal(data.total ?? 0)
        setLoading(false)
      })
      .catch((err) => {
        // an aborted request is expected (a newer one superseded it) — only stop on a real error
        if ((err as Error).name !== 'AbortError') setLoading(false)
      })
  }, [])

  return (
    <Section>
      <Block label={label} description={description}>
        {/* live preview of the query the table builds from `queryMapping` — the point of these pages */}
        <QueryPreview path="/products" query={query} />
        <Table
          manualPagination
          data={rows}
          rowCount={total}
          loading={loading}
          onChange={fetchPage}
          queryMapping={queryMapping}
          filters={filters}
          columns={columns}
          getRowId={(p) => String(p.id)}
          searchable
          searchPlaceholder="Search products…"
          onExportToEmail={(state) => alert(`Emailing export — server query: ?${state.query}`)}
          actions={(p) => (
            <>
              <IconButton
                size="sm"
                variant="text"
                aria-label={`Edit ${p.title}`}
                onClick={() => alert(`Edit ${p.title}`)}
              >
                <Icon name="Edit2" />
              </IconButton>
              <IconButton
                size="sm"
                variant="text"
                color="error"
                aria-label={`Delete ${p.title}`}
                onClick={() => alert(`Delete ${p.title}`)}
              >
                <Icon name="Trash" />
              </IconButton>
            </>
          )}
        />
      </Block>
    </Section>
  )
}
