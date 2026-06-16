import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Popover } from './Popover'

describe('Popover', () => {
  it('is closed initially and opens on trigger click', () => {
    render(
      <Popover trigger={<button>Open</button>}>
        <p>Panel body</p>
      </Popover>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    const trigger = screen.getByRole('button', { name: 'Open' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Panel body')).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes on a second trigger click', () => {
    render(<Popover trigger={<button>Open</button>}>body</Popover>)
    const trigger = screen.getByRole('button', { name: 'Open' })
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(trigger)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes on Escape', () => {
    render(<Popover trigger={<button>Open</button>}>body</Popover>)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('labels the panel with ariaLabel and wires aria-controls', () => {
    render(
      <Popover trigger={<button>Open</button>} ariaLabel="Filters">
        body
      </Popover>,
    )
    const trigger = screen.getByRole('button', { name: 'Open' })
    fireEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    expect(trigger.getAttribute('aria-controls')).toBe(dialog.id)
  })

  it('does not open when disabled', () => {
    render(
      <Popover trigger={<button>Open</button>} disabled>
        body
      </Popover>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('honors a controlled open prop + onOpenChange', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Popover trigger={<button>Open</button>} open={false} onOpenChange={onOpenChange}>
        body
      </Popover>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('dialog')).toBeNull() // controlled — parent didn't flip it

    rerender(
      <Popover trigger={<button>Open</button>} open onOpenChange={onOpenChange}>
        body
      </Popover>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('preserves the trigger original onClick', () => {
    const onClick = vi.fn()
    render(<Popover trigger={<button onClick={onClick}>Open</button>}>body</Popover>)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
