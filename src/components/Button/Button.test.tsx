import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Icon } from '../Icon'
import { Button } from './Button'

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('applies variant, size and modifier classes', () => {
    render(
      <Button variant="outlined" size="lg" fullWidth rounded>
        Go
      </Button>,
    )
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('outlined')
    expect(btn.className).toContain('lg')
    expect(btn.className).toContain('fullWidth')
    expect(btn.className).toContain('rounded')
  })

  it('sets the tint CSS var from the `color` prop', () => {
    render(<Button color="error">X</Button>)
    expect(screen.getByRole('button').style.getPropertyValue('--tz-btn-rgb')).toBe(
      'var(--tz-color-error-rgb)',
    )
  })

  it('sizes a start/end icon to match the button (explicit icon size wins)', () => {
    const { rerender } = render(
      <Button size="lg" startIcon={<Icon name="Add" data-testid="icon" />}>
        Go
      </Button>,
    )
    expect(screen.getByTestId('icon').getAttribute('class')).toContain('lg')
    rerender(
      <Button size="lg" startIcon={<Icon name="Add" size="sm" data-testid="icon" />}>
        Go
      </Button>,
    )
    expect(screen.getByTestId('icon').getAttribute('class')).toContain('sm')
  })

  it('is disabled when `disabled`', () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        X
      </Button>,
    )
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('fires onClick when enabled', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>X</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('while loading: disabled, aria-busy, shows the loader, keeps the label', () => {
    render(
      <Button loading startIcon={<span data-testid="start" />}>
        Submit
      </Button>,
    )
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument() // the Loader (aria-hidden; aria-busy carries the a11y signal)
    expect(screen.queryByTestId('start')).not.toBeInTheDocument() // start icon swapped out
    expect(btn).toHaveTextContent('Submit')
  })

  it('puts the loader in the end slot when only `endIcon` is set', () => {
    render(
      <Button loading endIcon={<span data-testid="end" />}>
        Next
      </Button>,
    )
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
    expect(screen.queryByTestId('end')).not.toBeInTheDocument()
  })

  it('trails the loader after the label (right) on a plain button with no icons', () => {
    render(<Button loading>Sign In</Button>)
    const btn = screen.getByRole('button')
    const loader = screen.getByRole('status', { hidden: true })
    expect(btn.lastElementChild).toBe(loader) // loader sits after the label, not before
  })

  it('forwards the ref to the button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>X</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})
