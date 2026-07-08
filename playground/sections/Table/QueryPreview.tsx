/* The live query-string preview shared by the query-format demo pages — shows the exact query the table
   builds from its `queryMapping`, updating as you sort / paginate / search. Playground-only. */
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
      GET {path}?{query || '…'}
    </code>
  )
}
