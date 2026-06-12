import { createRef, useRef, type ReactNode, type Ref } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FloatingPanel, type FloatingPanelProps } from './FloatingPanel'

type HarnessProps = Omit<FloatingPanelProps, 'triggerRef' | 'children'> & {
  forwardedRef?: Ref<HTMLDivElement>
  children?: ReactNode
}

// mount a real trigger so the panel actually positions (and becomes visible) in jsdom
function Harness({ forwardedRef, children, ...props }: HarnessProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={triggerRef}>Trigger</button>
      <FloatingPanel ref={forwardedRef} triggerRef={triggerRef} {...props}>
        {children ?? <span>Body</span>}
      </FloatingPanel>
    </>
  )
}

describe('FloatingPanel', () => {
  it('renders nothing while closed', () => {
    render(<Harness open={false} onClose={vi.fn()} />)
    expect(screen.queryByText('Body')).toBeNull()
  })

  it('portals an open panel to the body with the given role + label', () => {
    render(<Harness open onClose={vi.fn()} role="dialog" ariaLabel="Picker" />)
    const panel = screen.getByRole('dialog', { name: 'Picker' })
    expect(panel).toBeInTheDocument()
    expect(document.body.contains(panel)).toBe(true) // portaled to <body>
  })

  it('marks a focus-trapping dialog aria-modal (and a non-trapping one not)', () => {
    const { rerender } = render(
      <Harness open onClose={vi.fn()} role="dialog" ariaLabel="P" trapFocus />,
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    rerender(<Harness open onClose={vi.fn()} role="dialog" ariaLabel="P" />)
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal')
  })

  it('requests close (refocus) on Escape', () => {
    const onClose = vi.fn()
    render(<Harness open onClose={onClose} role="dialog" ariaLabel="P" />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledWith(true)
  })

  it('forwards the ref to the panel element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Harness open onClose={vi.fn()} role="dialog" ariaLabel="P" forwardedRef={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})
