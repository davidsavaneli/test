import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { z } from 'zod'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'
import { Radio } from './Radio'
import { RadioGroup } from './RadioGroup'

const OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
]

describe('RadioGroup', () => {
  it('renders a radiogroup of options and selects on click (uncontrolled)', () => {
    const onChange = vi.fn()
    render(<RadioGroup label="Contact" options={OPTIONS} onChange={onChange} />)

    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    const email = screen.getByRole('radio', { name: 'Email' })
    expect(email).not.toBeChecked()

    fireEvent.click(email)

    expect(onChange).toHaveBeenCalledWith('email')
    expect(screen.getByRole('radio', { name: 'Email' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'SMS' })).not.toBeChecked()
  })

  it('reflects a controlled value', () => {
    render(<RadioGroup value="sms" options={OPTIONS} onChange={() => {}} />)
    expect(screen.getByRole('radio', { name: 'SMS' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Email' })).not.toBeChecked()
  })

  it('marks the group invalid while error (reddens rings, no message text)', () => {
    render(<RadioGroup error options={OPTIONS} />)
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true')
    // no helper/error message is rendered (like Checkbox)
    expect(screen.queryByText(/choose/i)).not.toBeInTheDocument()
  })

  it('shares the name across its radios', () => {
    render(<RadioGroup name="contact" options={OPTIONS} />)
    expect(screen.getByRole('radio', { name: 'Email' })).toHaveAttribute('name', 'contact')
    expect(screen.getByRole('radio', { name: 'SMS' })).toHaveAttribute('name', 'contact')
  })

  it('binds to a surrounding <Form> by name', () => {
    function Harness() {
      const form = useForm({
        schema: z.object({ plan: z.string() }),
        defaultValues: { plan: '' },
      })
      return (
        <Form form={form}>
          <RadioGroup
            name="plan"
            options={[
              { value: 'pro', label: 'Pro' },
              { value: 'free', label: 'Free' },
            ]}
          />
        </Form>
      )
    }
    render(<Harness />)
    const pro = screen.getByRole('radio', { name: 'Pro' })
    expect(pro).not.toBeChecked()

    fireEvent.click(pro)

    // the form value updated → the group reflects it
    expect(screen.getByRole('radio', { name: 'Pro' })).toBeChecked()
  })
})

describe('Radio (standalone)', () => {
  it('reflects the controlled checked prop and fires onChange', () => {
    const onChange = vi.fn()
    render(<Radio value="x" label="Standalone" checked={false} onChange={onChange} />)
    const radio = screen.getByRole('radio', { name: 'Standalone' })
    expect(radio).not.toBeChecked()

    fireEvent.click(radio)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('sets the --tz-btn-rgb tint var from color', () => {
    const { container } = render(<Radio value="x" color="success" label="X" />)
    expect(
      (container.firstElementChild as HTMLElement).style.getPropertyValue('--tz-btn-rgb'),
    ).toBe('var(--tz-color-success-rgb)')
  })
})
