import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { z } from 'zod'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'
import { DatePicker } from './DatePicker'

describe('DatePicker', () => {
  it('renders a label associated with the input', () => {
    render(<DatePicker label="Date" />)
    expect(screen.getByLabelText('Date')).toBeInstanceOf(HTMLInputElement)
  })

  it('formats the controlled value in the input', () => {
    render(<DatePicker label="Date" value="2026-06-15" />)
    expect(screen.getByLabelText('Date')).toHaveValue('15/06/2026')
  })

  it('respects a custom format', () => {
    render(<DatePicker label="Date" value="2026-06-15" format="YYYY-MM-DD" />)
    expect(screen.getByLabelText('Date')).toHaveValue('2026-06-15')
  })

  it('opens the calendar on the calendar button and renders a grid', () => {
    render(<DatePicker label="Date" value="2026-06-15" />)
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }))
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeInTheDocument()
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('commits a masked typed value as an ISO date', () => {
    const onChange = vi.fn()
    render(<DatePicker label="Date" onChange={onChange} />)
    const input = screen.getByLabelText('Date') as HTMLInputElement
    fireEvent.change(input, { target: { value: '20062026' } }) // digits only → masked
    expect(input.value).toBe('20/06/2026')
    expect(onChange).toHaveBeenCalledWith('2026-06-20T00:00:00') // default valueFormat is ISO datetime
  })

  it('leniently accepts a full backend datetime value and shows the date', () => {
    render(<DatePicker label="Date" value="2026-06-10T09:35:49.6134342" />)
    expect(screen.getByLabelText('Date')).toHaveValue('10/06/2026')
  })

  it('emits onChange in a custom valueFormat at the start of the UTC day', () => {
    const onChange = vi.fn()
    render(
      <DatePicker
        label="Date"
        value="2026-06-10T09:35:49"
        valueFormat="YYYY-MM-DDTHH:mm:ss"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }))
    const grid = screen.getByRole('grid')
    fireEvent.keyDown(grid, { key: 'ArrowRight' }) // June 10 → 11
    fireEvent.keyDown(grid, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('2026-06-11T00:00:00')
  })

  it('round-trips a typed value into the configured valueFormat', () => {
    const onChange = vi.fn()
    render(<DatePicker label="Date" valueFormat="YYYY-MM-DDTHH:mm:ss" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '20062026' } })
    expect(onChange).toHaveBeenCalledWith('2026-06-20T00:00:00')
  })

  it('preserves an unchanged value (incl. its time) on blur, emits midnight only on a new day', () => {
    const onChange = vi.fn()
    render(<DatePicker label="Date" value="2026-06-15T09:35:49" onChange={onChange} />)
    const input = screen.getByLabelText('Date') as HTMLInputElement
    expect(input.value).toBe('15/06/2026')
    fireEvent.blur(input) // same day → no emit, original time kept
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: '20062026' } }) // new day → start-of-day datetime
    expect(onChange).toHaveBeenCalledWith('2026-06-20T00:00:00')
  })

  it('does not commit an incomplete/invalid typed value', () => {
    const onChange = vi.fn()
    render(<DatePicker label="Date" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '20/06' } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('selects a day via the keyboard (Arrow + Enter) and closes', () => {
    const onChange = vi.fn()
    render(<DatePicker label="Date" value="2026-06-15" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }))
    const grid = screen.getByRole('grid')
    fireEvent.keyDown(grid, { key: 'ArrowRight' }) // June 15 → 16
    fireEvent.keyDown(grid, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('2026-06-16T00:00:00')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not select a disabled (out-of-range) day', () => {
    const onChange = vi.fn()
    render(<DatePicker label="Date" value="2026-06-15" min="2026-06-15" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }))
    const grid = screen.getByRole('grid')
    fireEvent.keyDown(grid, { key: 'ArrowLeft' }) // → June 14, before min
    fireEvent.keyDown(grid, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('navigates year → month → day via the separate header pickers', () => {
    render(<DatePicker label="Date" value="2026-06-15" />)
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }))
    fireEvent.click(screen.getByRole('button', { name: '2026' })) // year label → year listbox
    fireEvent.click(screen.getByRole('option', { name: '2024' })) // pick year → month listbox
    fireEvent.click(screen.getByRole('option', { name: 'March' })) // pick month → day view
    expect(screen.getByRole('grid')).toBeInTheDocument()
    // the day-view header now reads "March 2024" (two separate labels)
    expect(screen.getByRole('button', { name: 'March' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2024' })).toBeInTheDocument()
  })

  it('opens the month picker from the header month label', () => {
    render(<DatePicker label="Date" value="2026-06-15" />)
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }))
    fireEvent.click(screen.getByRole('button', { name: 'June' })) // month label → month listbox
    expect(screen.getByRole('option', { name: 'June' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('option', { name: 'August' })) // pick month → day view
    expect(screen.getByRole('button', { name: 'August' })).toBeInTheDocument() // header month label
  })

  it('marks the selected year as selected in the year listbox', () => {
    render(<DatePicker label="Date" value="2026-06-15" />)
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }))
    fireEvent.click(screen.getByRole('button', { name: '2026' })) // year label → year listbox
    expect(screen.getByRole('option', { name: '2026' })).toHaveAttribute('aria-selected', 'true')
  })

  it('keeps a focusable year cell when arrowing past a min/max bound', () => {
    render(<DatePicker label="Date" value="2025-06-15" min="2024-01-01" max="2026-12-31" />)
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }))
    fireEvent.click(screen.getByRole('button', { name: '2025' })) // → year listbox
    const listbox = screen.getByRole('listbox')
    fireEvent.keyDown(listbox, { key: 'ArrowDown' }) // +3 → clamps to 2026
    fireEvent.keyDown(listbox, { key: 'ArrowDown' }) // would overshoot → stays clamped
    const tabbable = listbox.querySelector('[tabindex="0"]') // roving cell must still exist
    expect(tabbable).not.toBeNull()
    const year = Number(tabbable?.textContent)
    expect(year).toBeGreaterThanOrEqual(2024)
    expect(year).toBeLessThanOrEqual(2026)
  })

  it('clears the value via the clear button', () => {
    const onChange = vi.fn()
    render(<DatePicker label="Date" value="2026-06-15" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear date' }))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('clears the value when the input is emptied by keyboard', () => {
    const onChange = vi.fn()
    render(<DatePicker label="Date" value="2026-06-15" onChange={onChange} />)
    const input = screen.getByLabelText('Date') as HTMLInputElement
    fireEvent.change(input, { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith('')
    expect(input).toHaveValue('')
  })

  it('does not re-fire onChange on blur of an unchanged value', () => {
    const onChange = vi.fn()
    render(<DatePicker label="Date" value="2026-06-15" onChange={onChange} />)
    fireEvent.blur(screen.getByLabelText('Date'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('traps Tab focus within the open calendar dialog', () => {
    render(<DatePicker label="Date" value="2026-06-15" />)
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }))
    const dialog = screen.getByRole('dialog', { name: 'Choose date' })
    const focusables = dialog.querySelectorAll<HTMLElement>(
      'button:not([tabindex="-1"]):not(:disabled), [tabindex="0"]',
    )
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    last.focus()
    fireEvent.keyDown(dialog, { key: 'Tab' }) // forward from the last wraps to the first
    expect(document.activeElement).toBe(first)
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true }) // back from the first wraps to the last
    expect(document.activeElement).toBe(last)
  })

  it('marks the field invalid and links the helper text', () => {
    render(<DatePicker label="Date" error helperText="Required" />)
    const input = screen.getByLabelText('Date')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby')
    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('forwards the ref to the input', () => {
    const ref = createRef<HTMLInputElement>()
    render(<DatePicker label="Date" ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('binds to a surrounding <Form> by name (ISO string value)', () => {
    const onSubmit = vi.fn()
    function Harness() {
      const form = useForm({
        schema: z.object({ date: z.string().min(1, 'Required') }),
        defaultValues: { date: '' },
        onSubmit,
      })
      return (
        <Form form={form}>
          <DatePicker name="date" label="Date" />
        </Form>
      )
    }
    render(<Harness />)
    const input = screen.getByLabelText('Date') as HTMLInputElement
    fireEvent.change(input, { target: { value: '01/01/2026' } })
    expect(input.value).toBe('01/01/2026')
  })
})
