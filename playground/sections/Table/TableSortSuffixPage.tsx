import { type TableQueryConfig } from '../../../src'
import { QueryFormatDemo } from './QueryFormatDemo'

/* sortFormat: 'suffix' — one param with the direction appended to the key. With ascValue: 'Asc' /
   descValue: 'Desc' the sort reads sort=priceAsc / sort=priceDesc. The suffix carries any casing or
   separator you want (e.g. ascValue: '_asc' → price_asc). */
const suffixSort: TableQueryConfig = {
  sortFormat: 'suffix',
  ascValue: 'Asc', // appended for ascending → priceAsc
  descValue: 'Desc', // appended for descending → priceDesc
}

export function TableSortSuffixPage() {
  return (
    <QueryFormatDemo
      label="Sort — suffix (priceAsc / priceDesc)"
      description="sortFormat: 'suffix' → the direction is appended to the key in one param: sort=priceAsc / sort=priceDesc (via ascValue: 'Asc' / descValue: 'Desc'). Sort the columns and watch the query. The suffix carries any casing/separator (e.g. ascValue: '_asc' → price_asc)."
      queryMapping={suffixSort}
    />
  )
}
