import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMediaQuery } from './useMediaQuery'

const originalMatchMedia = window.matchMedia

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

// install a controllable window.matchMedia stub (jsdom doesn't implement it) and return a setter that
// flips `matches` and notifies subscribers, mimicking a viewport crossing the breakpoint.
function stubMatchMedia(initial: boolean) {
  let listeners: Array<() => void> = []
  const mql = {
    matches: initial,
    media: '',
    onchange: null,
    addEventListener: (_: string, cb: () => void) => listeners.push(cb),
    removeEventListener: (_: string, cb: () => void) => {
      listeners = listeners.filter((l) => l !== cb)
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia
  return (next: boolean) => {
    mql.matches = next
    listeners.forEach((l) => l())
  }
}

describe('useMediaQuery', () => {
  it('returns the current match state on first render (no flash)', () => {
    stubMatchMedia(true)
    const { result } = renderHook(() => useMediaQuery('(max-width: 640px)'))
    expect(result.current).toBe(true)
  })

  it('updates when the media query flips', () => {
    const setMatches = stubMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery('(max-width: 640px)'))
    expect(result.current).toBe(false)
    act(() => setMatches(true))
    expect(result.current).toBe(true)
    act(() => setMatches(false))
    expect(result.current).toBe(false)
  })

  it('returns false when matchMedia is unavailable (SSR / older env)', () => {
    // @ts-expect-error simulate an environment without matchMedia
    delete window.matchMedia
    const { result } = renderHook(() => useMediaQuery('(max-width: 640px)'))
    expect(result.current).toBe(false)
  })

  it('cleans up its listener on unmount', () => {
    const removeSpy = vi.fn()
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addEventListener: () => {},
      removeEventListener: removeSpy,
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as typeof window.matchMedia
    const { unmount } = renderHook(() => useMediaQuery('(max-width: 640px)'))
    unmount()
    expect(removeSpy).toHaveBeenCalled()
  })
})
