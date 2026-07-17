import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Icon } from './Icon'

describe('Icon', () => {
  it('renders an svg with the size class and inline content', () => {
    const { container } = render(<Icon name="Add" />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('class')).toContain('icon')
    expect(svg!.getAttribute('class')).toContain('md') // default size
    expect(svg!.innerHTML.length).toBeGreaterThan(0)
  })

  it('is hidden from the accessibility tree by default', () => {
    const { container } = render(<Icon name="Add" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('focusable')).toBe('false')
  })

  it('applies the requested size class', () => {
    const { container } = render(<Icon name="Add" size="lg" />)
    expect(container.querySelector('svg')!.getAttribute('class')).toContain('lg')
  })

  it('resolves a theme color token to a CSS variable', () => {
    const { container } = render(<Icon name="Add" color="success" />)
    expect((container.querySelector('svg') as SVGElement).style.color).toBe(
      'var(--tz-color-success)',
    )
  })

  it('forwards the ref to the svg element', () => {
    const ref = createRef<SVGSVGElement>()
    render(<Icon name="Add" ref={ref} />)
    expect(ref.current).toBeInstanceOf(SVGSVGElement)
  })
})
