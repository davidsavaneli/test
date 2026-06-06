import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Icon } from '../Icon'
import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('renders its child icon with the accessible name', () => {
    render(
      <IconButton aria-label="Add item">
        <Icon name="Add" />
      </IconButton>,
    )
    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument()
  })

  it('applies variant, size and rounded classes', () => {
    render(
      <IconButton aria-label="x" variant="filled" size="sm" rounded>
        <Icon name="Add" />
      </IconButton>,
    )
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('filled')
    expect(btn.className).toContain('sm')
    expect(btn.className).toContain('rounded')
  })

  it('sizes the child icon to match the button (explicit icon size wins)', () => {
    const { rerender } = render(
      <IconButton aria-label="x" size="lg">
        <Icon name="Add" data-testid="icon" />
      </IconButton>,
    )
    expect(screen.getByTestId('icon').getAttribute('class')).toContain('lg')
    rerender(
      <IconButton aria-label="x" size="lg">
        <Icon name="Add" size="sm" data-testid="icon" />
      </IconButton>,
    )
    expect(screen.getByTestId('icon').getAttribute('class')).toContain('sm')
  })

  it('is disabled and shows the loader while loading', () => {
    render(
      <IconButton aria-label="x" loading>
        <Icon name="Add" />
      </IconButton>,
    )
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
  })

  describe('nonClickable', () => {
    it('keeps the normal look (not disabled) but is non-interactive', () => {
      render(
        <IconButton aria-label="x" nonClickable>
          <Icon name="Add" />
        </IconButton>,
      )
      const btn = screen.getByRole('button')
      expect(btn).not.toBeDisabled() // crucially NOT dimmed/disabled
      expect(btn).toHaveAttribute('aria-disabled', 'true')
      expect(btn).toHaveAttribute('tabindex', '-1')
      expect(btn.className).toContain('nonClickable')
      expect(btn.className).not.toContain('disabled')
    })
  })

  it('fires onClick when interactive', () => {
    const onClick = vi.fn()
    render(
      <IconButton aria-label="x" onClick={onClick}>
        <Icon name="Add" />
      </IconButton>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('forwards the ref to the button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(
      <IconButton aria-label="x" ref={ref}>
        <Icon name="Add" />
      </IconButton>,
    )
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})
