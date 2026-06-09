import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { z } from 'zod'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'
import { Select, type SelectOption } from './Select'

const OPTIONS: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'date', label: 'Date' },
]

describe('Select', () => {
  it('renders a labeled trigger and opens the listbox on click', () => {
    render(<Select label="Fruit" options={OPTIONS} />)
    const trigger = screen.getByRole('combobox', { name: 'Fruit' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(trigger)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(4)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows the placeholder when nothing is selected', () => {
    render(<Select label="Fruit" options={OPTIONS} placeholder="Pick one" />)
    expect(screen.getByText('Pick one')).toBeInTheDocument()
  })

  it('shows the selected option label', () => {
    render(<Select label="Fruit" options={OPTIONS} value="banana" />)
    expect(screen.getByText('Banana')).toBeInTheDocument()
  })

  it('selects an option through onChange and closes', () => {
    const onChange = vi.fn()
    render(<Select label="Fruit" options={OPTIONS} onChange={onChange} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }))
    fireEvent.click(screen.getByRole('option', { name: 'Banana' }))
    expect(onChange).toHaveBeenCalledWith('banana')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('does not select a disabled option', () => {
    const onChange = vi.fn()
    render(<Select label="Fruit" options={OPTIONS} onChange={onChange} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }))
    fireEvent.click(screen.getByRole('option', { name: 'Cherry' }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('marks the selected option with aria-selected', () => {
    render(<Select label="Fruit" options={OPTIONS} value="date" />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }))
    expect(screen.getByRole('option', { name: 'Date', selected: true })).toBeInTheDocument()
  })

  it('opens and selects via the keyboard', () => {
    const onChange = vi.fn()
    render(<Select label="Fruit" options={OPTIONS} onChange={onChange} />)
    const trigger = screen.getByRole('combobox', { name: 'Fruit' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }) // open (highlights first enabled = Apple)
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }) // → Banana
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('banana')
  })

  it('closes on Escape without selecting', () => {
    const onChange = vi.fn()
    render(<Select label="Fruit" options={OPTIONS} onChange={onChange} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }))
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Fruit' }), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('clears the value via the clear button', () => {
    const onChange = vi.fn()
    render(<Select label="Fruit" options={OPTIONS} value="apple" clearable onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('filters options when searchable', () => {
    render(<Select label="Fruit" options={OPTIONS} searchable />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }))
    fireEvent.change(screen.getByLabelText('Search…'), { target: { value: 'an' } })
    const opts = screen.getAllByRole('option')
    expect(opts).toHaveLength(1) // only "Banana"
    expect(opts[0]).toHaveTextContent('Banana')
  })

  it('shows the empty message when no option matches', () => {
    render(<Select label="Fruit" options={OPTIONS} searchable noOptionsText="Nothing here" />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }))
    fireEvent.change(screen.getByLabelText('Search…'), { target: { value: 'zzz' } })
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('clears the mouse highlight when the pointer leaves the list (no lingering hover)', () => {
    render(<Select label="Fruit" options={OPTIONS} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }))
    // on open the first enabled option is highlighted
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveClass('active')
    fireEvent.mouseLeave(screen.getByRole('listbox'))
    expect(screen.getByRole('option', { name: 'Apple' })).not.toHaveClass('active')
  })

  it('does not open when disabled', () => {
    render(<Select label="Fruit" options={OPTIONS} disabled />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('marks the field invalid and links the helper text', () => {
    render(<Select label="Fruit" options={OPTIONS} error helperText="Required" />)
    const trigger = screen.getByRole('combobox', { name: 'Fruit' })
    expect(trigger).toHaveAttribute('aria-invalid', 'true')
    expect(trigger).toHaveAttribute('aria-describedby')
    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('forwards the ref to the trigger', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Select label="Fruit" options={OPTIONS} ref={ref} />)
    expect(ref.current).toHaveAttribute('role', 'combobox')
  })

  it('binds to a surrounding <Form> by name (string value)', () => {
    const onSubmit = vi.fn()
    function Harness() {
      const form = useForm({
        schema: z.object({ fruit: z.string().min(1, 'Required') }),
        defaultValues: { fruit: '' },
        onSubmit,
      })
      return (
        <Form form={form}>
          <Select name="fruit" label="Fruit" options={OPTIONS} />
          <button type="submit">Go</button>
        </Form>
      )
    }
    render(<Harness />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }))
    fireEvent.click(screen.getByRole('option', { name: 'Apple' }))
    // the form value reflects the selection → the trigger shows it
    const trigger = screen.getByRole('combobox', { name: 'Fruit' })
    expect(within(trigger).getByText('Apple')).toBeInTheDocument()
  })

  it('marks a form-bound field touched on a searchable open→outside dismiss (error shows)', () => {
    function Harness() {
      const form = useForm({
        schema: z.object({ fruit: z.string().min(1, 'Required') }),
        defaultValues: { fruit: '' },
      })
      return (
        <Form form={form}>
          <Select name="fruit" label="Fruit" options={OPTIONS} searchable />
        </Form>
      )
    }
    render(<Harness />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }))
    fireEvent.pointerDown(document.body) // dismiss without selecting
    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('opens a searchable Select with the Space key', () => {
    render(<Select label="Fruit" options={OPTIONS} searchable />)
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Fruit' }), { key: ' ' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('lets a value not present in options still be cleared', () => {
    const onChange = vi.fn()
    render(<Select label="Fruit" options={OPTIONS} value="xyz" clearable onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('does not put aria-current on the selected option', () => {
    render(<Select label="Fruit" options={OPTIONS} value="date" />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }))
    const opt = screen.getByRole('option', { name: 'Date' })
    expect(opt).toHaveAttribute('aria-selected', 'true')
    expect(opt).not.toHaveAttribute('aria-current')
  })

  it('keeps the listbox (with its id) rendered even when no option matches', () => {
    render(<Select label="Fruit" options={OPTIONS} searchable />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }))
    fireEvent.change(screen.getByLabelText('Search…'), { target: { value: 'zzz' } })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })
})
