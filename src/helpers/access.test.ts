import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { getAccessKeys, hasAccess, setAccessKeys, useAccessKeys } from './access'

afterEach(() => {
  setAccessKeys([]) // reset the singleton between tests
})

describe('access store', () => {
  it('starts empty and round-trips set/get', () => {
    expect(getAccessKeys()).toEqual([])
    setAccessKeys(['Analyst', 'CodeGenerator'])
    expect(getAccessKeys()).toEqual(['Analyst', 'CodeGenerator'])
  })

  it('coerces a nullish set to []', () => {
    // @ts-expect-error — exercising the runtime guard for a nullish payload
    setAccessKeys(undefined)
    expect(getAccessKeys()).toEqual([])
  })
})

describe('hasAccess (OR semantics)', () => {
  it('treats omitted/empty roles as public', () => {
    setAccessKeys([])
    expect(hasAccess()).toBe(true)
    expect(hasAccess([])).toBe(true)
  })

  it('allows when the user has at least one matching key', () => {
    setAccessKeys(['Analyst'])
    expect(hasAccess(['Analyst', 'SystemUserManager'])).toBe(true)
  })

  it('denies when the user has none of the required keys', () => {
    setAccessKeys(['CodeGenerator'])
    expect(hasAccess(['Analyst', 'SystemUserManager'])).toBe(false)
  })

  it('denies a restricted route for a logged-out user (empty keys)', () => {
    setAccessKeys([])
    expect(hasAccess(['Analyst'])).toBe(false)
  })
})

describe('useAccessKeys (reactive)', () => {
  it('re-renders subscribers when the keys change', () => {
    const { result } = renderHook(() => useAccessKeys())
    expect(result.current).toEqual([])

    act(() => setAccessKeys(['Analyst']))
    expect(result.current).toEqual(['Analyst'])

    act(() => setAccessKeys([]))
    expect(result.current).toEqual([])
  })
})
