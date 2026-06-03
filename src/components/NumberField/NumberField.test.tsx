import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { z } from 'zod'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'
import { NumberField } from './NumberField'

const input = () => screen.getByLabelText('Quantity') as HTMLInputElement

describe('NumberField', () => {
  it('renders a label associated with the input', () => {
    render(<NumberField label="Quantity" />)
    expect(input()).toBeInstanceOf(HTMLInputElement)
  })

  it('shows the default value', () => {
    render(<NumberField label="Quantity" defaultValue={5} />)
    expect(input().value).toBe('5')
  })

  it('emits the numeric value on change, and null when cleared', () => {
    const onChange = vi.fn()
    render(<NumberField label="Quantity" defaultValue={5} onChange={onChange} />)
    fireEvent.change(input(), { target: { value: '42' } })
    expect(onChange).toHaveBeenLastCalledWith(42)
    fireEvent.change(input(), { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('rejects non-numeric input', () => {
    const onChange = vi.fn()
    render(<NumberField label="Quantity" onChange={onChange} />)
    fireEvent.change(input(), { target: { value: 'abc' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(input().value).toBe('')
  })

  it('steps up and down by `step`', () => {
    const onChange = vi.fn()
    render(<NumberField label="Quantity" defaultValue={5} step={2} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Increase' }))
    expect(onChange).toHaveBeenLastCalledWith(7)
    expect(input().value).toBe('7')
    fireEvent.click(screen.getByRole('button', { name: 'Decrease' }))
    expect(onChange).toHaveBeenLastCalledWith(5)
  })

  it('disables the matching stepper at min/max bounds', () => {
    render(<NumberField label="Quantity" defaultValue={10} min={0} max={10} />)
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Decrease' })).not.toBeDisabled()
  })

  it('clamps to max on blur', () => {
    const onChange = vi.fn()
    render(<NumberField label="Quantity" max={5} onChange={onChange} />)
    fireEvent.change(input(), { target: { value: '99' } })
    fireEvent.blur(input())
    expect(onChange).toHaveBeenLastCalledWith(5)
  })

  it('disables the input and both steppers when disabled', () => {
    render(<NumberField label="Quantity" defaultValue={1} disabled />)
    expect(input()).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled()
  })

  it('defaults min to 0 — clamps negatives on blur and disables − at the floor', () => {
    const onChange = vi.fn()
    render(<NumberField label="Quantity" defaultValue={0} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled() // already at 0
    fireEvent.change(input(), { target: { value: '-5' } })
    fireEvent.blur(input())
    expect(onChange).toHaveBeenLastCalledWith(0) // clamped up to the default min
  })

  describe('thousandSeparator', () => {
    it('groups the initial value for display', () => {
      render(<NumberField label="Quantity" defaultValue={32345345} thousandSeparator="." />)
      expect(input().value).toBe('32.345.345')
    })

    it('regroups live while typing and keeps the value a plain number', () => {
      const onChange = vi.fn()
      render(<NumberField label="Quantity" thousandSeparator="." onChange={onChange} />)
      const el = input()
      fireEvent.change(el, { target: { value: '1234567' } })
      expect(el.value).toBe('1.234.567') // grouped live, no focus/blur needed
      expect(onChange).toHaveBeenLastCalledWith(1234567)
    })
  })

  it('is full width by default', () => {
    const { container } = render(<NumberField label="Quantity" />)
    expect(container.firstElementChild?.className).toContain('fullWidth')
  })

  it('forwards the ref to the input element', () => {
    const ref = createRef<HTMLInputElement>()
    render(<NumberField label="Quantity" ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  describe('Form binding', () => {
    function Harness() {
      const form = useForm({
        schema: z.object({ qty: z.number().min(1, 'Min 1') }),
        defaultValues: { qty: 0 },
      })
      return (
        <Form form={form}>
          <NumberField name="qty" label="Qty" />
        </Form>
      )
    }

    it('binds a numeric value by name and validates via the schema', () => {
      render(<Harness />)
      const field = screen.getByLabelText('Qty') as HTMLInputElement
      expect(field.value).toBe('0')

      fireEvent.blur(field) // 0 < 1 → error shows after blur
      expect(screen.getByText('Min 1')).toBeInTheDocument()

      fireEvent.change(field, { target: { value: '3' } })
      expect(field.value).toBe('3')
      expect(screen.queryByText('Min 1')).not.toBeInTheDocument()
    })
  })
})
