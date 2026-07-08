// Table filters — the declarative filter model + the pure local matcher. `applyFilters` is used by the
// Table in local mode (client-side) and is pure/testable; server mode just emits the filter state in
// `onChange`. Core filter types only (text / number / range / select / multi / boolean / date / dateRange).
import type { SelectOption } from '../Select'

/** Which control + matching logic a filter uses. */
export type TableFilterType =
  | 'text'
  | 'number'
  | 'numberRange'
  | 'numberRangeSlider'
  | 'select'
  | 'multiSelect'
  | 'boolean'
  | 'date'
  | 'dateRange'
  | 'time'
  | 'timeRange'
  | 'dateTime'
  | 'dateTimeRange'

/** The value a single filter holds — shape depends on its `type` (see each control). `null` / empty = off. */
export type TableFilterValue =
  | string // text · select · date · time · dateTime
  | number // number
  | boolean // boolean
  | string[] // multiSelect
  | [number | null, number | null] // numberRange · numberRangeSlider [min, max]
  | [string, string] // dateRange · timeRange · dateTimeRange [from, to]
  | null

/** A declarative filter definition — like a column, but for the filter panel. */
export interface TableFilter {
  /** Field key on the row — the local accessor + the key in the emitted filter state. */
  key: string
  /** Label shown in the filter panel. */
  label: string
  /** The filter's control + matching logic. */
  type: TableFilterType
  /** Options for `select` / `multiSelect`. */
  options?: SelectOption[]
  /** Placeholder for the input(s). */
  placeholder?: string
  /** `numberRange` slider bounds + step (defaults `0` / `100` / `1`) — set to match the column's data range. */
  min?: number
  max?: number
  step?: number
  /**
   * Labels for a `boolean` filter's three radios (defaults `Any` / `Yes` / `No`) — e.g.
   * `{ any: 'All', yes: 'In stock', no: 'Sold out' }`.
   */
  booleanLabels?: { any?: string; yes?: string; no?: string }
}

/** The active filter values, keyed by filter `key`. */
export type TableFilterState = Record<string, TableFilterValue>

/** Whether a filter value is "set" (should actually filter) — an empty string / array / all-null range is off. */
export function isFilterActive(
  type: TableFilterType,
  value: TableFilterValue | undefined,
): boolean {
  if (value == null) return false
  switch (type) {
    case 'number':
      return typeof value === 'number' && !Number.isNaN(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'multiSelect':
      return Array.isArray(value) && value.length > 0
    case 'numberRange':
    case 'numberRangeSlider':
      return Array.isArray(value) && (value[0] != null || value[1] != null)
    case 'dateRange':
    case 'timeRange':
    case 'dateTimeRange':
      return Array.isArray(value) && Boolean(value[0] || value[1])
    default: // text · select · date · time · dateTime
      return typeof value === 'string' && value.trim() !== ''
  }
}

/** Number of filters currently set — drives the count badge on the Filters button. */
export function activeFilterCount(filters: TableFilter[], state: TableFilterState): number {
  return filters.reduce((n, f) => (isFilterActive(f.type, state[f.key]) ? n + 1 : n), 0)
}

// Comparable substrings of an ISO-ish value (both row + filter sliced the same way, so lexical compare
// works). `date` → day, `dateTime` → to the minute, `time` → HH:mm of the time part (after a `T`, if any).
const datePart = (s: string) => s.slice(0, 10) // YYYY-MM-DD
const dateTimePart = (s: string) => s.slice(0, 16) // YYYY-MM-DDTHH:mm
const timePart = (s: string) => (s.includes('T') ? s.slice(s.indexOf('T') + 1) : s).slice(0, 5) // HH:mm

/** Does one row's cell value match one active filter? */
function matchOne(type: TableFilterType, cell: unknown, value: TableFilterValue): boolean {
  const s = String(cell ?? '')
  switch (type) {
    case 'text':
      return s.toLowerCase().includes(String(value).toLowerCase())
    case 'number':
      return Number(cell) === value
    case 'numberRange':
    case 'numberRangeSlider': {
      const [min, max] = value as [number | null, number | null]
      const n = Number(cell)
      return (min == null || n >= min) && (max == null || n <= max)
    }
    case 'select':
      return s === value
    case 'multiSelect':
      return (value as string[]).includes(s)
    case 'boolean':
      return Boolean(cell) === value
    case 'date':
      return datePart(s) === datePart(String(value))
    case 'dateTime':
      return dateTimePart(s) === dateTimePart(String(value))
    case 'time':
      return timePart(s) === timePart(String(value))
    case 'dateRange':
    case 'dateTimeRange': {
      const part = type === 'dateRange' ? datePart : dateTimePart
      const [from, to] = value as [string, string]
      const d = part(s) // ISO strings compare lexicographically at the same precision
      return (!from || d >= part(from)) && (!to || d <= part(to))
    }
    case 'timeRange': {
      const [from, to] = value as [string, string]
      const t = timePart(s)
      return (!from || t >= timePart(from)) && (!to || t <= timePart(to))
    }
    default:
      return true
  }
}

/**
 * Filter rows client-side against the active filter values (local mode). A row is kept only when it matches
 * **every** active filter (AND). Filters that aren't set are skipped, so an empty state returns all rows.
 * Pure — no React, no mutation.
 */
export function applyFilters<T>(rows: T[], filters: TableFilter[], state: TableFilterState): T[] {
  const active = filters.filter((f) => isFilterActive(f.type, state[f.key]))
  if (active.length === 0) return rows
  return rows.filter((row) =>
    active.every((f) => matchOne(f.type, (row as Record<string, unknown>)[f.key], state[f.key]!)),
  )
}
