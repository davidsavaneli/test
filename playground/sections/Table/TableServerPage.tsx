import { useCallback, useRef, useState } from 'react'
import { Chip, Table, type TableChangeState, type TableColumn, type ThemeColor } from '../../../src'
import { Block, Section } from '../../shared'

/* Server mode against a REAL free API — https://dummyjson.com (no key, CORS-enabled). The table's
   `onChange({ page, size, search, sort })` maps straight to DummyJSON's query params:
     • list:   /products?limit=<size>&skip=<(page-1)*size>&sortBy=<key>&order=<asc|desc>
     • search: /products/search?q=<search>&limit=…&skip=…
   Each response is { products, total, skip, limit } → we feed `products` to `data` and `total` to
   `rowCount`. `manualPagination` means the table renders exactly what we pass and never slices. */

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

    // the table's "All" size is a huge sentinel → DummyJSON's limit=0 means "return everything"
    const limit = state.size > 10000 ? 0 : state.size
    const skip = (state.page - 1) * state.size
    const params = new URLSearchParams({ limit: String(limit), skip: String(skip) })
    if (state.sort) {
      params.set('sortBy', state.sort.key)
      params.set('order', state.sort.direction)
    }
    let path = 'products'
    if (state.search) {
      path = 'products/search'
      params.set('q', state.search)
    }

    fetch(`https://dummyjson.com/${path}?${params}`, { signal: controller.signal })
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
        description="manualPagination: the table drives the state and onChange fires the fetch against dummyjson.com. page/size → limit + skip, search → /products/search?q=, sort → sortBy + order. It renders exactly the page the API returns (total drives the pager); search is debounced."
      >
        <Table
          manualPagination
          data={rows}
          rowCount={total}
          loading={loading}
          onChange={fetchPage}
          columns={columns}
          getRowId={(p) => String(p.id)}
          searchable
          searchPlaceholder="Search products…"
        />
      </Block>
    </Section>
  )
}
