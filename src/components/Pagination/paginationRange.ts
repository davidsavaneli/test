/** A gap placeholder rendered as `…` — at the start (`1 … 4`) or end (`6 … 10`) of the range. */
export type PaginationEllipsis = 'start-ellipsis' | 'end-ellipsis'

/** One item in a pagination range: a 1-based page number, or an ellipsis placeholder. */
export type PaginationItem = number | PaginationEllipsis

/** Inputs for {@link paginationRange}. */
export interface PaginationRangeOptions {
  /** Total number of pages. */
  count: number
  /** Current page (1-based). */
  page: number
  /** Pages shown on each side of the current page. Defaults to `1`. */
  siblingCount?: number
  /** Pages always shown at the start and end. Defaults to `1`. */
  boundaryCount?: number
}

/** Inclusive integer range `[start, end]` (empty when `end < start`). */
const range = (start: number, end: number): number[] =>
  Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i)

/**
 * Build the page-item sequence for a pager — the boundary pages, the current page with its siblings,
 * and `start`/`end` ellipses where pages are skipped (the classic `1 … 4 5 6 … 10`). Pure and
 * framework-free so it can be unit-tested in isolation and reused. Assumes `1 <= page <= count`.
 */
export function paginationRange({
  count,
  page,
  siblingCount = 1,
  boundaryCount = 1,
}: PaginationRangeOptions): PaginationItem[] {
  if (count <= 0) return []

  // Pages pinned at each edge.
  const startPages = range(1, Math.min(boundaryCount, count))
  const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count)

  // The window of pages around the current one, clamped so it never overlaps the boundaries.
  const siblingsStart = Math.max(
    Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  )
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : count - 1,
  )

  return [
    ...startPages,
    // A start ellipsis, OR the single page that sits between the start boundary and the siblings.
    ...(siblingsStart > boundaryCount + 2
      ? (['start-ellipsis'] as PaginationItem[])
      : boundaryCount + 1 < count - boundaryCount
        ? [boundaryCount + 1]
        : []),
    ...range(siblingsStart, siblingsEnd),
    // An end ellipsis, OR the single page between the siblings and the end boundary.
    ...(siblingsEnd < count - boundaryCount - 1
      ? (['end-ellipsis'] as PaginationItem[])
      : count - boundaryCount > boundaryCount
        ? [count - boundaryCount]
        : []),
    ...endPages,
  ]
}
