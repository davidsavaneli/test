import { useState } from 'react'
import {
  Button,
  Row,
  Table,
  Typography,
  type TableColumn,
  type TableFilterState,
  type TableSortState,
} from '../../../src'
import { Block, Section } from '../../shared'

/* Controlled mode — the PARENT owns page / sort / filters (like Select / Tabs). Each piece has a
   controlled prop + an on*Change; here `page`, `sort`, and `filterValues` live in this component's state, so
   the buttons drive the table from OUTSIDE and the table reports its own changes back. "Clear Filters" from
   an external button is the motivating case. (Omit a controlled prop to let the table manage that piece.) */

interface Product {
  id: string
  name: string
  category: string
  price: number
}

const CATEGORIES = ['Furniture', 'Groceries', 'Beauty']

const DATA: Product[] = Array.from({ length: 40 }, (_, i) => ({
  id: String(i + 1),
  name: `Product ${String(i + 1).padStart(2, '0')}`,
  category: CATEGORIES[i % CATEGORIES.length],
  price: ((i * 37) % 500) + 10,
}))

const columns: TableColumn<Product>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'category', header: 'Category' },
  { key: 'price', header: 'Price', sortable: true, cell: (p) => `$${p.price}` },
]

export function TableControlledPage() {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<TableSortState | null>(null)
  const [filterValues, setFilterValues] = useState<TableFilterState>({})

  return (
    <Section>
      <Block
        label="Controlled — the parent owns page / sort / filters"
        description="Each piece (page / pageSize / search / sort / filterValues) can be controlled with its on*Change. Here the parent holds page + sort + filters in state: the buttons below drive the table from outside, and the table reports its changes back through the callbacks. The live state under the buttons mirrors what the table holds."
      >
        <Row gap="xs" wrap style={{ marginBottom: 'var(--tz-space-sm)' }}>
          <Button size="sm" variant="outlined" onClick={() => setPage((p) => Math.max(1, p - 1))}>
            ‹ Prev (external)
          </Button>
          <Button size="sm" variant="outlined" onClick={() => setPage((p) => p + 1)}>
            Next (external) ›
          </Button>
          <Button
            size="sm"
            variant="outlined"
            onClick={() => setSort({ key: 'price', direction: 'desc' })}
          >
            Sort by price ↓
          </Button>
          <Button size="sm" variant="filled" color="error" onClick={() => setFilterValues({})}>
            Clear Filters
          </Button>
        </Row>
        <Typography
          variant="bodySmall"
          color="muted"
          as="div"
          style={{ marginBottom: 'var(--tz-space-sm)' }}
        >
          page: {page} · sort: {sort ? `${sort.key} ${sort.direction}` : 'none'} · filters:{' '}
          {JSON.stringify(filterValues)}
        </Typography>
        <Table
          data={DATA}
          columns={columns}
          getRowId={(p) => p.id}
          searchable
          urlSync={false}
          filters={[
            {
              key: 'category',
              label: 'Category',
              type: 'select',
              options: CATEGORIES.map((c) => ({ value: c, label: c })),
            },
            { key: 'price', label: 'Price', type: 'numberRange' },
          ]}
          page={page}
          onPageChange={setPage}
          sort={sort}
          onSortChange={setSort}
          filterValues={filterValues}
          onFiltersChange={setFilterValues}
        />
      </Block>
    </Section>
  )
}
