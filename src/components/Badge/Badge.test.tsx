import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders its child', () => {
    render(
      <Badge content={2}>
        <button>Child</button>
      </Badge>,
    )
    expect(screen.getByText('Child')).toBeInTheDocument()
  })

  it('shows numeric content', () => {
    render(
      <Badge content={5}>
        <span>x</span>
      </Badge>,
    )
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('caps numeric content at max as `${max}+`', () => {
    render(
      <Badge content={150} max={99}>
        <span>x</span>
      </Badge>,
    )
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('hides a zero count by default, shows it with showZero', () => {
    const { rerender, container } = render(
      <Badge content={0}>
        <span>x</span>
      </Badge>,
    )
    expect(container.querySelector('.badge')).toBeNull()
    rerender(
      <Badge content={0} showZero>
        <span>x</span>
      </Badge>,
    )
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('renders a decorative dot when `dot` is set and there is no content', () => {
    const { container } = render(
      <Badge dot>
        <span>x</span>
      </Badge>,
    )
    const badge = container.querySelector('.badge')
    expect(badge).toHaveClass('dot')
    expect(badge?.textContent).toBe('')
    expect(badge).toHaveAttribute('aria-hidden', 'true')
  })

  it('lets content win over dot', () => {
    const { container } = render(
      <Badge dot content={3}>
        <span>x</span>
      </Badge>,
    )
    const badge = container.querySelector('.badge')
    expect(badge).toHaveClass('value')
    expect(badge).toHaveTextContent('3')
  })

  it('renders string content uncapped', () => {
    render(
      <Badge content="new">
        <span>x</span>
      </Badge>,
    )
    expect(screen.getByText('new')).toBeInTheDocument()
  })

  it('tints via the --tz-btn-rgb inline var and applies the placement class', () => {
    const { container } = render(
      <Badge content={1} color="error" placement="bottom-left">
        <span>x</span>
      </Badge>,
    )
    const badge = container.querySelector('.badge') as HTMLElement
    expect(badge.style.getPropertyValue('--tz-btn-rgb')).toBe('var(--tz-color-error-rgb)')
    expect(badge).toHaveClass('bottomLeft')
  })
})
