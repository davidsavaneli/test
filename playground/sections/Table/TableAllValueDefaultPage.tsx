import { type TableQueryConfig } from '../../../src'
import { QueryFormatDemo } from './QueryFormatDemo'

/* allValue DEFAULT (unset) — on "All" the size param is omitted entirely (and the page/offset param is
   dropped too), so the query collapses to nothing. For backends that treat a missing limit as unbounded.
   Same mapping as the "All value — allValue: 0" page, minus `allValue`, to isolate the difference. */
const defaultAllQuery: TableQueryConfig = {
  pageParam: 'skip',
  sizeParam: 'limit',
  pagination: 'offset',
  // no allValue → "All" emits neither the page nor the size param
}

export function TableAllValueDefaultPage() {
  return (
    <QueryFormatDemo
      label="All value — default (omitted)"
      description="No allValue (the default) → pick 'All' and the query becomes empty: both the page/offset and the size param are dropped (a missing limit = unbounded on many backends). Compare with the sibling 'All value — allValue: 0' page, which emits limit=0 instead."
      queryMapping={defaultAllQuery}
    />
  )
}
