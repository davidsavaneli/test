import { createRef } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RemoveDialog } from './RemoveDialog'

describe('RemoveDialog', () => {
  it('renders the default remove confirmation when open', () => {
    render(<RemoveDialog open onClose={() => {}} onConfirm={() => {}} />)
    expect(screen.getByRole('dialog', { name: 'Remove' })).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(<RemoveDialog open={false} onClose={() => {}} onConfirm={() => {}} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('accepts custom title / message / labels', () => {
    render(
      <RemoveDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete user?"
        message="This removes Jane."
        confirmLabel="Remove"
        cancelLabel="Keep"
      />,
    )
    expect(screen.getByRole('dialog', { name: 'Delete user?' })).toBeInTheDocument()
    expect(screen.getByText('This removes Jane.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument()
  })

  it('calls onClose from Cancel', () => {
    const onClose = vi.fn()
    render(<RemoveDialog open onClose={onClose} onConfirm={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm then auto-closes on Delete', async () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    render(<RemoveDialog open onClose={onClose} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('shows a loader and locks Cancel while an async confirm is pending, then auto-closes', async () => {
    let resolveConfirm: () => void = () => {}
    const onConfirm = vi.fn(() => new Promise<void>((r) => (resolveConfirm = r)))
    const onClose = vi.fn()
    render(<RemoveDialog open onClose={onClose} onConfirm={onConfirm} />)

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    // while the promise is pending the dialog locks: Cancel is disabled
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled())
    expect(onClose).not.toHaveBeenCalled()

    resolveConfirm()
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('forwards the ref to the dialog element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<RemoveDialog open onClose={() => {}} onConfirm={() => {}} ref={ref} />)
    expect(ref.current).toHaveAttribute('role', 'dialog')
  })
})
