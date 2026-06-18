import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Alert } from './Alert'

describe('Alert', () => {
  it('renders its message with role="alert"', () => {
    render(<Alert>Heads up</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Heads up')
  })

  it('applies the variant class and the color tint var', () => {
    render(
      <Alert variant="outlined" color="success">
        ok
      </Alert>,
    )
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('outlined')
    expect(alert.style.getPropertyValue('--tz-btn-rgb')).toBe('var(--tz-color-success-rgb)')
  })

  it('renders a leading icon by default and hides it with icon={false}', () => {
    const { rerender } = render(<Alert>with icon</Alert>)
    expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument()

    rerender(<Alert icon={false}>no icon</Alert>)
    expect(screen.getByRole('alert').querySelector('svg')).toBeNull()
  })

  it('renders an action slot', () => {
    render(<Alert action={<button>Undo</button>}>saved</Alert>)
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
  })

  it('shows a close button only when onClose is given, and calls it', () => {
    const onClose = vi.fn()
    const { rerender } = render(<Alert>no close</Alert>)
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()

    rerender(<Alert onClose={onClose}>closable</Alert>)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('uses a custom close label', () => {
    render(
      <Alert onClose={() => {}} closeLabel="Dismiss">
        x
      </Alert>,
    )
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
  })

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Alert ref={ref}>x</Alert>)
    expect(ref.current).toHaveAttribute('role', 'alert')
  })
})
