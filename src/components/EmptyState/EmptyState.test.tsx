import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the default title and a leading icon', () => {
    const { container } = render(<EmptyState />)
    expect(screen.getByText('No Results Found')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders a custom title, description, and action', () => {
    render(
      <EmptyState
        title="No users yet"
        description="Invite your first teammate to get started."
        action={<button>Add User</button>}
      />,
    )
    expect(screen.getByText('No users yet')).toBeInTheDocument()
    expect(screen.getByText('Invite your first teammate to get started.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument()
  })

  it('hides the icon with icon={false}', () => {
    const { container } = render(<EmptyState icon={false} />)
    expect(container.querySelector('svg')).toBeNull()
  })

  it('applies the size class', () => {
    const { container } = render(<EmptyState size="lg" />)
    expect(container.firstChild).toHaveClass('lg')
  })

  it('patterns by default and drops it with pattern={false}', () => {
    const { container, rerender } = render(<EmptyState />)
    expect(container.firstChild).toHaveClass('pattern')
    rerender(<EmptyState pattern={false} />)
    expect(container.firstChild).not.toHaveClass('pattern')
  })

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<EmptyState ref={ref} />)
    expect(ref.current?.tagName).toBe('DIV')
  })
})
