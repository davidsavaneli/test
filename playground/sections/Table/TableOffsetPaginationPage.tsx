import { type TableQueryConfig } from '../../../src'
import { QueryFormatDemo } from './QueryFormatDemo'

/* OFFSET pagination — for skip/limit APIs (DummyJSON, many REST backends). The table emits a zero-based
   offset `(page - 1) * size` instead of the page number (`skip=10&limit=10`). Compare with the sibling
   "Pagination — page-based" page. Only `pagination` (and the renamed params) differ. */
const offsetQuery: TableQueryConfig = {
  page: 'skip',
  size: 'limit',
  pagination: 'offset', // → skip=(page-1)*size (zero-based offset)
}

export function TableOffsetPaginationPage() {
  return (
    <QueryFormatDemo
      label="Pagination — offset (skip + limit)"
      description="pagination: 'offset' → the query carries a zero-based offset instead of a page (skip=10&limit=10 for page 2 @ size 10). Local table, so paging works client-side; the query below is what a skip/limit server would receive. Flip through pages to watch skip jump by the page size."
      queryMapping={offsetQuery}
    />
  )
}
