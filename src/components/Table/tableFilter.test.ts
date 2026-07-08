import { describe, expect, it } from 'vitest'
import {
  activeFilterCount,
  applyFilters,
  buildFilterQuery,
  decodeFilterValue,
  encodeFilterValue,
  isFilterActive,
  type TableFilter,
  type TableFilterType,
  type TableFilterValue,
} from './tableFilter'

interface Row {
  name: string
  category: string
  price: number
  active: boolean
  created: string // ISO date
}

const rows: Row[] = [
  { name: 'Sofa', category: 'furniture', price: 900, active: true, created: '2026-01-10' },
  { name: 'Apple', category: 'groceries', price: 2, active: false, created: '2026-03-20' },
  { name: 'Lamp', category: 'furniture', price: 40, active: true, created: '2026-02-15' },
  { name: 'Milk', category: 'groceries', price: 3, active: true, created: '2026-05-01' },
]

const filters: TableFilter[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'category', label: 'Category', type: 'select' },
  { key: 'category', label: 'Categories', type: 'multiSelect' },
  { key: 'price', label: 'Price', type: 'numberRange' },
  { key: 'active', label: 'Active', type: 'boolean' },
  { key: 'created', label: 'Created', type: 'dateRange' },
]

const nameFilter = filters[0]
const selectFilter = filters[1]
const multiFilter = filters[2]
const rangeFilter = filters[3]
const boolFilter = filters[4]
const dateRangeFilter = filters[5]

describe('applyFilters', () => {
  it('returns all rows when no filter is set', () => {
    expect(applyFilters(rows, filters, {})).toHaveLength(4)
    expect(applyFilters(rows, filters, { name: '', price: [null, null] })).toHaveLength(4)
  })

  it('text — case-insensitive substring match', () => {
    expect(applyFilters(rows, [nameFilter], { name: 'la' }).map((r) => r.name)).toEqual(['Lamp'])
  })

  it('select — exact match', () => {
    expect(applyFilters(rows, [selectFilter], { category: 'furniture' })).toHaveLength(2)
  })

  it('multiSelect — value in the chosen set', () => {
    const out = applyFilters(rows, [multiFilter], { category: ['groceries'] })
    expect(out.map((r) => r.name)).toEqual(['Apple', 'Milk'])
  })

  it('numberRange — inclusive min/max, either bound optional', () => {
    expect(applyFilters(rows, [rangeFilter], { price: [3, 100] }).map((r) => r.name)).toEqual([
      'Lamp',
      'Milk',
    ])
    expect(applyFilters(rows, [rangeFilter], { price: [null, 40] })).toHaveLength(3) // ≤ 40
    expect(applyFilters(rows, [rangeFilter], { price: [900, null] })).toHaveLength(1) // ≥ 900
  })

  it('numberRangeSlider — matches identically to numberRange (same [min,max] value)', () => {
    const slider: TableFilter = { key: 'price', label: 'Price', type: 'numberRangeSlider' }
    expect(applyFilters(rows, [slider], { price: [3, 100] }).map((r) => r.name)).toEqual([
      'Lamp',
      'Milk',
    ])
  })

  it('boolean — exact true/false', () => {
    expect(applyFilters(rows, [boolFilter], { active: true })).toHaveLength(3)
    expect(applyFilters(rows, [boolFilter], { active: false }).map((r) => r.name)).toEqual([
      'Apple',
    ])
  })

  it('dateRange — inclusive ISO day range, either bound optional', () => {
    // Apple 03-20 + Lamp 02-15 fall in [02-01, 04-01]; result keeps the source row order (Apple, Lamp)
    const out = applyFilters(rows, [dateRangeFilter], { created: ['2026-02-01', '2026-04-01'] })
    expect(out.map((r) => r.name)).toEqual(['Apple', 'Lamp'])
  })

  it('combines multiple active filters with AND', () => {
    const out = applyFilters(rows, filters, { category: 'furniture', price: [100, null] })
    expect(out.map((r) => r.name)).toEqual(['Sofa']) // furniture AND price ≥ 100
  })
})

describe('isFilterActive / activeFilterCount', () => {
  it('treats empty string / empty array / all-null range / null as inactive', () => {
    expect(isFilterActive('text', '')).toBe(false)
    expect(isFilterActive('multiSelect', [])).toBe(false)
    expect(isFilterActive('numberRange', [null, null])).toBe(false)
    expect(isFilterActive('dateRange', ['', ''])).toBe(false)
    expect(isFilterActive('boolean', null)).toBe(false)
  })

  it('treats a set value as active (incl. boolean false and a 0 number)', () => {
    expect(isFilterActive('text', 'x')).toBe(true)
    expect(isFilterActive('boolean', false)).toBe(true)
    expect(isFilterActive('number', 0)).toBe(true)
    expect(isFilterActive('numberRange', [null, 5])).toBe(true)
  })

  it('activeFilterCount counts only set filters', () => {
    expect(activeFilterCount(filters, { name: 'a', active: true, price: [null, null] })).toBe(2)
  })
})

describe('applyFilters — time / datetime types (ISO values)', () => {
  interface Ev {
    id: number
    at: string // ISO datetime
  }
  const events: Ev[] = [
    { id: 1, at: '2026-03-01T09:30:00' },
    { id: 2, at: '2026-03-01T14:15:00' },
    { id: 3, at: '2026-03-05T09:30:00' },
  ]
  const at = (type: TableFilter['type']): TableFilter[] => [{ key: 'at', label: 'At', type }]
  const ids = (out: Ev[]) => out.map((e) => e.id)

  it('date — matches the calendar day', () => {
    expect(ids(applyFilters(events, at('date'), { at: '2026-03-01T00:00:00' }))).toEqual([1, 2])
  })
  it('dateTime — matches to the minute', () => {
    expect(ids(applyFilters(events, at('dateTime'), { at: '2026-03-01T09:30:00' }))).toEqual([1])
  })
  it('time — matches HH:mm regardless of day', () => {
    expect(ids(applyFilters(events, at('time'), { at: '2026-01-01T09:30:00' }))).toEqual([1, 3])
  })
  it('timeRange — time-of-day within [from, to]', () => {
    const out = applyFilters(events, at('timeRange'), {
      at: ['2026-01-01T09:00:00', '2026-01-01T12:00:00'],
    })
    expect(ids(out)).toEqual([1, 3])
  })
  it('dateTimeRange — datetime within [from, to] (minute precision)', () => {
    const out = applyFilters(events, at('dateTimeRange'), {
      at: ['2026-03-01T00:00:00', '2026-03-02T00:00:00'],
    })
    expect(ids(out)).toEqual([1, 2])
  })
})

describe('encodeFilterValue / decodeFilterValue (URL round-trip)', () => {
  const cases: Array<[TableFilterType, TableFilterValue, string]> = [
    ['text', 'phone', 'phone'],
    ['number', 5, '5'],
    ['select', 'furniture', 'furniture'],
    ['boolean', true, 'true'],
    ['multiSelect', ['a', 'b'], 'a,b'],
    ['numberRange', [10, 100], '10,100'],
    ['numberRange', [null, 40], ',40'],
    ['dateRange', ['2026-01-01', '2026-02-01'], '2026-01-01,2026-02-01'],
    [
      'dateTimeRange',
      ['2026-01-01T09:00:00', '2026-01-02T10:00:00'],
      '2026-01-01T09:00:00,2026-01-02T10:00:00',
    ],
  ]

  it('encodes to the expected URL string', () => {
    for (const [type, value, encoded] of cases) expect(encodeFilterValue(type, value)).toBe(encoded)
  })

  it('round-trips encode → decode by type', () => {
    for (const [type, value] of cases) {
      const enc = encodeFilterValue(type, value)!
      expect(decodeFilterValue(type, enc)).toEqual(value)
    }
  })

  it('returns null for an inactive value (so it is omitted from the URL)', () => {
    expect(encodeFilterValue('text', '')).toBeNull()
    expect(encodeFilterValue('multiSelect', [])).toBeNull()
    expect(encodeFilterValue('numberRange', [null, null])).toBeNull()
  })
})

describe('buildFilterQuery (server-request query)', () => {
  const defs: TableFilter[] = [
    { key: 'name', label: '', type: 'text' },
    { key: 'category', label: '', type: 'select' },
    { key: 'brand', label: '', type: 'multiSelect' },
    { key: 'price', label: '', type: 'numberRange' },
    { key: 'inStock', label: '', type: 'boolean' },
  ]

  it('serializes scalars + multiSelect (repeat) + range (Min/Max) by default', () => {
    const q = buildFilterQuery(defs, {
      name: 'phone',
      category: 'furniture',
      brand: ['a', 'b'],
      price: [10, 100],
      inStock: true,
    })
    expect(q.get('name')).toBe('phone')
    expect(q.get('category')).toBe('furniture')
    expect(q.getAll('brand')).toEqual(['a', 'b']) // repeated params
    expect(q.get('priceMin')).toBe('10')
    expect(q.get('priceMax')).toBe('100')
    expect(q.get('inStock')).toBe('true')
  })

  it('skips inactive filters (empty query)', () => {
    expect(buildFilterQuery(defs, { name: '', brand: [], price: [null, null] }).toString()).toBe('')
  })

  it('honors multiSelectFormat: csv + custom range suffixes + queryKey rename', () => {
    const custom: TableFilter[] = [
      { key: 'brand', label: '', type: 'multiSelect' },
      { key: 'price', label: '', type: 'numberRange' },
      { key: 'name', label: '', type: 'text', queryKey: 'q' },
    ]
    const q = buildFilterQuery(
      custom,
      { brand: ['a', 'b'], price: [10, null], name: 'x' },
      { multiSelectFormat: 'csv', rangeMinSuffix: '_gte', rangeMaxSuffix: '_lte' },
    )
    expect(q.get('brand')).toBe('a,b') // csv
    expect(q.get('price_gte')).toBe('10')
    expect(q.has('price_lte')).toBe(false) // max not set → omitted
    expect(q.get('q')).toBe('x') // queryKey rename
  })

  it('multiSelectFormat: indexed → cat[0]=a&cat[1]=b', () => {
    const q = buildFilterQuery(
      [{ key: 'brand', label: '', type: 'multiSelect' }],
      { brand: ['a', 'b'] },
      {
        multiSelectFormat: 'indexed',
      },
    )
    expect(q.get('brand[0]')).toBe('a')
    expect(q.get('brand[1]')).toBe('b')
  })
})
