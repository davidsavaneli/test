import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Col, type SelectOption } from '../src'

/** Shared demo vocab so every section exercises the same axes. */
export const VARIANTS = ['contained', 'filled', 'outlined', 'text'] as const
export const COLORS = [
  'primary',
  'secondary',
  'brand',
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

/**
 * Demo helper for **server-side search**: debounces the query (300ms) and fetches matching countries
 * from the free REST Countries API, exposing `{ options, loading, onSearch }` to feed a
 * `Select`/`MultiSelect` via `onSearchChange` + `loading`. A request id guards against out-of-order
 * responses. Playground-only.
 */
export function useCountrySearch() {
  const [options, setOptions] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const reqId = useRef(0)

  const onSearch = useCallback((query: string) => {
    window.clearTimeout(timer.current)
    const q = query.trim()
    if (!q) {
      setOptions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const id = ++reqId.current
    timer.current = window.setTimeout(() => {
      fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(q)}?fields=name,cca3`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data: Array<{ cca3: string; name: { common: string } }>) => {
          if (id !== reqId.current) return // a newer query superseded this one
          setOptions(
            (Array.isArray(data) ? data : [])
              .map((c) => ({ value: c.cca3, label: c.name.common }))
              .sort((a, b) => a.label.localeCompare(b.label))
              .slice(0, 25),
          )
          setLoading(false)
        })
        .catch(() => {
          if (id !== reqId.current) return
          setOptions([])
          setLoading(false)
        })
    }, 300)
  }, [])

  return { options, loading, onSearch }
}

/** Labeled sub-group inside a Section. */
export function Block({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: ReactNode
}) {
  return (
    <Col gap={12}>
      <Col gap={2}>
        <span
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}
        >
          {label}
        </span>
        {description && (
          <span style={{ fontSize: 12, opacity: 0.65, fontWeight: 400 }}>{description}</span>
        )}
      </Col>
      {children}
    </Col>
  )
}
