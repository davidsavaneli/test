import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Typography } from './Typography'

describe('Typography', () => {
  it('defaults to a <p> with the body variant', () => {
    render(<Typography>Hello</Typography>)
    const el = screen.getByText('Hello')
    expect(el.tagName).toBe('P')
    expect(el.className).toContain('body')
  })

  it('maps variants to their default element', () => {
    render(<Typography variant="h1">Title</Typography>)
    expect(screen.getByText('Title').tagName).toBe('H1')
  })

  it('renders caption as a <span>', () => {
    render(<Typography variant="caption">cap</Typography>)
    expect(screen.getByText('cap').tagName).toBe('SPAN')
  })

  it('keeps the variant styling but swaps the tag with `as`', () => {
    render(
      <Typography variant="h3" as="span">
        spanned
      </Typography>,
    )
    const el = screen.getByText('spanned')
    expect(el.tagName).toBe('SPAN')
    expect(el.className).toContain('h3')
  })

  it('resolves a brand color token to a CSS variable', () => {
    render(<Typography color="error">err</Typography>)
    expect(screen.getByText('err').style.color).toBe('var(--tz-color-error)')
  })

  it('maps the `text` color to the semantic token', () => {
    render(<Typography color="text">t</Typography>)
    expect(screen.getByText('t').style.color).toBe('var(--tz-color-text)')
  })

  it('applies text alignment', () => {
    render(<Typography align="center">c</Typography>)
    expect(screen.getByText('c').style.textAlign).toBe('center')
  })

  it('adds the truncate modifier', () => {
    render(<Typography truncate>long</Typography>)
    expect(screen.getByText('long').className).toContain('truncate')
  })

  it('forwards the ref', () => {
    const ref = createRef<HTMLElement>()
    render(<Typography ref={ref}>r</Typography>)
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement)
  })
})
