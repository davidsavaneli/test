import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDisclosure } from './useDisclosure'

describe('useDisclosure', () => {
  it('is closed by default', () => {
    const { result } = renderHook(() => useDisclosure())
    expect(result.current.isOpen).toBe(false)
  })

  it('respects the initial value', () => {
    const { result } = renderHook(() => useDisclosure(true))
    expect(result.current.isOpen).toBe(true)
  })

  it('open / close set the state explicitly', () => {
    const { result } = renderHook(() => useDisclosure())
    act(() => result.current.open())
    expect(result.current.isOpen).toBe(true)
    act(() => result.current.close())
    expect(result.current.isOpen).toBe(false)
  })

  it('toggle flips the state', () => {
    const { result } = renderHook(() => useDisclosure())
    act(() => result.current.toggle())
    expect(result.current.isOpen).toBe(true)
    act(() => result.current.toggle())
    expect(result.current.isOpen).toBe(false)
  })
})
