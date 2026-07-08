// CSV export for the Table — a pure serializer (`toCsv`) + a DOM download (`downloadCsv`). In-house (no
// dependency): CSV is a few lines, and the library's policy is to keep simple things dep-free. Internal to
// the Table (not a public subpath).

/** A CSV column: a header cell + a value accessor per row. */
export interface CsvColumn<T> {
  header: string
  value: (row: T, index: number) => unknown
}

/** Quote a field only when it contains a comma, quote, or newline; embedded quotes are doubled (RFC 4180). */
function escapeCsv(value: unknown): string {
  if (value == null) return ''
  const s = String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Serialize rows to a CSV string — a header row from the columns, then one CRLF-separated line per row.
 * Pure (no DOM), so it's unit-testable and reusable.
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsv(c.header)).join(',')
  const body = rows
    .map((row, i) => columns.map((c) => escapeCsv(c.value(row, i))).join(','))
    .join('\r\n')
  return body ? `${header}\r\n${body}` : header
}

// UTF-8 byte-order mark (U+FEFF) — prepended so Excel opens non-ASCII CSV text in the right encoding.
const BOM = String.fromCharCode(0xfeff)

/**
 * Trigger a client-side download of a CSV string as `<filename>.csv`. Prepends a UTF-8 BOM so Excel opens
 * non-ASCII text correctly. DOM side-effect (Blob + object URL + a transient `<a>`).
 */
export function downloadCsv(filename: string, csv: string): void {
  const name = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
