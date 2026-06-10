/**
 * Date math for the date components, on top of dayjs (an optional peer dep). All calendar math runs
 * in **UTC** (via the `utc` plugin) so a calendar date never drifts with the viewer's timezone; the
 * public value is a plain ISO date string `'YYYY-MM-DD'`. Typed input is parsed strictly against a
 * display `format` (via the `customParseFormat` plugin).
 */
import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(utc)
dayjs.extend(customParseFormat)

export type { Dayjs }

/** The canonical value format (timezone-agnostic calendar date). */
export const ISO = 'YYYY-MM-DD'

/** Parse an ISO `'YYYY-MM-DD'` value (UTC-anchored) into a dayjs, or `null` if empty/invalid. */
export function parseISO(value?: string | null): Dayjs | null {
  if (!value) return null
  const d = dayjs.utc(value, ISO, true)
  return d.isValid() ? d : null
}

/** Parse a user-typed string strictly against a display `format` (UTC), or `null`. */
export function parseInput(text: string, format: string): Dayjs | null {
  const d = dayjs.utc(text, format, true)
  return d.isValid() ? d : null
}

export const toISO = (d: Dayjs): string => d.format(ISO)

/**
 * Parse an incoming **value** leniently (UTC): the declared `valueFormat` first (strict), then any
 * ISO-8601 string — so a richer backend datetime such as `'2026-06-10T09:35:49.6134342'` is still
 * accepted (dayjs caps the fractional seconds at milliseconds). Returns `null` when empty/unparseable.
 */
export function parseValue(value: string | null | undefined, valueFormat: string): Dayjs | null {
  if (!value) return null
  const strict = dayjs.utc(value, valueFormat, true)
  if (strict.isValid()) return strict
  const lenient = dayjs.utc(value)
  return lenient.isValid() ? lenient : null
}

/**
 * Format a date to the I/O `valueFormat`, anchored to the **start of its UTC day** — a date picker
 * carries no time-of-day, so the emitted time is `00:00:00` (e.g. `valueFormat='YYYY-MM-DDTHH:mm:ss'`
 * → `'2026-06-10T00:00:00'`).
 */
export const formatValue = (d: Dayjs, valueFormat: string): string =>
  d.startOf('day').format(valueFormat)

/** The viewer's local calendar date, anchored to UTC midnight for stable, drift-free math. */
export const today = (): Dayjs => dayjs.utc(dayjs().format(ISO), ISO)

/** Inclusive numeric range `[start, end]` stepped by `step` — for the time-picker columns. A
 *  non-positive `step` returns `[]` rather than looping forever. */
export function range(start: number, end: number, step = 1): number[] {
  if (step <= 0) return []
  const out: number[] = []
  for (let v = start; v <= end; v += step) out.push(v)
  return out
}

/** Zero-pads a number to two digits (`9` → `'09'`) for time-column display. */
export const pad2 = (n: number): string => String(n).padStart(2, '0')

/**
 * Build an input mask from a date/time format: numeric tokens (`D M Y H h m s`) → `9` (digit slots),
 * the **uppercase** meridiem token `A` → `AA` and the **lowercase** `a` → `aa` (two letter slots for
 * `AM`/`PM`, matching dayjs's case-sensitive strict parse), everything else literal.
 * `'DD/MM/YYYY'` → `'99/99/9999'`; `'DD/MM/YYYY hh:mm A'` → `'99/99/9999 99:99 AA'`.
 */
export const maskFromFormat = (format: string): string =>
  format
    .replace(/[DMYHhms]/g, '9')
    .replace(/A/g, 'AA')
    .replace(/a/g, 'aa')

const DIGIT = /[0-9]/
const ALPHA = /[A-Za-z]/

/**
 * Applies a mask to raw input: `9` = digit, `A` = letter forced upper-case, `a` = letter forced
 * lower-case (so a typed meridiem matches the format's case for dayjs), everything else a literal.
 */
export function applyMask(raw: string, mask: string): string {
  let out = ''
  let i = 0
  for (const m of mask) {
    if (m === '9') {
      while (i < raw.length && !DIGIT.test(raw[i])) i++
      if (i >= raw.length) break
      out += raw[i++]
    } else if (m === 'A' || m === 'a') {
      while (i < raw.length && !ALPHA.test(raw[i])) i++
      if (i >= raw.length) break
      out += m === 'A' ? raw[i++].toUpperCase() : raw[i++].toLowerCase()
    } else {
      if (i >= raw.length) break
      if (raw[i] === m) i++
      out += m
    }
  }
  return out
}

/** True when `d` falls outside `[min, max]` or is rejected by `disabledDate`. */
export function isDisabled(
  d: Dayjs,
  min: Dayjs | null,
  max: Dayjs | null,
  disabledDate?: (iso: string) => boolean,
): boolean {
  if (min && d.isBefore(min, 'day')) return true
  if (max && d.isAfter(max, 'day')) return true
  if (disabledDate && disabledDate(d.format(ISO))) return true
  return false
}

/** A single cell in the month grid. */
export interface CalendarDay {
  date: Dayjs
  iso: string
  /** Belongs to the month being displayed (vs. a leading/trailing day from an adjacent month). */
  inMonth: boolean
  isToday: boolean
}

/**
 * Builds a fixed 6×7 (42-cell) grid for the month containing `monthDate`, with weeks starting on
 * `weekStartsOn` (0 = Sunday … 6 = Saturday). Fixed height avoids layout shift between months.
 */
export function buildMonthGrid(monthDate: Dayjs, weekStartsOn: number): CalendarDay[] {
  const firstOfMonth = monthDate.startOf('month')
  const lead = (firstOfMonth.day() - weekStartsOn + 7) % 7
  const start = firstOfMonth.subtract(lead, 'day')
  const now = today()
  const month = monthDate.month()
  return Array.from({ length: 42 }, (_, i) => {
    const date = start.add(i, 'day')
    return {
      date,
      iso: date.format(ISO),
      inMonth: date.month() === month,
      isToday: date.isSame(now, 'day'),
    }
  })
}

/** Short weekday header labels, ordered from `weekStartsOn`. */
export function weekdayLabels(weekStartsOn: number): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    dayjs
      .utc()
      .day((weekStartsOn + i) % 7)
      .format('dd'),
  )
}

/** Full month names (`'January'…'December'`), index 0–11, for the month-picker view. */
export function monthLabels(): string[] {
  return Array.from({ length: 12 }, (_, m) => dayjs.utc().month(m).format('MMMM'))
}

/**
 * The list of selectable years for the (scrollable) year-picker view: bounded by `min`/`max` when
 * given, otherwise ±100 around `viewYear`. Always widened to include `viewYear` so the roving focus
 * has a cell to land on.
 */
export function yearList(min: Dayjs | null, max: Dayjs | null, viewYear: number): number[] {
  const start = Math.min(min ? min.year() : viewYear - 100, viewYear)
  const end = Math.max(max ? max.year() : viewYear + 100, viewYear)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}
