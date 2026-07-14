import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribe to a CSS media query and get whether it currently matches, re-rendering when it flips.
 * Built on `useSyncExternalStore`, so on the client the first render already has the correct value
 * (no flash), and it's **SSR-safe** — returns `false` on the server / where `matchMedia` is
 * unavailable. Use this instead of hand-rolling `window.matchMedia` + effects in a component.
 *
 * @param query - a media query string, e.g. `'(max-width: 640px)'` or `'(prefers-color-scheme: dark)'`.
 * @returns `true` while the query matches.
 *
 * @example
 * const isNarrow = useMediaQuery('(max-width: 640px)')
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onStoreChange)
      return () => mql.removeEventListener('change', onStoreChange)
    },
    [query],
  )
  const getSnapshot = () =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false
  // the server can't know the viewport — assume the query doesn't match (matches the CSR-first default)
  const getServerSnapshot = () => false
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
