import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Chip } from './Chip'

describe('Chip', () => {
  it('renders its label and is non-interactive by default', () => {
    render(<Chip>Tag</Chip>)
    const chip = screen.getByText('Tag').parentElement as HTMLElement
    expect(chip).toHaveClass('filled') // default variant
    expect(chip).not.toHaveAttribute('role', 'button')
    expect(chip).not.toHaveAttribute('tabindex')
  })

  it('applies variant/size and the --tz-btn-rgb tint', () => {
    const { container } = render(
      <Chip variant="contained" color="success" size="lg">
        X
      </Chip>,
    )
    const chip = container.firstElementChild as HTMLElement
    expect(chip).toHaveClass('contained')
    expect(chip).toHaveClass('lg')
    expect(chip.style.getPropertyValue('--tz-btn-rgb')).toBe('var(--tz-color-success-rgb)')
  })

  it('becomes a button and fires onClick when clickable (mouse + keyboard)', () => {
    const onClick = vi.fn()
    render(
      <Chip clickable onClick={onClick}>
        Click
      </Chip>,
    )
    const chip = screen.getByRole('button', { name: 'Click' })
    expect(chip).toHaveAttribute('tabindex', '0')
    fireEvent.click(chip)
    fireEvent.keyDown(chip, { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(2) // click + Enter (which dispatches a click)
  })

  it('renders a delete button that calls onDelete without triggering onClick', () => {
    const onDelete = vi.fn()
    const onClick = vi.fn()
    render(
      <Chip clickable onClick={onClick} onDelete={onDelete}>
        Removable
      </Chip>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('disables interaction when disabled', () => {
    render(
      <Chip clickable disabled>
        Off
      </Chip>,
    )
    const chip = screen.getByText('Off').parentElement as HTMLElement
    expect(chip).toHaveClass('disabled')
    expect(chip).toHaveAttribute('aria-disabled', 'true')
    expect(chip).not.toHaveAttribute('role', 'button') // not interactive while disabled
  })
})
