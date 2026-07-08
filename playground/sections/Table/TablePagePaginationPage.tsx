import { type TableQueryConfig } from '../../../src'
import { QueryFormatDemo } from './QueryFormatDemo'

/* PAGE-based pagination — the default. The table emits the 1-based page number as-is (`page=2&size=10`).
   Compare with the sibling "Pagination — offset" page (skip/limit). Only `pagination` differs. */
const pageQuery: TableQueryConfig = {
  pagination: 'page', // → page=2 (1-based page number)
}

export function TablePagePaginationPage() {
  return (
    <QueryFormatDemo
      label="Pagination — page-based (page + size)"
      description="pagination: 'page' (default) → the query carries the 1-based page number (page=2&size=10). Local table, so paging works client-side; the query below is what a page-based server would receive. Flip through pages to watch it change."
      queryMapping={pageQuery}
    />
  )
}
