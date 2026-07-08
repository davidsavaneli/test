import { type TableFilter, type TableQueryConfig } from '../../../src'
import { ServerTableDemo } from './ServerTableDemo'

/* Server-mode filters against a REAL API (dummyjson.com). The point is to SEE the request the table builds
   + how you wire it: the active filters fold into `state.query` (shown live above the table), and the fetch
   is a one-liner — `fetch('/products?' + state.query)`. NOTE: DummyJSON doesn't filter by these query params
   (it only has /products/category/{cat} + /products/search?q=), so the rows won't actually narrow here — a
   real backend would honor `category` / `price_gte` / `rating_gte`. This demo is about the URL + wiring. */

// DummyJSON shape + how filters serialize: CSV multiSelect, ranges as `<key>_gte` / `<key>_lte`
const dummyJsonQuery: TableQueryConfig = {
  // page: 'skip',
  // size: 'limit',
  // search: 'q',
  // sort: 'sortBy',
  // pagination: 'offset',
  // sortFormat: 'separate',
  // allValue: 0,
  // multiSelectFormat: 'csv',
  // rangeMinSuffix: '_gte',
  // rangeMaxSuffix: '_lte',
}

const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }))

// every filter type — so you can set any and watch the full request URL build in the network tab.
// (DummyJSON only has title/brand/category/price/rating/stock; the date/time ones don't map to real data,
// but that's fine — this demo is about the outgoing query, not narrowing DummyJSON's rows.)
const filters: TableFilter[] = [
  { key: 'title', label: 'Title', type: 'text' }, // text
  { key: 'rating', label: 'Rating (exact)', type: 'number' }, // number
  { key: 'price', label: 'Price', type: 'numberRange' }, // numberRange
  { key: 'stock', label: 'Stock', type: 'numberRangeSlider', min: 0, max: 100, step: 5 }, // slider
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    options: toOptions(['furniture', 'groceries', 'beauty']),
  }, // select
  {
    key: 'brand',
    label: 'Brands',
    type: 'multiSelect',
    options: toOptions(['Apple', 'Samsung', 'Essence']),
  }, // multiSelect
  {
    key: 'inStock',
    label: 'In Stock',
    type: 'boolean',
    booleanLabels: { any: 'All', yes: 'In stock', no: 'Sold out' },
  }, // boolean
  { key: 'created', label: 'Created on', type: 'date' }, // date
  { key: 'updated', label: 'Updated between', type: 'dateRange' }, // dateRange
  { key: 'openAt', label: 'Open at', type: 'time' }, // time
  { key: 'shiftAt', label: 'Shift between', type: 'timeRange' }, // timeRange
  { key: 'startAt', label: 'Starts at', type: 'dateTime' }, // dateTime
  { key: 'endAt', label: 'Ends between', type: 'dateTimeRange' }, // dateTimeRange
]

export function TableServerFiltersPage() {
  return (
    <ServerTableDemo
      label="Filters — server (real API + query)"
      description="manualPagination against dummyjson.com — every filter type is here so you can watch the full request build in the Network tab. Open Filters, set any, Apply → the active values fold into the query above (title=…, price_gte/_lte, brand=a,b, created=…, startAt=…) and the fetch just appends state.query. (DummyJSON ignores these filter params, so rows don't narrow — a real backend would use them; this shows the outgoing URL + wiring.)"
      queryMapping={dummyJsonQuery}
      filters={filters}
    />
  )
}
