import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { z } from 'zod'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'
import { TagsField } from './TagsField'

describe('TagsField', () => {
  it('renders a label associated with the input', () => {
    render(<TagsField label="Tags" />)
    expect(screen.getByLabelText('Tags')).toBeInstanceOf(HTMLInputElement)
  })

  it('adds a tag on Enter (array value by default)', () => {
    const onChange = vi.fn()
    render(<TagsField label="Tags" onChange={onChange} />)
    const input = screen.getByLabelText('Tags')
    fireEvent.change(input, { target: { value: 'react' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(['react'])
    expect(screen.getByText('react')).toBeInTheDocument()
  })

  it('adds a tag via the add button', () => {
    const onChange = vi.fn()
    render(<TagsField label="Tags" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'vue' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add tag' }))
    expect(onChange).toHaveBeenCalledWith(['vue'])
  })

  it('adds a tag when the separator key is pressed', () => {
    const onChange = vi.fn()
    render(<TagsField label="Tags" separator=";" onChange={onChange} />)
    const input = screen.getByLabelText('Tags')
    fireEvent.change(input, { target: { value: 'node' } })
    fireEvent.keyDown(input, { key: ';' })
    expect(onChange).toHaveBeenCalledWith(['node'])
  })

  it('parses a separator-joined string value into chips', () => {
    render(<TagsField label="Tags" value="react;typescript" separator=";" />)
    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.getByText('typescript')).toBeInTheDocument()
  })

  it('parses an array value into chips', () => {
    render(<TagsField label="Tags" value={['a', 'b', 'c']} />)
    expect(screen.getByText('a')).toBeInTheDocument()
    expect(screen.getByText('c')).toBeInTheDocument()
  })

  it('emits a joined string when the value is a string (mirrors the shape)', () => {
    const onChange = vi.fn()
    render(<TagsField label="Tags" value="react;typescript" separator=";" onChange={onChange} />)
    // remove the first tag via its chip delete button
    fireEvent.click(screen.getByRole('button', { name: 'Remove react' }))
    expect(onChange).toHaveBeenCalledWith('typescript')
  })

  it('removes the last tag on Backspace when the input is empty', () => {
    const onChange = vi.fn()
    render(<TagsField label="Tags" defaultValue={['a', 'b']} onChange={onChange} />)
    fireEvent.keyDown(screen.getByLabelText('Tags'), { key: 'Backspace' })
    expect(onChange).toHaveBeenCalledWith(['a'])
  })

  it('ignores duplicate tags by default', () => {
    const onChange = vi.fn()
    render(<TagsField label="Tags" defaultValue={['react']} onChange={onChange} />)
    const input = screen.getByLabelText('Tags')
    fireEvent.change(input, { target: { value: 'react' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('allows duplicates when allowDuplicates is set', () => {
    const onChange = vi.fn()
    render(<TagsField label="Tags" allowDuplicates defaultValue={['react']} onChange={onChange} />)
    const input = screen.getByLabelText('Tags')
    fireEvent.change(input, { target: { value: 'react' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(['react', 'react'])
  })

  it('splits pasted text on the separator', () => {
    const onChange = vi.fn()
    render(<TagsField label="Tags" separator=";" onChange={onChange} />)
    const input = screen.getByLabelText('Tags')
    fireEvent.paste(input, { clipboardData: { getData: () => 'react;typescript;node' } })
    expect(onChange).toHaveBeenCalledWith(['react', 'typescript', 'node'])
  })

  it('marks the field invalid in the error state', () => {
    render(<TagsField label="Tags" error helperText="Add at least one" />)
    const input = screen.getByLabelText('Tags')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby')
    expect(screen.getByText('Add at least one')).toBeInTheDocument()
  })

  it('disables the input', () => {
    render(<TagsField label="Tags" disabled defaultValue={['x']} />)
    expect(screen.getByLabelText('Tags')).toBeDisabled()
  })

  it('forwards the ref to the input', () => {
    const ref = createRef<HTMLInputElement>()
    render(<TagsField label="Tags" ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('binds to a surrounding <Form> by name (array value)', () => {
    function Harness() {
      const form = useForm({
        schema: z.object({ tags: z.array(z.string()).min(1, 'Required') }),
        defaultValues: { tags: [] as string[] },
      })
      return (
        <Form form={form}>
          <TagsField name="tags" label="Tags" />
        </Form>
      )
    }
    render(<Harness />)
    const input = screen.getByLabelText('Tags')
    fireEvent.change(input, { target: { value: 'react' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('react')).toBeInTheDocument()
  })

  it('form-bound array schema stores & submits a real string[] (not a joined string)', async () => {
    const onSubmit = vi.fn()
    function Harness() {
      const form = useForm({
        schema: z.object({ tags: z.array(z.string()).min(1, 'Required') }),
        defaultValues: { tags: [] as string[] },
        onSubmit,
      })
      return (
        <Form form={form}>
          <TagsField name="tags" label="Tags" />
          <button type="submit">Go</button>
        </Form>
      )
    }
    render(<Harness />)
    const input = screen.getByLabelText('Tags')
    fireEvent.change(input, { target: { value: 'react' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toEqual({ tags: ['react'] })
  })

  it('form-bound string schema stores & submits a separator-joined string', async () => {
    const onSubmit = vi.fn()
    function Harness() {
      const form = useForm({
        schema: z.object({ tags: z.string().min(1) }),
        defaultValues: { tags: '' },
        onSubmit,
      })
      return (
        <Form form={form}>
          <TagsField name="tags" label="Tags" separator=";" />
          <button type="submit">Go</button>
        </Form>
      )
    }
    render(<Harness />)
    const input = screen.getByLabelText('Tags')
    fireEvent.change(input, { target: { value: 'react' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.change(input, { target: { value: 'ts' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toEqual({ tags: 'react;ts' })
  })

  it('renders a form-bound array value as separate chips regardless of separator', () => {
    function Harness() {
      const form = useForm({
        schema: z.object({ tags: z.array(z.string()) }),
        defaultValues: { tags: ['a', 'b'] },
      })
      return (
        <Form form={form}>
          <TagsField name="tags" label="Tags" separator=";" />
        </Form>
      )
    }
    render(<Harness />)
    expect(screen.getByText('a')).toBeInTheDocument()
    expect(screen.getByText('b')).toBeInTheDocument()
  })

  it('does not commit a tag when Enter fires during IME composition', () => {
    const onChange = vi.fn()
    render(<TagsField label="Tags" onChange={onChange} />)
    const input = screen.getByLabelText('Tags')
    fireEvent.change(input, { target: { value: 'にほん' } })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('treats an empty separator as no split (no per-character explosion)', () => {
    const onChange = vi.fn()
    render(<TagsField label="Tags" separator="" onChange={onChange} />)
    const input = screen.getByLabelText('Tags')
    fireEvent.change(input, { target: { value: 'hello' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(['hello'])
  })
})
