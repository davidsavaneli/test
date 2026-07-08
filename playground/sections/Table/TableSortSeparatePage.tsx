import { type TableQueryConfig } from '../../../src'
import { QueryFormatDemo } from './QueryFormatDemo'

/* sortFormat: 'separate' — two params: the key in `sort` (renamed to sortBy here) + direction in `order`. */
const separateSort: TableQueryConfig = {
  sort: 'sortBy',
  sortFormat: 'separate', // → sortBy=price&order=desc
}

export function TableSortSeparatePage() {
  return (
    <QueryFormatDemo
      label="Sort — separate (key + order)"
      description="sortFormat: 'separate' → two params — the key in `sort` (renamed to sortBy) + the direction in `order` (default): sortBy=price&order=desc. Many REST APIs (incl. DummyJSON) use this."
      queryMapping={separateSort}
    />
  )
}
