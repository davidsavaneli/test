import type { ReactNode } from 'react'
import { Col } from '../src'

/** Shared demo vocab so every section exercises the same axes. */
export const VARIANTS = ['contained', 'filled', 'outlined', 'text'] as const
export const COLORS = [
  'primary',
  'secondary',
  'dark',
  'medium',
  'light',
  'success',
  'error',
  'info',
  'warning',
] as const
export const SIZES = ['sm', 'md', 'lg'] as const

/** Capitalize the first letter — for human-readable demo labels (e.g. `primary` -> `Primary`). */
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Top-level wrapper for a page's demo blocks. No title — the admin shell already renders the page
 * title (from the route's `staticData.name`) above the `PageLayout` card.
 */
export function Section({ children }: { children: ReactNode }) {
  return <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>{children}</section>
}

/** Labeled sub-group inside a Section. */
export function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Col gap={12}>
      <span
        style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}
      >
        {label}
      </span>
      {children}
    </Col>
  )
}
