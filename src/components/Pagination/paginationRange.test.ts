import { describe, expect, it } from 'vitest'
import { paginationRange } from './paginationRange'

describe('paginationRange', () => {
  it('lists every page when the count is small (no ellipsis)', () => {
    expect(paginationRange({ count: 5, page: 1 })).toEqual([1, 2, 3, 4, 5])
  })

  it('shows both ellipses around the current page in the middle', () => {
    expect(paginationRange({ count: 10, page: 5 })).toEqual([
      1,
      'start-ellipsis',
      4,
      5,
      6,
      'end-ellipsis',
      10,
    ])
  })

  it('only shows the end ellipsis near the start', () => {
    expect(paginationRange({ count: 10, page: 1 })).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 10])
  })

  it('only shows the start ellipsis near the end', () => {
    expect(paginationRange({ count: 10, page: 10 })).toEqual([1, 'start-ellipsis', 6, 7, 8, 9, 10])
  })

  it('respects siblingCount (0 = just the current page between ellipses)', () => {
    expect(paginationRange({ count: 10, page: 5, siblingCount: 0 })).toEqual([
      1,
      'start-ellipsis',
      5,
      'end-ellipsis',
      10,
    ])
  })

  it('respects boundaryCount (2 = two pages pinned at each edge)', () => {
    expect(paginationRange({ count: 10, page: 5, boundaryCount: 2 })).toEqual([
      1,
      2,
      3,
      4,
      5,
      6,
      'end-ellipsis',
      9,
      10,
    ])
  })

  it('handles a single page and an empty count', () => {
    expect(paginationRange({ count: 1, page: 1 })).toEqual([1])
    expect(paginationRange({ count: 0, page: 1 })).toEqual([])
  })
})
