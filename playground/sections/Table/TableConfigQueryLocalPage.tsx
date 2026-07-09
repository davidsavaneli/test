import { useState } from 'react'
import { Chip, Table, type TableColumn, type TableFilter, type ThemeColor } from '../../../src'
import { Block, Section } from '../../shared'
import { QueryPreview } from './QueryPreview'

/* The LOCAL sibling of "Query — App Config" — same app-wide `config.table.query` (NO `queryMapping`), same
   13 filter types, but the table works entirely CLIENT-SIDE (it searches / sorts / paginates / filters the
   local `data`). The preview above still shows the request a server WOULD receive for this state, built from
   the shared config — and, since URL sync uses that same mapping, the address bar matches it too. So you can
   watch the query take shape without any network, then flip a table to `manualPagination` for the real thing. */

interface Product {
  id: number
  title: string
  brand: string
  category: string
  price: number
  rating: number
  stock: number
  inStock: boolean
  created: string // ISO date
  updated: string // ISO date
  openAt: string // HH:mm:ss
  shiftAt: string // HH:mm:ss
  startAt: string // ISO datetime
  endAt: string // ISO datetime
}

const CATEGORIES = ['furniture', 'groceries', 'beauty']
const BRANDS = ['Apple', 'Samsung', 'Essence']
const pad = (n: number) => String(n).padStart(2, '0')

// a row per product with a value for every filter's field, so all 13 filters actually narrow the data
const DATA: Product[] = Array.from({ length: 40 }, (_, i) => {
  const month = pad((i % 12) + 1)
  const day = pad((i % 28) + 1)
  const hh = pad(i % 24)
  const mm = pad((i * 7) % 60)
  return {
    id: i + 1,
    title: `Product ${pad(i + 1)}`,
    brand: BRANDS[i % BRANDS.length],
    category: CATEGORIES[i % CATEGORIES.length],
    price: ((i * 13) % 200) + 5,
    rating: (i % 5) + 1,
    stock: (i * 7) % 100,
    inStock: i % 2 === 0,
    created: `2026-${month}-${day}`,
    updated: `2026-${month}-${day}`,
    openAt: `${hh}:${mm}:00`,
    shiftAt: `${hh}:00:00`,
    startAt: `2026-${month}-${day}T${hh}:${mm}:00`,
    endAt: `2026-${month}-${day}T${hh}:${mm}:00`,
  }
})

const ratingColor = (r: number): ThemeColor => (r >= 4 ? 'success' : r >= 3 ? 'warning' : 'error')

const columns: TableColumn<Product>[] = [
  { key: 'title', header: 'Title', sortable: true, wrap: true },
  { key: 'brand', header: 'Brand' },
  { key: 'category', header: 'Category' },
  { key: 'price', header: 'Price', align: 'right', sortable: true, cell: (p) => `$${p.price}` },
  {
    key: 'rating',
    header: 'Rating',
    align: 'right',
    sortable: true,
    cell: (p) => <Chip color={ratingColor(p.rating)}>{p.rating}</Chip>,
  },
  { key: 'stock', header: 'Stock', align: 'right', sortable: true },
]

const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }))

// every filter type — the same set as the server page, all matching a real field so they filter locally
const filters: TableFilter[] = [
  { key: 'title', label: 'Title', type: 'text' }, // text
  { key: 'rating', label: 'Rating (exact)', type: 'number' }, // number
  { key: 'price', label: 'Price', type: 'numberRange' }, // numberRange
  { key: 'stock', label: 'Stock', type: 'numberRangeSlider', min: 0, max: 100, step: 5 }, // slider
  { key: 'category', label: 'Category', type: 'select', options: toOptions(CATEGORIES) }, // select
  { key: 'brand', label: 'Brands', type: 'multiSelect', options: toOptions(BRANDS) }, // multiSelect
  {
    key: 'inStock',
    label: 'In Stock',
    type: 'boolean',
    booleanLabels: { any: 'All', yes: 'In stock', no: 'Sold out' },
  }, // boolean
  { key: 'created', label: 'Created on', type: 'date' }, // date
  { key: 'updated', label: 'Updated between', type: 'dateRange' }, // dateRange
  { key: 'openAt', label: 'Open at', type: 'time' }, // time
  { key: 'shiftAt', label: 'Shift between', type: 'timeRange' }, // timeRange
  { key: 'startAt', label: 'Starts at', type: 'dateTime' }, // dateTime
  { key: 'endAt', label: 'Ends between', type: 'dateTimeRange' }, // dateTimeRange
]

export function TableConfigQueryLocalPage() {
  const [query, setQuery] = useState('') // the request a server WOULD get — built from config, shown live
  return (
    <Section>
      <Block
        label="Query — app config (local table)"
        description="Local mode (no manualPagination, no queryMapping) — the table filters / sorts / paginates the client-side data itself, while the preview above (and the URL-synced address bar) show the request a server would receive, built from config.table.query in main.tsx. Sort, search, open Filters (every type) and watch both update in lock-step — no network involved."
      >
        <QueryPreview path="/products" query={query} />
        <Table
          data={DATA}
          columns={columns}
          filters={filters}
          onChange={(s) => setQuery(s.query)}
          getRowId={(p) => String(p.id)}
          searchable
          searchPlaceholder="Search products…"
          onExportToEmail={(state) => alert(`Emailing export — server query: ?${state.query}`)}
        />
      </Block>
    </Section>
  )
}
