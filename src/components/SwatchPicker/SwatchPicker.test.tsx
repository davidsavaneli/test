import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SwatchPicker } from './SwatchPicker'

const COLORS = ['#056472', '#7c3aed', '#2563eb']

describe('SwatchPicker', () => {
  it('renders one radio swatch per color inside a radiogroup', () => {
    render(<SwatchPicker colors={COLORS} aria-label="Theme color" />)
    expect(screen.getByRole('radiogroup', { name: 'Theme color' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    // each swatch carries the color as its --sw var
    expect(screen.getByRole('radio', { name: '#7c3aed' }).getAttribute('style')).toContain(
      '--sw: #7c3aed',
    )
  })

  it('marks the matching swatch selected (case-insensitively) via aria-checked', () => {
    render(<SwatchPicker colors={COLORS} value="#7C3AED" />)
    expect(screen.getByRole('radio', { name: '#7c3aed' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '#056472' })).toHaveAttribute('aria-checked', 'false')
  })

  it('fires onChange with the clicked color', () => {
    const onChange = vi.fn()
    render(<SwatchPicker colors={COLORS} value="#056472" onChange={onChange} />)
    fireEvent.click(screen.getByRole('radio', { name: '#2563eb' }))
    expect(onChange).toHaveBeenCalledWith('#2563eb')
  })

  it('tracks selection itself when uncontrolled (defaultValue)', () => {
    render(<SwatchPicker colors={COLORS} defaultValue="#056472" />)
    expect(screen.getByRole('radio', { name: '#056472' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: '#2563eb' }))
    expect(screen.getByRole('radio', { name: '#2563eb' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '#056472' })).toHaveAttribute('aria-checked', 'false')
  })

  it('uses per-color labels when provided', () => {
    render(<SwatchPicker colors={COLORS} labels={{ '#056472': 'Default (teal)' }} />)
    expect(screen.getByRole('radio', { name: 'Default (teal)' })).toBeInTheDocument()
  })

  it('renders label + helperText and marks the group invalid while error', () => {
    render(<SwatchPicker colors={COLORS} label="Accent" required error helperText="Pick a color" />)
    expect(screen.getByText('Accent')).toBeInTheDocument()
    expect(screen.getByText('Pick a color')).toBeInTheDocument()
    // the group (named by its label) is flagged invalid
    expect(screen.getByRole('radiogroup', { name: 'Accent' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('applies the size class and forwards the ref to the root', () => {
    const ref = createRef<HTMLDivElement>()
    const { container } = render(<SwatchPicker colors={COLORS} size="lg" ref={ref} />)
    expect(ref.current?.tagName).toBe('DIV')
    expect(container.querySelector('.swatches')?.classList.contains('lg')).toBe(true)
  })
})
