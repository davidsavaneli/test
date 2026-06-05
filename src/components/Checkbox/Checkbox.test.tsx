import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { z } from 'zod'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('renders a checkbox with an accessible label', () => {
    render(<Checkbox label="Subscribe" />)
    expect(screen.getByRole('checkbox', { name: 'Subscribe' })).toBeInTheDocument()
  })

  it('toggles (uncontrolled) and reports the next state', () => {
    const onChange = vi.fn()
    render(<Checkbox label="Subscribe" onChange={onChange} />)
    const cb = screen.getByRole('checkbox', { name: 'Subscribe' })
    expect(cb).not.toBeChecked()
    fireEvent.click(cb)
    expect(cb).toBeChecked()
    expect(onChange).toHaveBeenLastCalledWith(true)
  })

  it('honors the controlled `checked` prop', () => {
    const onChange = vi.fn()
    render(<Checkbox label="Subscribe" checked={false} onChange={onChange} />)
    const cb = screen.getByRole('checkbox', { name: 'Subscribe' })
    fireEvent.click(cb)
    expect(onChange).toHaveBeenCalledWith(true)
    expect(cb).not.toBeChecked() // parent didn't update the prop
  })

  it('respects defaultChecked', () => {
    render(<Checkbox label="Subscribe" defaultChecked />)
    expect(screen.getByRole('checkbox', { name: 'Subscribe' })).toBeChecked()
  })

  it('disables the input', () => {
    render(<Checkbox label="Subscribe" disabled />)
    expect(screen.getByRole('checkbox', { name: 'Subscribe' })).toBeDisabled()
  })

  it('reddens the box on error (aria-invalid, no helper text)', () => {
    const { container } = render(<Checkbox label="Terms" error />)
    expect(screen.getByRole('checkbox', { name: 'Terms' })).toHaveAttribute('aria-invalid', 'true')
    expect(container.firstElementChild).toHaveClass('error')
  })

  it('applies the size class', () => {
    const { container } = render(<Checkbox label="Subscribe" size="lg" />)
    expect(container.querySelector('label')?.className).toContain('lg')
  })

  it('forwards the ref to the input element', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Checkbox label="Subscribe" ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  describe('Form binding', () => {
    function Harness() {
      const form = useForm({
        schema: z.object({ agree: z.boolean().refine((v) => v, 'Required') }),
        defaultValues: { agree: false },
      })
      return (
        <Form form={form}>
          <Checkbox name="agree" label="Agree" />
        </Form>
      )
    }

    it('binds a boolean by name and reddens the box on invalid submit (no helper text)', () => {
      const { container } = render(<Harness />)
      const cb = screen.getByRole('checkbox', { name: 'Agree' })
      const field = container.querySelector('form')!.firstElementChild as HTMLElement

      fireEvent.submit(container.querySelector('form')!)
      expect(cb).toHaveAttribute('aria-invalid', 'true')
      expect(field).toHaveClass('error')

      fireEvent.click(cb)
      expect(cb).toBeChecked()
      expect(cb).not.toHaveAttribute('aria-invalid')
      expect(field).not.toHaveClass('error')
    })
  })
})
