/* The live query-string preview shared by the query-format demo pages — shows the query the table builds
   from its `queryMapping`, updating as you sort / paginate / search / filter. Playground-only. */

// display-only: decode %2C / %3A / `+` so the preview reads cleanly (the real `state.query` sent to fetch
// stays percent-encoded — this is just for the demo).
const readable = (q: string) => {
  try {
    return decodeURIComponent(q.replace(/\+/g, ' '))
  } catch {
    return q
  }
}

export function QueryPreview({ path, query }: { path: string; query: string }) {
  return (
    <code
      style={{
        display: 'block',
        padding: '8px 12px',
        marginBottom: 16,
        borderRadius: 8,
        background: 'var(--tz-color-primary-shade100)',
        color: 'var(--tz-color-text)',
        fontSize: 13,
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}
    >
      GET {path}?{query ? readable(query) : '…'}
    </code>
  )
}
