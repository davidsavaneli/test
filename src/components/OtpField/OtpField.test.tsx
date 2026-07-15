import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { z } from 'zod'
import { Form, useForm } from '../../form'
import { OtpField } from './OtpField'

const boxes = () => screen.getAllByRole('textbox') as HTMLInputElement[]

describe('OtpField', () => {
  it('renders `length` boxes (default 4)', () => {
    const { rerender } = render(<OtpField aria-label="Code" />)
    expect(boxes()).toHaveLength(4)
    rerender(<OtpField length={6} />)
    expect(boxes()).toHaveLength(6)
  })

  it('types a char, advances focus, and emits the concatenated value', () => {
    const onChange = vi.fn()
    render(<OtpField onChange={onChange} />)
    const [b0, b1] = boxes()
    fireEvent.change(b0, { target: { value: '1' } })
    expect(onChange).toHaveBeenLastCalledWith('1')
    expect(b1).toHaveFocus()
    fireEvent.change(b1, { target: { value: '2' } })
    expect(onChange).toHaveBeenLastCalledWith('12')
  })

  it('rejects characters outside the type (numeric ignores letters)', () => {
    const onChange = vi.fn()
    render(<OtpField type="numeric" onChange={onChange} />)
    fireEvent.change(boxes()[0], { target: { value: 'a' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(boxes()[0]).toHaveValue('')
  })

  it('accepts letters for alphabetic and both for alphanumeric', () => {
    const onChange = vi.fn()
    const { rerender } = render(<OtpField type="alphabetic" onChange={onChange} />)
    fireEvent.change(boxes()[0], { target: { value: 'x' } })
    expect(onChange).toHaveBeenLastCalledWith('x')
    fireEvent.change(boxes()[0], { target: { value: '3' } }) // digit rejected
    expect(onChange).toHaveBeenLastCalledWith('x')
    rerender(<OtpField type="alphanumeric" onChange={onChange} />)
    fireEvent.change(boxes()[0], { target: { value: '3' } })
    expect(onChange).toHaveBeenLastCalledWith('3')
  })

  it('fires onComplete once every box is filled', () => {
    const onComplete = vi.fn()
    render(<OtpField length={3} onComplete={onComplete} />)
    fireEvent.change(boxes()[0], { target: { value: '1' } })
    fireEvent.change(boxes()[1], { target: { value: '2' } })
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.change(boxes()[2], { target: { value: '3' } })
    expect(onComplete).toHaveBeenCalledWith('123')
  })

  it('Backspace on an empty box clears and steps back', () => {
    const onChange = vi.fn()
    render(<OtpField defaultValue="12" onChange={onChange} />)
    const [, b1, b2] = boxes()
    b2.focus()
    fireEvent.keyDown(b2, { key: 'Backspace' })
    expect(onChange).toHaveBeenLastCalledWith('1') // cleared box 1 ('2')
    expect(b1).toHaveFocus()
  })

  it('distributes a pasted / autofilled code across the boxes (filtered by type)', () => {
    const onChange = vi.fn()
    render(<OtpField length={4} type="numeric" onChange={onChange} />)
    // paste with noise — only digits survive, capped at length
    fireEvent.paste(boxes()[0], { clipboardData: { getData: () => '12-34-99' } })
    expect(onChange).toHaveBeenLastCalledWith('1234')
  })

  it('also distributes when a full code lands in one box (SMS autofill)', () => {
    const onChange = vi.fn()
    render(<OtpField length={4} onChange={onChange} />)
    fireEvent.change(boxes()[0], { target: { value: '1234' } })
    expect(onChange).toHaveBeenLastCalledWith('1234')
  })

  it('reflects a controlled value and sets one-time-code autofill on the first box', () => {
    render(<OtpField value="12" />)
    const bs = boxes()
    expect(bs[0]).toHaveValue('1')
    expect(bs[1]).toHaveValue('2')
    expect(bs[0]).toHaveAttribute('autocomplete', 'one-time-code')
    expect(bs[1]).toHaveAttribute('autocomplete', 'off')
  })

  it('sets inputmode numeric for the numeric type and text otherwise', () => {
    const { rerender } = render(<OtpField type="numeric" />)
    expect(boxes()[0]).toHaveAttribute('inputmode', 'numeric')
    rerender(<OtpField type="alphabetic" />)
    expect(boxes()[0]).toHaveAttribute('inputmode', 'text')
  })

  it('binds to a <Form> by name (value = the code string)', () => {
    function Demo() {
      const form = useForm({
        schema: z.object({ otp: z.string().length(4, 'Enter the 4-digit code') }),
        defaultValues: { otp: '' },
      })
      return (
        <Form form={form}>
          <OtpField name="otp" label="Code" />
          <output data-testid="value">{String(form.values.otp)}</output>
        </Form>
      )
    }
    render(<Demo />)
    fireEvent.change(boxes()[0], { target: { value: '9' } })
    expect(screen.getByTestId('value')).toHaveTextContent('9')
    // the name rides the first box for scroll-to-error
    expect(boxes()[0]).toHaveAttribute('name', 'otp')
    expect(boxes()[1]).not.toHaveAttribute('name')
  })

  it('applies the error state class to the boxes row', () => {
    const { container } = render(<OtpField error helperText="Wrong code" />)
    expect(container.querySelector('.invalid')).not.toBeNull()
    expect(screen.getByText('Wrong code')).toBeInTheDocument()
  })

  it('tints via the --tz-btn-rgb inline var from color', () => {
    const { container } = render(<OtpField color="success" />)
    expect(container.firstElementChild?.getAttribute('style')).toContain(
      '--tz-btn-rgb: var(--tz-color-success-rgb)',
    )
  })

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<OtpField ref={ref} />)
    expect(ref.current?.tagName).toBe('DIV')
  })
})
