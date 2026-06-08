import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { z } from 'zod'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'
import { ColorPicker } from './ColorPicker'
import { formatColor, hexToHsv, hsvToHex, normalizeHex, parseColor } from './colorUtils'

describe('colorUtils', () => {
  it('normalizes hex (3-digit, missing #, casing) and rejects junk', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc')
    expect(normalizeHex('0ea5e9')).toBe('#0ea5e9')
    expect(normalizeHex('nope')).toBeNull()
  })

  it('round-trips hex → hsv → hex', () => {
    for (const hex of ['#13404e', '#0ea5e9', '#ffbf00', '#000000', '#ffffff']) {
      expect(hsvToHex(hexToHsv(hex))).toBe(hex)
    }
  })

  it('parseColor reads hex (3/4/6/8), rgb() and rgba(); rejects junk', () => {
    expect(parseColor('#abc')).toEqual({ r: 170, g: 187, b: 204, a: 1 })
    expect(parseColor('0ea5e9')).toEqual({ r: 14, g: 165, b: 233, a: 1 })
    expect(parseColor('rgb(1, 2, 3)')).toEqual({ r: 1, g: 2, b: 3, a: 1 })
    expect(parseColor('rgba(1, 2, 3, 0.5)')).toEqual({ r: 1, g: 2, b: 3, a: 0.5 })
    expect(parseColor('#ff000080')?.a).toBeCloseTo(0.5, 1)
    expect(parseColor('rgba(0,0,0,50%)')?.a).toBe(0.5)
    expect(parseColor('nope')).toBeNull()
  })

  it('formatColor stays hex when opaque, switches to rgba() when translucent', () => {
    expect(formatColor({ r: 1, g: 2, b: 3, a: 1 })).toBe('#010203')
    expect(formatColor({ r: 1, g: 2, b: 3, a: 0.5 })).toBe('rgba(1, 2, 3, 0.5)')
  })
})

describe('ColorPicker', () => {
  it('renders a placeholder trigger and opens the popover on click', () => {
    render(<ColorPicker label="Brand color" />)
    // an associated <label htmlFor> names the trigger button
    const trigger = screen.getByRole('button', { name: 'Brand color' })
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Color picker' })).toBeInTheDocument()
  })

  it('commits a preset swatch through onChange', () => {
    const onChange = vi.fn()
    render(<ColorPicker onChange={onChange} swatches={['#ff0000', '#00ff00']} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pick a color' }))
    fireEvent.click(screen.getByRole('button', { name: '#ff0000' }))
    expect(onChange).toHaveBeenCalledWith('#ff0000')
  })

  it('commits a typed hex value', () => {
    const onChange = vi.fn()
    render(<ColorPicker onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pick a color' }))
    fireEvent.change(screen.getByLabelText('Color value'), { target: { value: '0ea5e9' } })
    expect(onChange).toHaveBeenCalledWith('#0ea5e9')
  })

  it('commits a translucent value as rgba() via the input', () => {
    const onChange = vi.fn()
    render(<ColorPicker onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pick a color' }))
    fireEvent.change(screen.getByLabelText('Color value'), {
      target: { value: 'rgba(0, 0, 0, 0.5)' },
    })
    expect(onChange).toHaveBeenCalledWith('rgba(0, 0, 0, 0.5)')
  })

  it('shows the controlled value (uppercased) in the trigger', () => {
    render(<ColorPicker value="#13404e" />)
    expect(screen.getByText('#13404E')).toBeInTheDocument()
  })

  it('clears the field via the "no color" swatch', () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#13404e" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '#13404E' })) // open
    fireEvent.click(screen.getByRole('button', { name: 'No color' }))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('marks invalid and shows the error helper text', () => {
    render(<ColorPicker label="Accent" error helperText="Color is required" />)
    expect(screen.getByText('Color is required')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accent' })).toHaveAttribute('aria-invalid', 'true')
  })

  it('binds to a surrounding <Form> by name (hex string value)', () => {
    function Harness() {
      const form = useForm({
        schema: z.object({ color: z.string() }),
        defaultValues: { color: '' },
      })
      return (
        <Form form={form}>
          <ColorPicker name="color" swatches={['#abcdef']} />
        </Form>
      )
    }
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Pick a color' }))
    fireEvent.click(screen.getByRole('button', { name: '#abcdef' }))
    // the form value updated → the trigger value reflects it
    expect(screen.getByText('#ABCDEF')).toBeInTheDocument()
  })
})
