import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { UserCard } from './UserCard'

describe('UserCard', () => {
  it('renders the name, email, and avatar initials', () => {
    render(<UserCard name="David Savaneli" email="d.savaneli@techzy.app" />)
    expect(screen.getByText('David Savaneli')).toBeInTheDocument()
    expect(screen.getByText('d.savaneli@techzy.app')).toBeInTheDocument()
    // Avatar derives initials from the name
    expect(screen.getByText('DS')).toBeInTheDocument()
  })

  it('shows a Sign out button that fires onLogout, only when onLogout is given', () => {
    const onLogout = vi.fn()
    const { rerender } = render(<UserCard name="David" onLogout={onLogout} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
    rerender(<UserCard name="David" />)
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull()
  })

  it('uses a custom logoutLabel', () => {
    render(<UserCard name="David" logoutLabel="Log out" onLogout={() => {}} />)
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
  })

  it('renders extra children between the identity row and the button', () => {
    render(
      <UserCard name="David" onLogout={() => {}}>
        <a href="/settings">Settings</a>
      </UserCard>,
    )
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
  })

  it('tints the avatar via the color prop', () => {
    const { container } = render(<UserCard name="David" color="success" />)
    // Avatar sets the --tz-btn-rgb inline var from color
    const styled = container.querySelector('[style*="--tz-btn-rgb"]')
    expect(styled?.getAttribute('style')).toContain('--tz-btn-rgb: var(--tz-color-success-rgb)')
  })

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<UserCard name="David" ref={ref} />)
    expect(ref.current?.tagName).toBe('DIV')
  })
})
