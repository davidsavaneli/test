import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SpeedDial } from './SpeedDial'
import { SpeedDialAction } from './SpeedDialAction'

const ACTIONS = [
  { key: 'edit', icon: 'Edit2', label: 'Edit' },
  { key: 'copy', icon: 'Copy', label: 'Copy' },
]

/** The FAB is the button labelled by `ariaLabel`. */
const getFab = (name = 'Actions') => screen.getByRole('button', { name })

describe('SpeedDial', () => {
  it('renders a collapsed FAB with the aria-label + aria-expanded=false', () => {
    render(<SpeedDial ariaLabel="Actions" actions={ACTIONS} />)
    const fab = getFab()
    expect(fab).toHaveAttribute('aria-expanded', 'false')
    expect(fab).toHaveAttribute('aria-haspopup', 'true')
  })

  it('toggles open on FAB click (aria-expanded + actions data-open)', () => {
    render(<SpeedDial ariaLabel="Actions" actions={ACTIONS} />)
    const fab = getFab()
    const actionsBox = document.getElementById(fab.getAttribute('aria-controls')!)!
    expect(actionsBox).toHaveAttribute('data-open', 'false')

    fireEvent.click(fab)
    expect(fab).toHaveAttribute('aria-expanded', 'true')
    expect(actionsBox).toHaveAttribute('data-open', 'true')

    fireEvent.click(fab)
    expect(fab).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens on hover and closes on mouse leave', () => {
    render(<SpeedDial ariaLabel="Actions" actions={ACTIONS} />)
    const root = getFab().parentElement! // the FAB's parent is the .speedDial root
    fireEvent.mouseEnter(root)
    expect(getFab()).toHaveAttribute('aria-expanded', 'true')
    fireEvent.mouseLeave(root)
    expect(getFab()).toHaveAttribute('aria-expanded', 'false')
  })

  it('does not open on hover when openOnHover is false', () => {
    render(<SpeedDial ariaLabel="Actions" actions={ACTIONS} openOnHover={false} />)
    const root = getFab().parentElement!
    fireEvent.mouseEnter(root)
    expect(getFab()).toHaveAttribute('aria-expanded', 'false')
  })

  it('renders data-driven actions with their labels', () => {
    render(<SpeedDial ariaLabel="Actions" actions={ACTIONS} defaultOpen />)
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
  })

  it('runs an action onClick and closes the dial', () => {
    const onEdit = vi.fn()
    render(
      <SpeedDial
        ariaLabel="Actions"
        defaultOpen
        actions={[{ key: 'edit', icon: 'Edit2', label: 'Edit', onClick: onEdit }]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(getFab()).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps the dial open after an action click when closeOnActionClick is false', () => {
    render(
      <SpeedDial
        ariaLabel="Actions"
        defaultOpen
        closeOnActionClick={false}
        actions={[{ key: 'edit', icon: 'Edit2', label: 'Edit' }]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(getFab()).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes on Escape', () => {
    render(<SpeedDial ariaLabel="Actions" actions={ACTIONS} defaultOpen />)
    expect(getFab()).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(getFab()).toHaveAttribute('aria-expanded', 'false')
  })

  it('rotates the default icon while open (no openIcon)', () => {
    render(<SpeedDial ariaLabel="Actions" actions={ACTIONS} defaultOpen />)
    const iconWrap = getFab().querySelector('[class*="fabIcon"]')
    expect(iconWrap).toHaveClass('fabIconOpen')
  })

  it('honors a controlled open prop', () => {
    const { rerender } = render(
      <SpeedDial ariaLabel="Actions" actions={ACTIONS} open={false} onOpenChange={() => {}} />,
    )
    expect(getFab()).toHaveAttribute('aria-expanded', 'false')
    rerender(<SpeedDial ariaLabel="Actions" actions={ACTIONS} open onOpenChange={() => {}} />)
    expect(getFab()).toHaveAttribute('aria-expanded', 'true')
  })

  it('works with <SpeedDialAction> children', () => {
    const onShare = vi.fn()
    render(
      <SpeedDial ariaLabel="Actions" defaultOpen>
        <SpeedDialAction icon="Share" label="Share" onClick={onShare} />
      </SpeedDial>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(onShare).toHaveBeenCalledTimes(1)
  })

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<SpeedDial ariaLabel="Actions" actions={ACTIONS} ref={ref} />)
    expect(ref.current).toBe(getFab().parentElement)
  })
})
