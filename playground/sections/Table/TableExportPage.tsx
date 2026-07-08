import { Chip, Table, toast, type TableColumn, type ThemeColor } from '../../../src'
import { Block, Section } from '../../shared'

/* Export demo. `exportable` adds a toolbar export menu with a built-in client-side CSV — "This Page" (the
   rows shown). `exportActions` appends custom items like "Send On Email" / a server export; each gets the
   current table state, so it can hit your endpoint with `state.query` (e.g. `fetch('/products/export?' +
   state.query)`). Columns that render a node (the Price / Rating cells) give an `exportValue` so the CSV
   holds the raw value, not the JSX. */

interface Product {
  id: number
  name: string
  category: string
  price: number
  rating: number
  stock: number
}

const CATEGORIES = ['Furniture', 'Groceries', 'Electronics']

const DATA: Product[] = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  category: CATEGORIES[i % 3],
  price: ((i * 13) % 90) + 9.99,
  rating: (i % 5) + 1,
  stock: (i * 7) % 100,
}))

const ratingColor = (r: number): ThemeColor => (r >= 4 ? 'success' : r >= 3 ? 'warning' : 'error')

const columns: TableColumn<Product>[] = [
  { key: 'name', header: 'Name', sortable: true, wrap: true },
  { key: 'category', header: 'Category', sortable: true },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    sortable: true,
    cell: (p) => `$${p.price.toFixed(2)}`,
    exportValue: (p) => p.price.toFixed(2), // raw value in the CSV, not the "$…" string
  },
  {
    key: 'rating',
    header: 'Rating',
    align: 'right',
    sortable: true,
    cell: (p) => <Chip color={ratingColor(p.rating)}>{p.rating}</Chip>,
    exportValue: (p) => p.rating, // the Chip is a node → export the number
  },
  { key: 'stock', header: 'Stock', align: 'right', sortable: true },
]

export function TableExportPage() {
  return (
    <Section>
      <Block
        label="Export — CSV + custom action"
        description="Open the export menu (top-right). 'This Page' downloads a client-side CSV built from the columns (Price & Rating export their raw value via exportValue). 'Send On Email' is a custom exportActions item — it receives the current table state; a real app would POST state.query to a server-export endpoint. Sort / search first to see it reflected in the exported rows + the emitted query."
      >
        <Table
          data={DATA}
          columns={columns}
          getRowId={(p) => String(p.id)}
          searchable
          searchPlaceholder="Search products…"
          exportable
          exportFileName="products"
          exportActions={[
            {
              label: 'Send On Email',
              icon: 'Sms',
              onClick: (state) =>
                toast.info(`Would email a server export for ?${state.query || '(all)'}`),
            },
          ]}
        />
      </Block>
    </Section>
  )
}
