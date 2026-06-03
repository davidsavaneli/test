import type { ChangeEvent, FocusEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { z } from 'zod'
import { useForm } from './useForm'

const schema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Too short'),
})

const empty = { email: '', name: '' }
const valid = { email: 'a@b.com', name: 'Dave' }

const change = (value: string) =>
  ({ target: { value } }) as unknown as ChangeEvent<HTMLInputElement>
const blur = () => ({}) as unknown as FocusEvent<HTMLInputElement>

describe('useForm', () => {
  it('seeds values and hides errors before interaction (blurThenLive)', () => {
    const { result } = renderHook(() => useForm({ schema, defaultValues: empty }))
    expect(result.current.values).toEqual(empty)
    expect(result.current.isValid).toBe(false)
    expect(result.current.field('email').error).toBe(false)
    expect(result.current.field('email').helperText).toBeUndefined()
  })

  it('shows the field error after blur', () => {
    const { result } = renderHook(() => useForm({ schema, defaultValues: empty }))
    act(() => result.current.field('email').onBlur(blur()))
    expect(result.current.field('email').error).toBe(true)
    expect(result.current.field('email').helperText).toBe('Invalid email')
  })

  it('clears the error live once the field is valid', () => {
    const { result } = renderHook(() => useForm({ schema, defaultValues: empty }))
    act(() => result.current.field('email').onBlur(blur()))
    expect(result.current.field('email').error).toBe(true)
    act(() => result.current.field('email').onChange(change('a@b.com')))
    expect(result.current.field('email').error).toBe(false)
    expect(result.current.values.email).toBe('a@b.com')
  })

  it('mode "change" shows errors immediately', () => {
    const { result } = renderHook(() => useForm({ schema, defaultValues: empty, mode: 'change' }))
    expect(result.current.field('email').error).toBe(true)
  })

  it('blocks an invalid submit and reveals all errors', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useForm({ schema, defaultValues: empty, onSubmit }))
    act(() => result.current.handleSubmit())
    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.isSubmitted).toBe(true)
    expect(result.current.field('email').error).toBe(true)
    expect(result.current.field('name').error).toBe(true)
  })

  it('submits parsed values (plus helpers) when valid', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useForm({ schema, defaultValues: valid, onSubmit }))
    act(() => result.current.handleSubmit())
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(
      valid,
      expect.objectContaining({ reset: expect.any(Function) }),
    )
  })

  it('hands onSubmit a reset helper that clears the form', () => {
    const onSubmit = vi.fn((_values, helpers: { reset: () => void }) => helpers.reset())
    const { result } = renderHook(() => useForm({ schema, defaultValues: empty, onSubmit }))
    act(() => result.current.field('email').onChange(change('a@b.com')))
    act(() => result.current.field('name').onChange(change('Dave')))
    act(() => result.current.handleSubmit())
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(result.current.values).toEqual(empty) // reset() restored defaults
  })

  it('reset restores defaults and clears touched/submitted state', () => {
    const { result } = renderHook(() => useForm({ schema, defaultValues: empty }))
    act(() => result.current.field('name').onChange(change('Dave')))
    act(() => result.current.handleSubmit())
    expect(result.current.isSubmitted).toBe(true)
    act(() => result.current.reset())
    expect(result.current.values).toEqual(empty)
    expect(result.current.isSubmitted).toBe(false)
    expect(result.current.field('name').error).toBe(false)
  })
})
