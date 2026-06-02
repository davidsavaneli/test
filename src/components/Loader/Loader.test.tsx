import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Loader } from './Loader'

describe('Loader', () => {
  it('exposes a status role with an accessible label', () => {
    render(<Loader />)
    const loader = screen.getByRole('status')
    expect(loader).toHaveAttribute('aria-label', 'Loading')
    expect(loader.className).toContain('md') // default size
  })

  it('applies the requested size class', () => {
    render(<Loader size="sm" />)
    expect(screen.getByRole('status').className).toContain('sm')
  })

  it('inherits text color by default (no inline color)', () => {
    render(<Loader />)
    expect(screen.getByRole('status').style.color).toBe('')
  })

  it('resolves a brand color token to a CSS variable', () => {
    render(<Loader color="warning" />)
    expect(screen.getByRole('status').style.color).toBe('var(--tz-color-warning)')
  })

  it('forwards the ref to the span element', () => {
    const ref = createRef<HTMLSpanElement>()
    render(<Loader ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
  })
})
