import { useCallback, useRef, useState } from 'react'
import {
  Chip,
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
   from main.tsx), so the `state.query` shown live below reflects that mapping — e.g. `sort=-price` (field) vs
   `sortBy=price&order=desc` (separate). DummyJSON honors skip/limit/q + a `separate` sort natively; a page
   whose mapping differs (e.g. the app-config page's page/size) still shows the outgoing URL — the point of
   these pages — even though DummyJSON ignores params it doesn't recognize. */

interface Product {
  id: number
  title: string
  brand: string
  category: string
  price: number
  rating: number
  stock: number
}

const ratingColor = (r: number): ThemeColor => (r >= 4.5 ? 'success' : r >= 3 ? 'warning' : 'error')

const columns: TableColumn<Product>[] = [
  { key: 'title', header: 'Title', sortable: true, wrap: true },
  { key: 'brand', header: 'Brand' },
  { key: 'category', header: 'Category' },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    sortable: true,
    cell: (p) => `$${p.price.toFixed(2)}`,
  },
  {
    key: 'rating',
    header: 'Rating',
    align: 'right',
    sortable: true,
    cell: (p) => <Chip color={ratingColor(p.rating)}>{p.rating.toFixed(1)}</Chip>,
  },
  { key: 'stock', header: 'Stock', align: 'right', sortable: true },
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
      .then((data: { products?: Product[]; total?: number }) => {
        setRows(data.products ?? [])
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
        />
      </Block>
    </Section>
  )
}
