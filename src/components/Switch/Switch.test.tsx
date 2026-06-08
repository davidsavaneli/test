import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { z } from 'zod'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'
import { Switch } from './Switch'

describe('Switch', () => {
  it('renders a labeled switch, off by default', () => {
    render(<Switch label="Notifications" />)
    const toggle = screen.getByRole('switch', { name: 'Notifications' })
    expect(toggle).not.toBeChecked()
  })

  it('toggles and emits the next boolean (uncontrolled)', () => {
    const onChange = vi.fn()
    render(<Switch label="Wifi" onChange={onChange} />)
    const toggle = screen.getByRole('switch', { name: 'Wifi' })

    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith(true)
    expect(toggle).toBeChecked()
  })

  it('respects the controlled `checked` prop', () => {
    render(<Switch label="On" checked onChange={() => {}} />)
    expect(screen.getByRole('switch', { name: 'On' })).toBeChecked()
  })

  it('reddens (aria-invalid) on error with no message text', () => {
    render(<Switch label="Required" error />)
    expect(screen.getByRole('switch', { name: 'Required' })).toHaveAttribute('aria-invalid', 'true')
  })

  it('sets the --tz-btn-rgb tint var from color', () => {
    const { container } = render(<Switch color="success" label="X" />)
    expect(
      (container.firstElementChild as HTMLElement).style.getPropertyValue('--tz-btn-rgb'),
    ).toBe('var(--tz-color-success-rgb)')
  })

  it('binds to a surrounding <Form> by name (boolean value)', () => {
    function Harness() {
      const form = useForm({
        schema: z.object({ enabled: z.boolean() }),
        defaultValues: { enabled: false },
      })
      return (
        <Form form={form}>
          <Switch name="enabled" label="Enabled" />
        </Form>
      )
    }
    render(<Harness />)
    const toggle = screen.getByRole('switch', { name: 'Enabled' })
    expect(toggle).not.toBeChecked()

    fireEvent.click(toggle)
    expect(screen.getByRole('switch', { name: 'Enabled' })).toBeChecked()
  })
})
