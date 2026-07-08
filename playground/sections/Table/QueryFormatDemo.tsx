import { useState } from 'react'
import { Table, type TableColumn, type TableQueryConfig } from '../../../src'
import { Block, Section } from '../../shared'
import { QueryPreview } from './QueryPreview'

/* Query-format demo on a LOCAL dataset — the table sorts / paginates / searches client-side (so everything
   works visibly), while the live query below shows the exact request a SERVER would receive for this
   `queryMapping`. Used for the pagination-format pages: page-based (`page=2&size=10`) vs offset
   (`skip=10&limit=10`). Local (not DummyJSON) because DummyJSON only understands skip/limit, so a
   page-based server demo wouldn't actually paginate. */

interface Item {
  id: number
  name: string
  category: string
  price: number
}

const DATA: Item[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  category: ['Tools', 'Home', 'Garden'][i % 3],
  price: ((i * 7) % 50) + 1,
}))

const columns: TableColumn<Item>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'category', header: 'Category', sortable: true },
  { key: 'price', header: 'Price', align: 'right', sortable: true, cell: (r) => `$${r.price}` },
]

interface QueryFormatDemoProps {
  label: string
  description: string
  /** The per-table query mapping whose built query is shown live below the table. */
  queryMapping: TableQueryConfig
}

export function QueryFormatDemo({ label, description, queryMapping }: QueryFormatDemoProps) {
  const [query, setQuery] = useState('') // the query a server would receive — shown live as you navigate
  return (
    <Section>
      <Block label={label} description={description}>
        <QueryPreview path="/items" query={query} />
        <Table
          data={DATA}
          columns={columns}
          queryMapping={queryMapping}
          onChange={(s) => setQuery(s.query)}
          getRowId={(r) => String(r.id)}
          searchable
          searchPlaceholder="Search items…"
        />
      </Block>
    </Section>
  )
}
