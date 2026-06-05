import type { CSSProperties, ReactNode } from 'react'

/** Shared demo vocab so every section exercises the same axes. */
export const VARIANTS = ['contained', 'filled', 'outlined', 'text'] as const
export const COLORS = [
  'primary',
  'secondary',
  'tertiary',
  'dark',
  'medium',
  'light',
  'success',
  'error',
  'info',
  'warning',
] as const
export const SIZES = ['sm', 'md', 'lg'] as const

export const rowStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'center',
}

/** Capitalize the first letter — for human-readable demo labels (e.g. `primary` -> `Primary`). */
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Top-level component group (Button, Loader, …). */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 20,
          paddingBottom: 8,
          borderBottom: '1px solid var(--tz-color-border)',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Labeled sub-group inside a Section. */
export function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  )
}
