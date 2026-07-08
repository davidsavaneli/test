import { Chip, Table, type TableColumn, type TableFilter, type ThemeColor } from '../../../src'
import { Block, Section } from '../../shared'

/* Filters demo (local mode) — EVERY filter type at once. `filters` is declarative (like `columns`): the
   table renders a toolbar "Filters" button (count badge) opening a Modal of fields + Clear/Apply. In local
   mode it filters `data` client-side on Apply (AND across set filters); server mode emits `state.filters`.
   All core types, each on its own field: text · number · numberRange (Min/Max inputs) · numberRangeSlider
   (a two-thumb slider) · select · multiSelect · boolean · date · dateRange · time · timeRange · dateTime ·
   dateTimeRange. */

interface Product {
  id: number
  name: string
  category: string
  brand: string
  price: number
  stock: number
  rating: number
  inStock: boolean
  created: string // date — single-day filter
  updated: string // date — range filter
  startAt: string // ISO datetime — dateTime filter
  endAt: string // ISO datetime — dateTimeRange filter
  openAt: string // ISO datetime — time filter (time-of-day)
  shiftAt: string // ISO datetime — timeRange filter
}

const CATEGORIES = ['Furniture', 'Groceries', 'Electronics']
const BRANDS = ['Acme', 'Globex', 'Initech', 'Umbrella']
const pad = (n: number) => String(n).padStart(2, '0')

const DATA: Product[] = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  category: CATEGORIES[i % 3],
  brand: BRANDS[i % 4],
  price: ((i * 37) % 500) + 5,
  stock: (i * 17) % 100, // 0–99
  rating: (i % 5) + 1, // 1–5
  inStock: i % 3 !== 0,
  created: `2026-03-${pad((i % 5) + 1)}`, // clustered days so a single-day filter matches
  updated: `2026-${pad((i % 6) + 1)}-15`, // spread across months for the range filter
  startAt: `2026-03-${pad((i % 5) + 1)}T${pad((i % 12) + 8)}:${pad((i % 4) * 15)}:00`,
  endAt: `2026-${pad((i % 6) + 1)}-10T12:00:00`,
  openAt: `2026-01-01T${pad((i % 3) + 9)}:${pad((i % 2) * 30)}:00`, // 09:00 … 11:30 (time-of-day)
  shiftAt: `2026-01-01T${pad((i % 12) + 6)}:00:00`, // 06:00 … 17:00 (time-of-day)
}))

const ratingColor = (r: number): ThemeColor => (r >= 4 ? 'success' : r >= 3 ? 'warning' : 'error')
const dateTime = (s: string) => s.slice(0, 16).replace('T', ' ') // "2026-03-01 09:00"
const time = (s: string) => s.slice(11, 16) // "09:00"

const columns: TableColumn<Product>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'category', header: 'Category', sortable: true },
  { key: 'brand', header: 'Brand', sortable: true },
  { key: 'price', header: 'Price', align: 'right', sortable: true, cell: (p) => `$${p.price}` },
  { key: 'stock', header: 'Stock', align: 'right', sortable: true },
  {
    key: 'rating',
    header: 'Rating',
    align: 'right',
    sortable: true,
    cell: (p) => <Chip color={ratingColor(p.rating)}>{p.rating}</Chip>,
  },
  {
    key: 'inStock',
    header: 'In Stock',
    cell: (p) => <Chip color={p.inStock ? 'success' : 'error'}>{p.inStock ? 'Yes' : 'No'}</Chip>,
  },
  { key: 'created', header: 'Created', sortable: true },
  { key: 'updated', header: 'Updated', sortable: true },
  { key: 'startAt', header: 'Start At', sortable: true, cell: (p) => dateTime(p.startAt) },
  { key: 'endAt', header: 'End At', sortable: true, cell: (p) => dateTime(p.endAt) },
  { key: 'openAt', header: 'Open', align: 'right', sortable: true, cell: (p) => time(p.openAt) },
  { key: 'shiftAt', header: 'Shift', align: 'right', sortable: true, cell: (p) => time(p.shiftAt) },
]

const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }))

// every filter type, each on its own field (one key = one filter)
const filters: TableFilter[] = [
  { key: 'name', label: 'Name', type: 'text', placeholder: 'Search name…' }, // text
  { key: 'rating', label: 'Rating (exact)', type: 'number', placeholder: '1–5' }, // number
  { key: 'price', label: 'Price', type: 'numberRange' }, // numberRange (Min / Max inputs)
  { key: 'stock', label: 'Stock', type: 'numberRangeSlider', min: 0, max: 100, step: 5 }, // slider
  { key: 'category', label: 'Category', type: 'select', options: toOptions(CATEGORIES) }, // select
  { key: 'brand', label: 'Brands', type: 'multiSelect', options: toOptions(BRANDS) }, // multiSelect
  // boolean — radio labels overridable via `booleanLabels` (defaults Any / Yes / No)
  {
    key: 'inStock',
    label: 'In Stock',
    type: 'boolean',
    booleanLabels: { any: 'All', yes: 'In stock', no: 'Sold out' },
  },
  { key: 'created', label: 'Created on', type: 'date' }, // date
  { key: 'updated', label: 'Updated between', type: 'dateRange' }, // dateRange
  { key: 'openAt', label: 'Open at', type: 'time' }, // time
  { key: 'shiftAt', label: 'Shift between', type: 'timeRange' }, // timeRange
  { key: 'startAt', label: 'Starts at', type: 'dateTime' }, // dateTime
  { key: 'endAt', label: 'Ends between', type: 'dateTimeRange' }, // dateTimeRange
]

export function TableFiltersPage() {
  return (
    <Section>
      <Block
        label="Filters — every type (local)"
        description="Click Filters (top-right) → a Modal with one field per filter def, covering every core type: text · number · numberRange (Min/Max inputs) · numberRangeSlider (two-thumb slider) · select · multiSelect · boolean · date · dateRange · time · timeRange · dateTime · dateTimeRange. Set some and Apply — data filters client-side (AND) and the button shows a count badge. Clear resets."
      >
        <Table
          data={DATA}
          columns={columns}
          getRowId={(p) => String(p.id)}
          searchable
          searchPlaceholder="Search…"
          filters={filters}
        />
      </Block>
    </Section>
  )
}
