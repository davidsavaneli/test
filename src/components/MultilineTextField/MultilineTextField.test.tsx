import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { z } from 'zod'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'
import { MultilineTextField } from './MultilineTextField'

describe('MultilineTextField', () => {
  it('renders a label associated with the textarea', () => {
    render(<MultilineTextField label="Bio" />)
    expect(screen.getByLabelText('Bio')).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('shows helper text', () => {
    render(<MultilineTextField label="Bio" helperText="Tell us about yourself" />)
    expect(screen.getByText('Tell us about yourself')).toBeInTheDocument()
  })

  it('marks the field invalid in the error state', () => {
    render(<MultilineTextField label="Bio" error helperText="Required" />)
    const textarea = screen.getByLabelText('Bio')
    expect(textarea).toHaveAttribute('aria-invalid', 'true')
    expect(textarea).toHaveAttribute('aria-describedby')
  })

  it('disables the textarea', () => {
    render(<MultilineTextField label="Bio" disabled />)
    expect(screen.getByLabelText('Bio')).toBeDisabled()
  })

  it('applies the size class', () => {
    const { container } = render(<MultilineTextField size="lg" label="Bio" />)
    expect(container.firstElementChild?.className).toContain('lg')
  })

  it('sets the starting rows from minRows', () => {
    render(<MultilineTextField label="Bio" minRows={5} />)
    expect(screen.getByLabelText('Bio')).toHaveAttribute('rows', '5')
  })

  it('forwards the ref to the textarea', () => {
    const ref = createRef<HTMLTextAreaElement>()
    render(<MultilineTextField label="Bio" ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('updates value and fires onChange (uncontrolled)', () => {
    const onChange = vi.fn()
    render(<MultilineTextField label="Bio" onChange={onChange} />)
    const textarea = screen.getByLabelText('Bio') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'hello\nworld' } })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(textarea.value).toBe('hello\nworld')
  })

  it('binds to a surrounding <Form> by name (string value)', () => {
    function Harness() {
      const form = useForm({
        schema: z.object({ bio: z.string().min(1, 'Required') }),
        defaultValues: { bio: '' },
      })
      return (
        <Form form={form}>
          <MultilineTextField name="bio" label="Bio" />
        </Form>
      )
    }
    render(<Harness />)
    const textarea = screen.getByLabelText('Bio') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'My story' } })
    expect(textarea.value).toBe('My story')
  })
})
