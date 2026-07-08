import { type TableQueryConfig } from '../../../src'
import { ServerTableDemo } from './ServerTableDemo'

/* The FULL mapping wired to a real backend (dummyjson.com) — every config field at once: renamed params
   (page/size/search/sort → skip/limit/q/sortBy), offset pagination, separate sort, and allValue: 0. This
   is real server mode — onChange fetches the API by appending state.query. */
const dummyJsonQuery: TableQueryConfig = {
  pageParam: 'skip',
  sizeParam: 'limit',
  searchParam: 'q',
  sortParam: 'sortBy',
  pagination: 'offset',
  sortFormat: 'separate',
  allValue: 0,
}

export function TableRealApiPage() {
  return (
    <ServerTableDemo
      label="Real API (DummyJSON) — full mapping"
      description="Every config field at once against a real backend: page/size/search/sort → skip/limit/q/sortBy+order, offset pagination, allValue: 0. manualPagination — onChange fetches dummyjson.com by appending state.query, so sort / paginate / search all hit the real API."
      queryMapping={dummyJsonQuery}
    />
  )
}
