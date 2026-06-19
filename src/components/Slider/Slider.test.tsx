import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { Slider } from './Slider'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'

describe('Slider', () => {
  it('renders a labeled range with min / max / step', () => {
    render(<Slider label="Volume" min={0} max={10} step={2} defaultValue={4} />)
    const slider = screen.getByRole('slider') as HTMLInputElement
    expect(slider).toHaveAttribute('type', 'range')
    expect(slider).toHaveAttribute('min', '0')
    expect(slider).toHaveAttribute('max', '10')
    expect(slider).toHaveAttribute('step', '2')
    expect(slider.value).toBe('4')
    expect(screen.getByText('Volume')).toBeInTheDocument()
  })

  it('shows the value label and updates on change (uncontrolled)', () => {
    const onChange = vi.fn()
    render(<Slider label="Level" defaultValue={20} onChange={onChange} />)
    expect(screen.getByText('20')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('slider'), { target: { value: '55' } })
    expect(onChange).toHaveBeenLastCalledWith(55)
    expect(screen.getByText('55')).toBeInTheDocument()
  })

  it('formats the value label with a function, or hides it', () => {
    const { rerender } = render(<Slider defaultValue={30} valueLabel={(v) => `${v}%`} />)
    expect(screen.getByText('30%')).toBeInTheDocument()
    rerender(<Slider label="X" defaultValue={5} valueLabel={false} />)
    expect(screen.queryByText('5')).toBeNull()
  })

  it('respects a controlled value', () => {
    const onChange = vi.fn()
    const { rerender } = render(<Slider value={10} onChange={onChange} />)
    expect((screen.getByRole('slider') as HTMLInputElement).value).toBe('10')
    fireEvent.change(screen.getByRole('slider'), { target: { value: '40' } })
    expect(onChange).toHaveBeenCalledWith(40)
    expect((screen.getByRole('slider') as HTMLInputElement).value).toBe('10') // parent owns it
    rerender(<Slider value={40} onChange={onChange} />)
    expect((screen.getByRole('slider') as HTMLInputElement).value).toBe('40')
  })

  it('renders marks', () => {
    render(
      <Slider
        marks={[
          { value: 0, label: 'Low' },
          { value: 100, label: 'High' },
        ]}
      />,
    )
    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('disables the input and forwards the ref', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Slider label="X" disabled ref={ref} />)
    expect(screen.getByRole('slider')).toBeDisabled()
    expect(ref.current?.tagName).toBe('INPUT')
  })

  it('binds to a Form by name (number value) and validates', () => {
    function Demo() {
      const form = useForm({
        schema: z.object({ rating: z.number().min(3, 'Too low') }),
        defaultValues: { rating: 1 },
        onSubmit: () => {},
      })
      return (
        <Form form={form}>
          <Slider name="rating" label="Rating" min={0} max={5} />
          <button type="submit">Save</button>
        </Form>
      )
    }
    render(<Demo />)
    const slider = screen.getByRole('slider') as HTMLInputElement
    expect(slider.value).toBe('1') // pulled from defaultValues

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Too low')).toBeInTheDocument() // 1 < 3 → validation error

    fireEvent.change(slider, { target: { value: '4' } })
    expect((screen.getByRole('slider') as HTMLInputElement).value).toBe('4')
  })

  it('renders two thumbs in range mode and shows the span', () => {
    render(<Slider range label="Price" min={0} max={20} value={[5, 10]} />)
    const thumbs = screen.getAllByRole('slider') as HTMLInputElement[]
    expect(thumbs).toHaveLength(2)
    expect(thumbs[0].value).toBe('5')
    expect(thumbs[1].value).toBe('10')
    expect(screen.getByText('5 – 10')).toBeInTheDocument()
  })

  it('defaults an uncontrolled range to [min, max]', () => {
    render(<Slider range min={0} max={50} />)
    const thumbs = screen.getAllByRole('slider') as HTMLInputElement[]
    expect(thumbs[0].value).toBe('0')
    expect(thumbs[1].value).toBe('50')
  })

  it('keeps the range thumbs from crossing', () => {
    const onChange = vi.fn()
    render(<Slider range min={0} max={20} value={[5, 10]} onChange={onChange} />)
    const [start] = screen.getAllByRole('slider')
    // drag the start past the end → clamped to the end, never beyond
    fireEvent.change(start, { target: { value: '15' } })
    expect(onChange).toHaveBeenLastCalledWith([10, 10])
  })
})
