import { type TableFilter } from '../../../src'
import { ServerTableDemo } from './ServerTableDemo'

/* The APP-WIDE query config in action, SERVER mode — this page passes NO `queryMapping`, so the request URL
   (shown live above + visible in the Network tab) is built entirely from `config.table.query` in main.tsx.
   With the current config it emits page-based paging (page=1&size=10), sortBy=…&orderBy=… (sortFormat:
   'separate'), repeated multi-select params, and price_gte / price_lte ranges. Change main.tsx and the URL
   follows. (Real fetch to dummyjson.com; it ignores params it doesn't recognize — the point is the URL.) */

const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }))

// every filter type — set any and watch the full request URL build (in the preview + the Network tab)
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

export function TableConfigQueryPage() {
  return (
    <ServerTableDemo
      label="Query — app config (no per-table queryMapping)"
      description="Server mode with NO queryMapping — the request URL above (and in the Network tab) is built entirely from config.table.query in main.tsx. Sort → sortBy=…&orderBy=… (sortFormat: 'separate'); open Filters (every type) → multiSelect repeats params, ranges emit _gte / _lte. Change main.tsx and this URL follows. (Real fetch to dummyjson.com, which ignores params it doesn't recognize — the point is the outgoing URL.)"
      filters={filters}
    />
  )
}
