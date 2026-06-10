import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { z } from 'zod'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'
import { DateTimePicker } from './DateTimePicker'

describe('DateTimePicker', () => {
  it('renders a label associated with the input', () => {
    render(<DateTimePicker label="When" />)
    expect(screen.getByLabelText('When')).toBeInstanceOf(HTMLInputElement)
  })

  it('formats the controlled datetime value (date + time) in the input', () => {
    render(<DateTimePicker label="When" value="2026-06-10T09:35:00" />)
    expect(screen.getByLabelText('When')).toHaveValue('10/06/2026 09:35:00') // seconds shown by default
  })

  it('leniently accepts a full backend datetime (sub-second) and shows date + time', () => {
    render(<DateTimePicker label="When" value="2026-06-10T09:35:49.6134342" />)
    expect(screen.getByLabelText('When')).toHaveValue('10/06/2026 09:35:49')
  })

  it('opens a dialog with a calendar grid and time listboxes', () => {
    render(<DateTimePicker label="When" value="2026-06-10T09:35:00" />)
    fireEvent.click(screen.getByRole('button', { name: 'Open date and time picker' }))
    expect(screen.getByRole('dialog', { name: 'Choose date and time' })).toBeInTheDocument()
    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: 'Hour' })).toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: 'Minute' })).toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: 'Second' })).toBeInTheDocument()
  })

  it('commits a typed datetime as an ISO datetime string', () => {
    const onChange = vi.fn()
    render(<DateTimePicker label="When" onChange={onChange} />)
    const input = screen.getByLabelText('When') as HTMLInputElement
    fireEvent.change(input, { target: { value: '10062026093500' } }) // HH:mm:ss by default
    expect(input.value).toBe('10/06/2026 09:35:00')
    expect(onChange).toHaveBeenCalledWith('2026-06-10T09:35:00Z') // default UTC valueFormat → Z
  })

  it('keeps the time when a new day is picked and leaves the popover open', () => {
    const onChange = vi.fn()
    render(<DateTimePicker label="When" value="2026-06-10T09:35:00" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open date and time picker' }))
    const grid = screen.getByRole('grid')
    fireEvent.keyDown(grid, { key: 'ArrowRight' }) // June 10 → 11
    fireEvent.keyDown(grid, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('2026-06-11T09:35:00Z') // time preserved
    expect(screen.getByRole('dialog')).toBeInTheDocument() // stays open for time editing
  })

  it('updates the hour from the time column, preserving minutes/seconds', () => {
    const onChange = vi.fn()
    render(<DateTimePicker label="When" value="2026-06-10T09:35:49" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open date and time picker' }))
    const hours = screen.getByRole('listbox', { name: 'Hour' })
    fireEvent.click(within(hours).getByRole('option', { name: '14' }))
    expect(onChange).toHaveBeenCalledWith('2026-06-10T14:35:49Z')
  })

  it('honors minuteStep in the minutes column', () => {
    render(<DateTimePicker label="When" value="2026-06-10T09:00:00" minuteStep={15} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open date and time picker' }))
    const minutes = screen.getByRole('listbox', { name: 'Minute' })
    expect(within(minutes).getByRole('option', { name: '30' })).toBeInTheDocument()
    expect(within(minutes).queryByRole('option', { name: '05' })).toBeNull()
  })

  it('shows AM/PM and 1–12 hours in 12-hour mode', () => {
    render(<DateTimePicker label="When" value="2026-06-10T21:05:00" hour12 />)
    expect(screen.getByLabelText('When')).toHaveValue('10/06/2026 09:05:00 PM')
    fireEvent.click(screen.getByRole('button', { name: 'Open date and time picker' }))
    const hours = screen.getByRole('listbox', { name: 'Hour' })
    expect(within(hours).getByRole('option', { name: '12' })).toBeInTheDocument()
    expect(within(hours).queryByRole('option', { name: '13' })).toBeNull()
    expect(screen.getByRole('option', { name: 'PM' })).toHaveAttribute('aria-selected', 'true')
  })

  it('does not convert timezones when utc is false (shows + emits the exact wall-clock)', () => {
    const onChange = vi.fn()
    render(
      <DateTimePicker label="When" utc={false} value="2026-06-10T09:35:00" onChange={onChange} />,
    )
    expect(screen.getByLabelText('When')).toHaveValue('10/06/2026 09:35:00')
    fireEvent.click(screen.getByRole('button', { name: 'Open date and time picker' }))
    const hours = screen.getByRole('listbox', { name: 'Hour' })
    fireEvent.click(within(hours).getByRole('option', { name: '14' }))
    expect(onChange).toHaveBeenCalledWith('2026-06-10T14:35:00') // picked wall-clock, no UTC shift
  })

  it('hides the seconds column when showSeconds is false', () => {
    render(<DateTimePicker label="When" value="2026-06-10T09:35:49" showSeconds={false} />)
    expect(screen.getByLabelText('When')).toHaveValue('10/06/2026 09:35')
    fireEvent.click(screen.getByRole('button', { name: 'Open date and time picker' }))
    expect(screen.queryByRole('listbox', { name: 'Second' })).toBeNull()
  })

  it('clamps minuteStep to ≥ 1 (a 0 step neither hangs nor empties the column)', () => {
    render(<DateTimePicker label="When" value="2026-06-10T09:00:00" minuteStep={0} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open date and time picker' }))
    const minutes = screen.getByRole('listbox', { name: 'Minute' })
    expect(within(minutes).getByRole('option', { name: '01' })).toBeInTheDocument() // fell back to step 1
  })

  it('commits typed seconds when the format shows them (precision tracks the format)', () => {
    const onChange = vi.fn()
    render(
      <DateTimePicker
        label="When"
        format="DD/MM/YYYY HH:mm:ss"
        value="2026-06-10T09:35:10"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText('When'), { target: { value: '10062026093542' } })
    expect(onChange).toHaveBeenCalledWith('2026-06-10T09:35:42Z')
  })

  it('does not re-emit when re-picking the already-selected time (sub-second source value)', () => {
    const onChange = vi.fn()
    render(<DateTimePicker label="When" value="2026-06-10T09:35:49.6134342" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open date and time picker' }))
    const hours = screen.getByRole('listbox', { name: 'Hour' })
    fireEvent.click(within(hours).getByRole('option', { name: '09' })) // already selected → no-op
    expect(onChange).not.toHaveBeenCalled()
  })

  it('commits a typed lowercase-meridiem format', () => {
    const onChange = vi.fn()
    render(<DateTimePicker label="When" hour12 format="DD/MM/YYYY hh:mm a" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('When'), { target: { value: '100620260905pm' } })
    expect(onChange).toHaveBeenCalledWith('2026-06-10T21:05:00Z')
  })

  it('gives the AM/PM listbox a single roving tab stop', () => {
    render(<DateTimePicker label="When" value="2026-06-10T21:05:00" hour12 />)
    fireEvent.click(screen.getByRole('button', { name: 'Open date and time picker' }))
    const meridiem = screen.getByRole('listbox', { name: 'AM/PM' })
    expect(meridiem.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
  })

  it('preserves an unchanged value (incl. seconds) on blur', () => {
    const onChange = vi.fn()
    render(<DateTimePicker label="When" value="2026-06-10T09:35:49" onChange={onChange} />)
    fireEvent.blur(screen.getByLabelText('When')) // same minute → no emit, seconds kept
    expect(onChange).not.toHaveBeenCalled()
  })

  it('clears the value via the clear button', () => {
    const onChange = vi.fn()
    render(<DateTimePicker label="When" value="2026-06-10T09:35:00" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear value' }))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('marks the field invalid and links the helper text', () => {
    render(<DateTimePicker label="When" error helperText="Required" />)
    const input = screen.getByLabelText('When')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby')
  })

  it('forwards the ref to the input', () => {
    const ref = createRef<HTMLInputElement>()
    render(<DateTimePicker label="When" ref={ref} />)
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
          <DateTimePicker name="at" label="When" />
        </Form>
      )
    }
    render(<Harness />)
    const input = screen.getByLabelText('When') as HTMLInputElement
    fireEvent.change(input, { target: { value: '10062026093500' } })
    expect(input.value).toBe('10/06/2026 09:35:00')
  })
})
