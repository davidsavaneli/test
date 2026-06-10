import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { z } from 'zod'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'
import { TimePicker } from './TimePicker'

describe('TimePicker', () => {
  it('renders a label associated with the input', () => {
    render(<TimePicker label="Time" />)
    expect(screen.getByLabelText('Time')).toBeInstanceOf(HTMLInputElement)
  })

  it('formats the controlled time value in the input', () => {
    render(<TimePicker label="Time" value="09:35:00" />)
    expect(screen.getByLabelText('Time')).toHaveValue('09:35:00') // seconds shown by default
  })

  it('leniently accepts a sub-second backend time and shows it', () => {
    render(<TimePicker label="Time" value="09:35:49.6134342" />)
    expect(screen.getByLabelText('Time')).toHaveValue('09:35:49')
  })

  it('opens a dialog with hour / minute / second listboxes (no calendar)', () => {
    render(<TimePicker label="Time" value="09:35:00" />)
    fireEvent.click(screen.getByRole('button', { name: 'Open time picker' }))
    expect(screen.getByRole('dialog', { name: 'Choose time' })).toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: 'Hour' })).toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: 'Minute' })).toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: 'Second' })).toBeInTheDocument()
    expect(screen.queryByRole('grid')).toBeNull()
  })

  it('commits a typed time as a valueFormat string', () => {
    const onChange = vi.fn()
    render(<TimePicker label="Time" onChange={onChange} />)
    const input = screen.getByLabelText('Time') as HTMLInputElement
    fireEvent.change(input, { target: { value: '093500' } }) // HH:mm:ss by default
    expect(input.value).toBe('09:35:00')
    expect(onChange).toHaveBeenCalledWith('09:35:00')
  })

  it('updates the hour from the column, preserving minutes/seconds, and stays open', () => {
    const onChange = vi.fn()
    render(<TimePicker label="Time" value="09:35:49" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open time picker' }))
    const hours = screen.getByRole('listbox', { name: 'Hour' })
    fireEvent.click(within(hours).getByRole('option', { name: '14' }))
    expect(onChange).toHaveBeenCalledWith('14:35:49')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('focuses the hours column when the popover opens', () => {
    render(<TimePicker label="Time" value="09:35:00" />)
    fireEvent.click(screen.getByRole('button', { name: 'Open time picker' }))
    const hours = screen.getByRole('listbox', { name: 'Hour' })
    expect(hours.contains(document.activeElement)).toBe(true)
  })

  it('honors minuteStep in the minutes column', () => {
    render(<TimePicker label="Time" value="09:00:00" minuteStep={15} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open time picker' }))
    const minutes = screen.getByRole('listbox', { name: 'Minute' })
    expect(within(minutes).getByRole('option', { name: '45' })).toBeInTheDocument()
    expect(within(minutes).queryByRole('option', { name: '05' })).toBeNull()
  })

  it('shows AM/PM + 1–12 hours in 12-hour mode', () => {
    render(<TimePicker label="Time" value="21:05:00" hour12 />)
    expect(screen.getByLabelText('Time')).toHaveValue('09:05:00 PM')
    fireEvent.click(screen.getByRole('button', { name: 'Open time picker' }))
    const hours = screen.getByRole('listbox', { name: 'Hour' })
    expect(within(hours).getByRole('option', { name: '12' })).toBeInTheDocument()
    expect(within(hours).queryByRole('option', { name: '13' })).toBeNull()
    expect(screen.getByRole('option', { name: 'PM' })).toHaveAttribute('aria-selected', 'true')
  })

  it('hides the seconds column and the :ss when showSeconds is false', () => {
    render(<TimePicker label="Time" value="09:35:49" showSeconds={false} />)
    expect(screen.getByLabelText('Time')).toHaveValue('09:35')
    fireEvent.click(screen.getByRole('button', { name: 'Open time picker' }))
    expect(screen.queryByRole('listbox', { name: 'Second' })).toBeNull()
  })

  it('preserves an unchanged value (incl. seconds) on blur', () => {
    const onChange = vi.fn()
    render(<TimePicker label="Time" value="09:35:49" onChange={onChange} />)
    fireEvent.blur(screen.getByLabelText('Time')) // same minute → no emit, seconds kept
    expect(onChange).not.toHaveBeenCalled()
  })

  it('clears the value via the clear button', () => {
    const onChange = vi.fn()
    render(<TimePicker label="Time" value="09:35:00" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear time' }))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('marks the field invalid and links the helper text', () => {
    render(<TimePicker label="Time" error helperText="Required" />)
    const input = screen.getByLabelText('Time')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby')
  })

  it('forwards the ref to the input', () => {
    const ref = createRef<HTMLInputElement>()
    render(<TimePicker label="Time" ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('binds to a surrounding <Form> by name', () => {
    function Harness() {
      const form = useForm({
        schema: z.object({ at: z.string().min(1, 'Required') }),
        defaultValues: { at: '' },
      })
      return (
        <Form form={form}>
          <TimePicker name="at" label="Time" />
        </Form>
      )
    }
    render(<Harness />)
    const input = screen.getByLabelText('Time') as HTMLInputElement
    fireEvent.change(input, { target: { value: '093500' } })
    expect(input.value).toBe('09:35:00')
  })
})
