import { describe, expect, it } from 'vitest'
import { toCsv, type CsvColumn } from './tableExport'

interface Row {
  name: string
  price: number
  note: string
}

const columns: CsvColumn<Row>[] = [
  { header: 'Name', value: (r) => r.name },
  { header: 'Price', value: (r) => r.price },
  { header: 'Note', value: (r) => r.note },
]

describe('toCsv', () => {
  it('builds a header row + one CRLF-separated line per row', () => {
    const csv = toCsv(
      [
        { name: 'Sofa', price: 10, note: 'nice' },
        { name: 'Chair', price: 5, note: 'ok' },
      ],
      columns,
    )
    expect(csv).toBe('Name,Price,Note\r\nSofa,10,nice\r\nChair,5,ok')
  })

  it('quotes fields with commas / quotes / newlines and doubles embedded quotes', () => {
    const csv = toCsv([{ name: 'A, B', price: 1, note: 'say "hi"\nnow' }], columns)
    expect(csv).toBe('Name,Price,Note\r\n"A, B",1,"say ""hi""\nnow"')
  })

  it('emits empty for null/undefined values and header-only when there are no rows', () => {
    expect(toCsv([], columns)).toBe('Name,Price,Note')
    const csv = toCsv([{ name: 'X', price: 0, note: undefined as unknown as string }], columns)
    // a real 0 is kept; undefined → empty field
    expect(csv).toBe('Name,Price,Note\r\nX,0,')
  })
})
