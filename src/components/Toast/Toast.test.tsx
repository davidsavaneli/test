import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Toaster } from './Toaster'
import { getToasts, removeToast, toast } from './toastStore'

// the store is a module singleton — clear it between tests
afterEach(() => {
  for (const t of getToasts().slice()) removeToast(t.id)
})

describe('toast store', () => {
  it('adds a toast with the method color and returns its id', () => {
    const id = toast.success('Saved')
    const items = getToasts()
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ id, color: 'success', open: true, message: 'Saved' })
  })

  it('marks a toast closing on dismiss(id) and all on dismiss()', () => {
    const a = toast.error('A')
    toast.info('B')
    toast.dismiss(a)
    expect(getToasts().find((t) => t.id === a)?.open).toBe(false)

    toast.dismiss()
    expect(getToasts().every((t) => !t.open)).toBe(true)
  })

  it('reuses an explicit id (updates instead of stacking)', () => {
    toast('First', { id: 'sticky' })
    toast.warning('Second', { id: 'sticky' })
    const items = getToasts()
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ id: 'sticky', color: 'warning', message: 'Second' })
  })
})

describe('Toaster', () => {
  it('renders nothing while there are no toasts', () => {
    const { container } = render(<Toaster />)
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('renders a toast pushed through the imperative API', () => {
    render(<Toaster />)
    act(() => {
      toast.success('Profile saved')
    })
    expect(screen.getByText('Profile saved')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('removes a toast after its close button + exit animation', () => {
    vi.useFakeTimers()
    try {
      render(<Toaster />)
      act(() => {
        toast.info('Bye')
      })
      expect(screen.getByText('Bye')).toBeInTheDocument()

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Close' }))
      })
      // closing → exit animation window, then removed
      act(() => {
        vi.advanceTimersByTime(350)
      })
      expect(screen.queryByText('Bye')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('auto-dismisses after the duration elapses', () => {
    vi.useFakeTimers()
    try {
      render(<Toaster duration={1000} />)
      act(() => {
        toast('Temporary')
      })
      expect(screen.getByText('Temporary')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(1000) // auto-dismiss fires → closing
      })
      act(() => {
        vi.advanceTimersByTime(350) // exit animation → removed
      })
      expect(screen.queryByText('Temporary')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})
