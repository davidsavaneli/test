import { Chip, Table, type TableColumn, type ThemeColor } from '../../../src'
import { Block, Section } from '../../shared'

/* Striped + clickable rows — a product catalogue. `striped` zebra-stripes the rows and `onRowClick`
   makes the whole row interactive (open a detail view). Note the right-aligned numeric columns. */

interface Product {
  id: string
  name: string
  category: string
  sku: string
  price: number
  stock: number
}

const CATEGORIES = ['Laptops', 'Phones', 'Audio', 'Accessories']
const NAMES = [
  'Aero Book 14',
  'Aero Book Pro',
  'Pulse Phone X',
  'Pulse Phone Mini',
  'Wave Buds',
  'Wave Buds Pro',
  'Studio Headset',
  'Type-C Hub',
  'Fast Charger 65W',
  'Sleeve 14"',
  'Desk Stand',
  'Wireless Mouse',
]

const PRODUCTS: Product[] = NAMES.map((name, i) => ({
  id: String(i + 1),
  name,
  category: CATEGORIES[i % CATEGORIES.length],
  sku: `SKU-${String(1000 + i * 7)}`,
  price: 19 + i * 37.5,
  stock: (i * 13) % 40,
}))

const stockColor = (stock: number): ThemeColor =>
  stock === 0 ? 'error' : stock < 10 ? 'warning' : 'success'

const columns: TableColumn<Product>[] = [
  { key: 'name', header: 'Product', sortable: true },
  { key: 'category', header: 'Category' },
  { key: 'sku', header: 'SKU' },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    sortable: true,
    cell: (p) => `$${p.price.toFixed(2)}`,
  },
  {
    key: 'stock',
    header: 'Stock',
    align: 'right',
    sortable: true,
    cell: (p) => (
      <Chip color={stockColor(p.stock)}>{p.stock === 0 ? 'Out' : `${p.stock} left`}</Chip>
    ),
  },
]

export function TableStripedPage() {
  return (
    <Section>
      <Block
        label="Striped + clickable rows"
        description="striped zebra-stripes the rows; onRowClick makes the whole row open a detail view. Numeric columns use align: 'right'."
      >
        <Table
          data={PRODUCTS}
          columns={columns}
          getRowId={(p) => p.id}
          striped
          defaultPageSize={10}
          onRowClick={(p) => alert(`Open ${p.name}`)}
        />
      </Block>
    </Section>
  )
}
