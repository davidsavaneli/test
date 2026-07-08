import { type TableQueryConfig } from '../../../src'
import { QueryFormatDemo } from './QueryFormatDemo'

/* sortFormat: 'field' (the default) — one param carries the key + direction with a `-` prefix for desc. */
const fieldSort: TableQueryConfig = {
  sortFormat: 'field', // → sort=-price (desc) / sort=price (asc)
}

export function TableSortFieldPage() {
  return (
    <QueryFormatDemo
      label="Sort — field (single param)"
      description="sortFormat: 'field' (default) → one param carries key + direction: sort=-price (desc), sort=price (asc). Sort the columns below and watch the query."
      queryMapping={fieldSort}
    />
  )
}
