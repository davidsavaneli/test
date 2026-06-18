import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('renders a labeled navigation with the page buttons and arrows', () => {
    render(<Pagination count={5} />)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to page 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeInTheDocument()
  })

  it('marks the current page with aria-current', () => {
    render(<Pagination count={5} defaultPage={2} />)
    expect(screen.getByRole('button', { name: 'Go to page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('button', { name: 'Go to page 3' })).not.toHaveAttribute('aria-current')
  })

  it('updates the page when uncontrolled and fires onChange', () => {
    const onChange = vi.fn()
    render(<Pagination count={5} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to page 4' }))
    expect(onChange).toHaveBeenCalledWith(4)
    expect(screen.getByRole('button', { name: 'Go to page 4' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('does not change the active page when controlled (parent owns it)', () => {
    const onChange = vi.fn()
    render(<Pagination count={5} page={2} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to page 5' }))
    expect(onChange).toHaveBeenCalledWith(5)
    // still on page 2 — the controlled value didn't move
    expect(screen.getByRole('button', { name: 'Go to page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('disables the previous arrow on the first page and the next arrow on the last', () => {
    const { rerender } = render(<Pagination count={5} page={1} />)
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Go to next page' })).not.toBeDisabled()

    rerender(<Pagination count={5} page={5} />)
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Go to previous page' })).not.toBeDisabled()
  })

  it('steps with the arrows', () => {
    const onChange = vi.fn()
    render(<Pagination count={5} defaultPage={3} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(onChange).toHaveBeenLastCalledWith(4)
    fireEvent.click(screen.getByRole('button', { name: 'Go to previous page' }))
    expect(onChange).toHaveBeenLastCalledWith(3)
  })

  it('renders first/last jump buttons only when asked', () => {
    const { rerender } = render(<Pagination count={10} page={5} />)
    expect(screen.queryByRole('button', { name: 'Go to first page' })).not.toBeInTheDocument()

    rerender(<Pagination count={10} page={5} showFirstButton showLastButton />)
    expect(screen.getByRole('button', { name: 'Go to first page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to last page' })).toBeInTheDocument()
  })

  it('sets the --tz-btn-rgb tint var from the color prop', () => {
    render(<Pagination count={3} color="primary" aria-label="Pager" />)
    const nav = screen.getByRole('navigation', { name: 'Pager' })
    expect(nav.style.getPropertyValue('--tz-btn-rgb')).toBe('var(--tz-color-primary-rgb)')
  })

  it('applies variant + size class names', () => {
    render(<Pagination count={3} variant="text" size="lg" aria-label="Pager" />)
    const nav = screen.getByRole('navigation', { name: 'Pager' })
    expect(nav).toHaveClass('text')
    expect(nav).toHaveClass('lg')
  })

  it('disables every button when disabled', () => {
    render(<Pagination count={5} defaultPage={3} disabled />)
    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled())
  })

  it('forwards the ref to the root nav', () => {
    const ref = createRef<HTMLElement>()
    render(<Pagination count={3} ref={ref} />)
    expect(ref.current?.tagName).toBe('NAV')
  })
})
