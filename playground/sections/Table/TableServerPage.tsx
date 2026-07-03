import { useCallback, useRef, useState } from 'react'
import { Chip, Table, type TableChangeState, type TableColumn, type ThemeColor } from '../../../src'
import { Block, Section } from '../../shared'

/* Server mode against a REAL free API — https://dummyjson.com (no key, CORS-enabled). Instead of
   hand-mapping page/size/search/sort, we let the Table build DummyJSON's exact query via `queryMapping`
   (offset + separate sort key/order, renamed params) and just append `state.query`:
     • list:   /products?skip=<(page-1)*size>&limit=<size>&sortBy=<key>&order=<asc|desc>
     • search: /products/search?q=<search>&skip=…&limit=…
   Each response is { products, total, skip, limit } → we feed `products` to `data` and `total` to
   `rowCount`. `manualPagination` means the table renders exactly what we pass and never slices. The same
   mapping can live app-wide in `<ConfigProvider config={{ table: { query } }}>` instead of per-table. */

// DummyJSON's query shape: skip/limit offset pagination, `q` search, sortBy + order sort, limit=0 = all
const dummyJsonQuery = {
  page: 'skip',
  size: 'limit',
  search: 'q',
  sort: 'sortBy',
  pagination: 'offset',
  sortFormat: 'separate',
  allValue: 0,
} as const

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

export function TableServerPage() {
  const [rows, setRows] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  // abort the in-flight request when a newer one starts, so a slow response can't overwrite a newer page
  const abortRef = useRef<AbortController | null>(null)

  const fetchPage = useCallback((state: TableChangeState) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)

    // the query (skip/limit/q/sortBy/order) is already built by the table from `queryMapping` — we only
    // pick the endpoint (DummyJSON puts search on a different path) and append `state.query`
    const path = state.search ? 'products/search' : 'products'
    fetch(`https://dummyjson.com/${path}?${state.query}`, { signal: controller.signal })
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
      <Block
        label="Server — real API (dummyjson.com)"
        description="manualPagination: the table builds DummyJSON's query (skip/limit/q/sortBy+order) from queryMapping, so onChange just appends state.query to the endpoint. It renders exactly the page the API returns (total drives the pager); search is debounced."
      >
        <Table
          manualPagination
          data={rows}
          rowCount={total}
          loading={loading}
          onChange={fetchPage}
          queryMapping={dummyJsonQuery}
          columns={columns}
          getRowId={(p) => String(p.id)}
          searchable
          searchPlaceholder="Search products…"
        />
      </Block>
    </Section>
  )
}
