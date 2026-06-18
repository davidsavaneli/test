import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hidden">
        body
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders a labelled modal dialog when open', () => {
    render(
      <Modal open onClose={() => {}} title="Edit item">
        <p>Body content</p>
      </Modal>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Edit item' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })

  it('falls back to ariaLabel when there is no title', () => {
    render(
      <Modal open onClose={() => {}} ariaLabel="Settings">
        x
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
  })

  it('applies the size class', () => {
    render(
      <Modal open onClose={() => {}} size="lg" title="Big">
        x
      </Modal>,
    )
    expect(screen.getByRole('dialog')).toHaveClass('lg')
  })

  it('calls onClose from the close button', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Title">
        x
      </Modal>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('hides the close button when showCloseButton is false', () => {
    render(
      <Modal open onClose={() => {}} title="Title" showCloseButton={false}>
        x
      </Modal>,
    )
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  it('closes on Escape, unless closeOnEscape is false', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <Modal open onClose={onClose} title="Title">
        x
      </Modal>,
    )
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)

    rerender(
      <Modal open onClose={onClose} title="Title" closeOnEscape={false}>
        x
      </Modal>,
    )
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on backdrop click but not on a click inside the dialog', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Title">
        x
      </Modal>,
    )
    const dialog = screen.getByRole('dialog')
    const overlay = dialog.parentElement as HTMLElement

    // click inside the dialog → no close
    fireEvent.mouseDown(dialog)
    fireEvent.click(dialog)
    expect(onClose).not.toHaveBeenCalled()

    // click on the backdrop → close
    fireEvent.mouseDown(overlay)
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close on backdrop click when closeOnBackdrop is false', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Title" closeOnBackdrop={false}>
        x
      </Modal>,
    )
    const overlay = screen.getByRole('dialog').parentElement as HTMLElement
    fireEvent.mouseDown(overlay)
    fireEvent.click(overlay)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders a footer slot', () => {
    render(
      <Modal open onClose={() => {}} title="Title" footer={<button>Save</button>}>
        x
      </Modal>,
    )
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('forwards the ref to the dialog element', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <Modal open onClose={() => {}} ref={ref} title="Title">
        x
      </Modal>,
    )
    expect(ref.current).toHaveAttribute('role', 'dialog')
  })

  it('locks body scroll while open', () => {
    const { rerender } = render(
      <Modal open onClose={() => {}} title="Title">
        x
      </Modal>,
    )
    expect(document.documentElement.style.overflow).toBe('clip')
    rerender(
      <Modal open={false} onClose={() => {}} title="Title">
        x
      </Modal>,
    )
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('focuses the first body field on open when the body has focusables', () => {
    render(
      <Modal open onClose={() => {}} title="Edit" footer={<button>Save</button>}>
        <input aria-label="First field" />
        <input aria-label="Second field" />
      </Modal>,
    )
    expect(document.activeElement).toBe(screen.getByLabelText('First field'))
  })

  it('focuses the first footer action for a body-less confirm dialog (not the inert panel)', () => {
    render(
      <Modal
        open
        onClose={() => {}}
        title="Delete?"
        description="This cannot be undone."
        footer={
          <>
            <button>Cancel</button>
            <button>Confirm</button>
          </>
        }
      />,
    )
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }))
  })

  it('defaults placement to center', () => {
    render(
      <Modal open onClose={() => {}} title="Centered">
        x
      </Modal>,
    )
    const overlay = screen.getByRole('dialog').parentElement as HTMLElement
    expect(overlay).toHaveAttribute('data-placement', 'center')
  })

  it('renders as a side drawer with data-placement on the overlay', () => {
    render(
      <Modal open onClose={() => {}} placement="left" title="Filters">
        x
      </Modal>,
    )
    const overlay = screen.getByRole('dialog').parentElement as HTMLElement
    expect(overlay).toHaveAttribute('data-placement', 'left')
  })

  it('forces inside scroll for a side drawer, ignoring scrollBehavior', () => {
    render(
      <Modal open onClose={() => {}} placement="right" scrollBehavior="outside" title="Filters">
        x
      </Modal>,
    )
    const overlay = screen.getByRole('dialog').parentElement as HTMLElement
    expect(overlay).toHaveAttribute('data-placement', 'right')
    expect(overlay).toHaveAttribute('data-scroll', 'inside')
  })
})
