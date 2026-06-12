import { type ComponentProps } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Dropdown } from './Dropdown'
import { ListItem } from '../List'

function Menu(props: Partial<ComponentProps<typeof Dropdown>> = {}) {
  return (
    <Dropdown trigger={<button>Open</button>} {...props}>
      <ListItem clickable>Profile</ListItem>
      <ListItem clickable>Settings</ListItem>
    </Dropdown>
  )
}

describe('Dropdown', () => {
  it('is closed initially and wires a11y on the trigger', () => {
    render(<Menu />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('opens on trigger click and renders the menu items', () => {
    render(<Menu />)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('toggles closed on a second trigger click', () => {
    render(<Menu />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    fireEvent.click(trigger)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.click(trigger)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('closes on Escape', () => {
    render(<Menu />)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('closes on an outside pointer down', () => {
    render(
      <div>
        <span data-testid="outside">outside</span>
        <Menu />
      </div>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.pointerDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('closes after selecting an item (closeOnSelect, default)', () => {
    render(<Menu />)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    fireEvent.click(screen.getByText('Profile'))
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('keeps the menu open on select when closeOnSelect is false', () => {
    render(<Menu closeOnSelect={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    fireEvent.click(screen.getByText('Profile'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('does not open when disabled', () => {
    render(<Menu disabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('supports controlled open + onOpenChange', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(<Menu open={false} onOpenChange={onOpenChange} />)
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    rerender(<Menu open onOpenChange={onOpenChange} />)
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('applies the size min-width class by default', () => {
    render(<Menu size="lg" defaultOpen />)
    expect(screen.getByRole('menu').parentElement).toHaveClass('lg')
  })

  it('drops the size min-width class when minWidth is false (sizes to content)', () => {
    render(<Menu size="lg" minWidth={false} defaultOpen />)
    const panel = screen.getByRole('menu').parentElement as HTMLElement
    expect(panel).toHaveClass('panel') // still the panel…
    expect(panel).not.toHaveClass('lg') // …but no size min-width
  })
})
