import { describe, expect, it } from 'vitest'
import { buildTableQuery, type TableQueryState } from './table'

const state = (over: Partial<TableQueryState> = {}): TableQueryState => ({
  page: 1,
  size: 10,
  search: '',
  sort: null,
  ...over,
})

describe('buildTableQuery', () => {
  it('defaults to the page-based browser-URL shape (page/size, `-` for desc)', () => {
    const q = buildTableQuery(
      state({ page: 2, search: 'phone', sort: { key: 'price', direction: 'desc' } }),
    )
    expect(q.toString()).toBe('page=2&size=10&search=phone&sort=-price')
  })

  it('omits an empty search and a null sort; asc has no `-` prefix', () => {
    expect(buildTableQuery(state()).toString()).toBe('page=1&size=10')
    expect(buildTableQuery(state({ sort: { key: 'name', direction: 'asc' } })).toString()).toBe(
      'page=1&size=10&sort=name',
    )
  })

  it('renames params + emits an offset + a separate sort key/order (DummyJSON style)', () => {
    const mapping = {
      page: 'skip',
      size: 'limit',
      search: 'q',
      sort: 'sortBy',
      pagination: 'offset' as const,
      sortFormat: 'separate' as const,
    }
    const q = buildTableQuery(
      state({ page: 3, size: 10, search: 'ess', sort: { key: 'price', direction: 'asc' } }),
      mapping,
    )
    // page 3 @ size 10 → offset 20; q for search; sortBy + order for sort
    expect(q.get('skip')).toBe('20')
    expect(q.get('limit')).toBe('10')
    expect(q.get('q')).toBe('ess')
    expect(q.get('sortBy')).toBe('price')
    expect(q.get('order')).toBe('asc')
  })

  it('appends the direction to the key for sortFormat: "suffix" (priceAsc / priceDesc)', () => {
    const mapping = { sortFormat: 'suffix' as const, ascValue: 'Asc', descValue: 'Desc' }
    expect(
      buildTableQuery(state({ sort: { key: 'price', direction: 'asc' } }), mapping).get('sort'),
    ).toBe('priceAsc')
    expect(
      buildTableQuery(state({ sort: { key: 'price', direction: 'desc' } }), mapping).get('sort'),
    ).toBe('priceDesc')
  })

  it('honors sortOrderKey + asc/desc value overrides', () => {
    const q = buildTableQuery(state({ sort: { key: 'price', direction: 'desc' } }), {
      sortFormat: 'separate',
      sortOrderKey: 'direction',
      ascValue: 'ASC',
      descValue: 'DESC',
    })
    expect(q.get('sort')).toBe('price')
    expect(q.get('direction')).toBe('DESC')
  })

  it('drops the page/offset on the "All" sentinel size; emits only allValue for size', () => {
    const all = state({ page: 1, size: Number.MAX_SAFE_INTEGER })
    // "All" has no meaningful page → the page/offset param is dropped; only allValue is emitted
    const withAll = buildTableQuery(all, {
      page: 'skip',
      size: 'limit',
      pagination: 'offset',
      allValue: 0,
    })
    expect(withAll.has('skip')).toBe(false) // no page/offset on "All"
    expect(withAll.get('limit')).toBe('0')
    expect(withAll.toString()).toBe('limit=0')
    // no allValue → "All" emits nothing (no page, no size)
    const noAll = buildTableQuery(all)
    expect(noAll.toString()).toBe('')
  })
})
