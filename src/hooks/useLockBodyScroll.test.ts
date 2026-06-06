import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useLockBodyScroll } from './useLockBodyScroll'

afterEach(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})

describe('useLockBodyScroll', () => {
  it('locks body overflow while locked, restoring the prior value on unlock', () => {
    document.body.style.overflow = 'auto'
    const { rerender } = renderHook(({ locked }) => useLockBodyScroll(locked), {
      initialProps: { locked: true },
    })
    expect(document.body.style.overflow).toBe('clip')
    rerender({ locked: false })
    expect(document.body.style.overflow).toBe('auto')
  })

  it('restores on unmount', () => {
    document.body.style.overflow = 'scroll'
    const { unmount } = renderHook(() => useLockBodyScroll(true))
    expect(document.body.style.overflow).toBe('clip')
    unmount()
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('does nothing when not locked', () => {
    document.body.style.overflow = 'scroll'
    renderHook(() => useLockBodyScroll(false))
    expect(document.body.style.overflow).toBe('scroll')
  })
})
