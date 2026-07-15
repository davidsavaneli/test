import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Tooltip } from './Tooltip'

describe('Tooltip', () => {
  it('renders the trigger and the (closed) tooltip with its content', () => {
    render(
      <Tooltip content="Save changes">
        <button>Save</button>
      </Tooltip>,
    )
    expect(screen.getByText('Save')).toBeInTheDocument()
    const tip = screen.getByRole('tooltip', { hidden: true })
    expect(tip).toHaveTextContent('Save changes')
    expect(tip).toHaveAttribute('data-open', 'false')
  })

  it('defaults to the top placement', () => {
    render(
      <Tooltip content="Hi">
        <button>t</button>
      </Tooltip>,
    )
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveClass('top')
  })

  it('applies the requested placement', () => {
    render(
      <Tooltip content="Hi" placement="right">
        <button>t</button>
      </Tooltip>,
    )
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveClass('right')
  })

  it('opens on hover and links the trigger via aria-describedby, then closes', () => {
    render(
      <Tooltip content="Hi">
        <button>Trigger</button>
      </Tooltip>,
    )
    const trigger = screen.getByText('Trigger')
    const wrapper = trigger.parentElement as HTMLElement
    const tip = screen.getByRole('tooltip', { hidden: true })

    expect(trigger).not.toHaveAttribute('aria-describedby')

    fireEvent.mouseEnter(wrapper)
    expect(tip).toHaveAttribute('data-open', 'true')
    expect(trigger).toHaveAttribute('aria-describedby', tip.id)

    fireEvent.mouseLeave(wrapper)
    expect(tip).toHaveAttribute('data-open', 'false')
    expect(trigger).not.toHaveAttribute('aria-describedby')
  })

  it('closes on Escape', () => {
    render(
      <Tooltip content="Hi">
        <button>Trigger</button>
      </Tooltip>,
    )
    const wrapper = screen.getByText('Trigger').parentElement as HTMLElement
    fireEvent.mouseEnter(wrapper)
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('data-open', 'true')
    fireEvent.keyDown(wrapper, { key: 'Escape' })
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('data-open', 'false')
  })

  it('renders just the child when content is empty', () => {
    render(
      <Tooltip content="">
        <button>Only Me</button>
      </Tooltip>,
    )
    expect(screen.getByText('Only Me')).toBeInTheDocument()
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull()
  })

  it('tints the fill via the --tz-btn-rgb inline var from color (default primary)', () => {
    const { rerender } = render(
      <Tooltip content="Hi">
        <button>Trigger</button>
      </Tooltip>,
    )
    let wrapper = screen.getByText('Trigger').parentElement as HTMLElement
    expect(wrapper.getAttribute('style')).toContain('--tz-btn-rgb: var(--tz-color-primary-rgb)')
    rerender(
      <Tooltip content="Hi" color="secondary">
        <button>Trigger</button>
      </Tooltip>,
    )
    wrapper = screen.getByText('Trigger').parentElement as HTMLElement
    expect(wrapper.getAttribute('style')).toContain('--tz-btn-rgb: var(--tz-color-secondary-rgb)')
  })
})
