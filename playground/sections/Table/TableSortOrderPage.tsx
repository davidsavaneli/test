import { type TableQueryConfig } from '../../../src'
import { QueryFormatDemo } from './QueryFormatDemo'

/* sortFormat: 'separate' with a custom direction param name + values — sortOrderParam / ascValue / descValue,
   for backends that want e.g. `direction=DESC` instead of `order=desc`. */
const customOrder: TableQueryConfig = {
  sortParam: 'sortBy',
  sortFormat: 'separate',
  sortOrderParam: 'direction', // the direction param name (default 'order')
  ascValue: 'ASC', // value emitted for ascending (default 'asc')
  descValue: 'DESC', // value emitted for descending (default 'desc')
}

export function TableSortOrderPage() {
  return (
    <QueryFormatDemo
      label="Sort — custom order values"
      description="sortFormat: 'separate' + sortOrderParam: 'direction' + ascValue: 'ASC' / descValue: 'DESC' → sortBy=price&direction=DESC. For backends that want a custom direction param name or ASC/DESC casing."
      queryMapping={customOrder}
    />
  )
}
