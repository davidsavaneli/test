import { type TableQueryConfig } from '../../../src'
import { QueryFormatDemo } from './QueryFormatDemo'

/* allValue — what the size param emits when "All" is picked. Here `limit=0` (DummyJSON-style "all"); on
   "All" the page/offset param is dropped too, so the query collapses to just `limit=0`. */
const allValueQuery: TableQueryConfig = {
  page: 'skip',
  size: 'limit',
  pagination: 'offset',
  allValue: 0, // "All" → limit=0 (else the size param would be omitted on "All")
}

export function TableAllValuePage() {
  return (
    <QueryFormatDemo
      label="All value — allValue: 0"
      description="allValue: 0 → pick 'All' in the rows-per-page dropdown and the query collapses to just limit=0 (the page/offset param is dropped — no meaningful page on 'All'). Normal pages emit skip + limit. Compare with the sibling 'All value — default' page (no allValue)."
      queryMapping={allValueQuery}
    />
  )
}
