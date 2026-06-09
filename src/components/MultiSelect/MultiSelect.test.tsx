import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { z } from 'zod'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'
import { MultiSelect } from './MultiSelect'
import type { SelectOption } from '../Select'

const OPTIONS: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'date', label: 'Date' },
]

describe('MultiSelect', () => {
  it('renders a labeled trigger and opens a multiselectable listbox', () => {
    render(<MultiSelect label="Fruits" options={OPTIONS} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruits' }))
    const listbox = screen.getByRole('listbox')
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true')
    expect(screen.getAllByRole('option')).toHaveLength(4)
  })

  it('shows the placeholder when nothing is selected', () => {
    render(<MultiSelect label="Fruits" options={OPTIONS} placeholder="Pick some" />)
    expect(screen.getByText('Pick some')).toBeInTheDocument()
  })

  it('toggles options on (accumulating) and keeps the popover open', () => {
    const onChange = vi.fn()
    render(<MultiSelect label="Fruits" options={OPTIONS} onChange={onChange} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruits' }))
    fireEvent.click(screen.getByRole('option', { name: 'Apple' }))
    expect(onChange).toHaveBeenLastCalledWith(['apple'])
    expect(screen.getByRole('listbox')).toBeInTheDocument() // stays open
    fireEvent.click(screen.getByRole('option', { name: 'Banana' }))
    expect(onChange).toHaveBeenLastCalledWith(['apple', 'banana'])
  })

  it('toggles a selected option back off', () => {
    const onChange = vi.fn()
    render(<MultiSelect label="Fruits" options={OPTIONS} value={['apple']} onChange={onChange} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruits' }))
    fireEvent.click(screen.getByRole('option', { name: 'Apple' }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('renders selected options as chips and removes one via its delete button', () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label="Fruits"
        options={OPTIONS}
        value={['apple', 'banana']}
        onChange={onChange}
      />,
    )
    expect(screen.getByRole('button', { name: 'Remove Apple' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove Apple' }))
    expect(onChange).toHaveBeenCalledWith(['banana'])
  })

  it('clears all via the clear button', () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label="Fruits"
        options={OPTIONS}
        value={['apple', 'banana']}
        clearable
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('does not toggle a disabled option', () => {
    const onChange = vi.fn()
    render(<MultiSelect label="Fruits" options={OPTIONS} onChange={onChange} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruits' }))
    fireEvent.click(screen.getByRole('option', { name: 'Cherry' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('toggles via the keyboard and stays open', () => {
    const onChange = vi.fn()
    render(<MultiSelect label="Fruits" options={OPTIONS} onChange={onChange} />)
    const trigger = screen.getByRole('combobox', { name: 'Fruits' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }) // open (highlights Apple)
    fireEvent.keyDown(trigger, { key: 'Enter' }) // toggle Apple
    expect(onChange).toHaveBeenCalledWith(['apple'])
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('removes the last chip on Backspace', () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label="Fruits"
        options={OPTIONS}
        value={['apple', 'date']}
        onChange={onChange}
      />,
    )
    const trigger = screen.getByRole('combobox', { name: 'Fruits' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }) // open
    fireEvent.keyDown(trigger, { key: 'Backspace' })
    expect(onChange).toHaveBeenCalledWith(['apple'])
  })

  it('clears the mouse highlight when the pointer leaves the list (no lingering hover)', () => {
    render(<MultiSelect label="Fruits" options={OPTIONS} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruits' }))
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveClass('active')
    fireEvent.mouseLeave(screen.getByRole('listbox'))
    expect(screen.getByRole('option', { name: 'Apple' })).not.toHaveClass('active')
  })

  it('filters options when searchable', () => {
    render(<MultiSelect label="Fruits" options={OPTIONS} searchable />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruits' }))
    fireEvent.change(screen.getByLabelText('Search…'), { target: { value: 'an' } })
    expect(screen.getAllByRole('option')).toHaveLength(1)
  })

  it('fires onSearchChange and skips local filtering (server-side search)', () => {
    const onSearchChange = vi.fn()
    render(
      <MultiSelect label="Fruits" options={OPTIONS} searchable onSearchChange={onSearchChange} />,
    )
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruits' }))
    fireEvent.change(screen.getByLabelText('Search…'), { target: { value: 'zzz' } })
    expect(onSearchChange).toHaveBeenCalledWith('zzz')
    expect(screen.getAllByRole('option')).toHaveLength(4)
  })

  it('shows a loading indicator in the popover', () => {
    render(
      <MultiSelect label="Fruits" options={OPTIONS} searchable loading loadingText="Fetching…" />,
    )
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruits' }))
    expect(screen.getByText('Fetching…')).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('marks the field invalid and links the helper text', () => {
    render(<MultiSelect label="Fruits" options={OPTIONS} error helperText="Pick at least one" />)
    const trigger = screen.getByRole('combobox', { name: 'Fruits' })
    expect(trigger).toHaveAttribute('aria-invalid', 'true')
    expect(trigger).toHaveAttribute('aria-describedby')
    expect(screen.getByText('Pick at least one')).toBeInTheDocument()
  })

  it('forwards the ref to the trigger', () => {
    const ref = createRef<HTMLDivElement>()
    render(<MultiSelect label="Fruits" options={OPTIONS} ref={ref} />)
    expect(ref.current).toHaveAttribute('role', 'combobox')
  })

  it('keeps chip delete buttons out of the tab order (the combobox owns focus)', () => {
    render(<MultiSelect label="Fruits" options={OPTIONS} value={['apple']} />)
    expect(screen.getByRole('button', { name: 'Remove Apple' })).toHaveAttribute('tabindex', '-1')
  })

  it('binds to a surrounding <Form> by name and submits a real string[]', async () => {
    const onSubmit = vi.fn()
    function Harness() {
      const form = useForm({
        schema: z.object({ fruits: z.array(z.string()).min(1, 'Required') }),
        defaultValues: { fruits: [] as string[] },
        onSubmit,
      })
      return (
        <Form form={form}>
          <MultiSelect name="fruits" label="Fruits" options={OPTIONS} />
          <button type="submit">Go</button>
        </Form>
      )
    }
    render(<Harness />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruits' }))
    fireEvent.click(screen.getByRole('option', { name: 'Apple' }))
    fireEvent.click(screen.getByRole('option', { name: 'Date' }))
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toEqual({ fruits: ['apple', 'date'] })
  })
})
