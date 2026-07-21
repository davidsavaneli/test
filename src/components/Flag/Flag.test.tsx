import { createRef } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Flag } from './Flag'

describe('Flag', () => {
  it('renders the shipped flag SVG for a known language (matched by base code)', () => {
    const { container } = render(<Flag code="ka-GE" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders nothing for a language with no shipped flag', () => {
    const { container } = render(<Flag code="nl-NL" />)
    expect(container.querySelector('svg')).toBeNull()
    expect(container.firstChild).toBeNull()
  })

  it('is decorative (aria-hidden) and applies the size var + forwards the ref', () => {
    const ref = createRef<HTMLSpanElement>()
    const { container } = render(<Flag code="en-US" size={24} ref={ref} />)
    const span = container.firstElementChild as HTMLElement
    expect(span).toBe(ref.current)
    expect(span).toHaveAttribute('aria-hidden', 'true')
    expect(span.style.getPropertyValue('--tz-flag-height')).toBe('24px')
  })
})
