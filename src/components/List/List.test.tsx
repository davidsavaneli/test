import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { List } from './List'
import { ListItem } from './ListItem'

describe('ListItem', () => {
  it('renders label, icon, description and trailing', () => {
    render(
      <ListItem icon="Setting2" description="Workspace" trailing={<span>⌘S</span>}>
        Settings
      </ListItem>,
    )
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Workspace')).toBeInTheDocument()
    expect(screen.getByText('⌘S')).toBeInTheDocument()
    expect(document.querySelector('svg')).toBeInTheDocument() // the icon
  })

  it('applies the size class and defaults to md', () => {
    const { container, rerender } = render(<ListItem>Item</ListItem>)
    expect(container.firstElementChild).toHaveClass('md')
    rerender(<ListItem size="lg">Item</ListItem>)
    expect(container.firstElementChild).toHaveClass('lg')
  })

  it('marks the selected row with a class and aria-current', () => {
    const { container } = render(<ListItem selected>Item</ListItem>)
    expect(container.firstElementChild).toHaveClass('selected')
    expect(container.firstElementChild).toHaveAttribute('aria-current', 'true')
  })

  it('becomes a button-role row with keyboard support when clickable', () => {
    const onClick = vi.fn()
    render(
      <ListItem clickable onClick={onClick}>
        Item
      </ListItem>,
    )
    const row = screen.getByRole('button', { name: 'Item' })
    expect(row).toHaveAttribute('tabindex', '0')
    fireEvent.click(row)
    fireEvent.keyDown(row, { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(2) // mouse click + Enter → .click()
  })

  it('renders as a custom element via `as` (no button-role shim)', () => {
    render(
      <ListItem as="a" href="/x" clickable>
        Link
      </ListItem>,
    )
    const link = screen.getByRole('link', { name: 'Link' })
    expect(link).toHaveAttribute('href', '/x')
    expect(link).not.toHaveAttribute('role', 'button')
  })

  it('inerts the row when disabled', () => {
    const onClick = vi.fn()
    render(
      <ListItem clickable disabled onClick={onClick}>
        Item
      </ListItem>,
    )
    const row = screen.getByText('Item').closest('[aria-disabled]') as HTMLElement
    expect(row).toHaveClass('disabled')
    expect(row).toHaveAttribute('tabindex', '-1')
  })

  it('sets the --tz-btn-rgb tint var from color', () => {
    const { container } = render(<ListItem color="success">Item</ListItem>)
    expect(
      (container.firstElementChild as HTMLElement).style.getPropertyValue('--tz-btn-rgb'),
    ).toBe('var(--tz-color-success-rgb)')
  })
})

describe('List', () => {
  it('renders a list role and its items by default', () => {
    render(
      <List>
        <ListItem>A</ListItem>
        <ListItem>B</ListItem>
      </List>,
    )
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('honors a custom role (e.g. menu)', () => {
    render(<List role="menu">x</List>)
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('provides a default size that its items inherit (item size still wins)', () => {
    render(
      <List size="sm">
        <ListItem>Inherits</ListItem>
        <ListItem size="lg">Overrides</ListItem>
      </List>,
    )
    expect(screen.getByText('Inherits').closest('div')).toHaveClass('sm')
    expect(screen.getByText('Overrides').closest('div')).toHaveClass('lg')
  })
})
