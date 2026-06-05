import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { z } from 'zod'
import { TextField } from '../components/TextField'
import { Form } from './Form'
import { useForm } from './useForm'

const schema = z.object({ email: z.string().email('Invalid email') })

function Harness({ onSubmit }: { onSubmit?: (values: { email: string }) => void }) {
  const form = useForm({ schema, defaultValues: { email: '' }, onSubmit })
  return (
    <Form form={form}>
      <TextField name="email" label="Email" />
      <button type="submit">Go</button>
    </Form>
  )
}

describe('Form + name binding', () => {
  it('binds a TextField by name (no field() spread)', () => {
    render(<Harness />)
    const input = screen.getByLabelText('Email') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'a@b.com' } })
    expect(input.value).toBe('a@b.com')
  })

  it('shows the field error after blur', () => {
    render(<Harness />)
    const input = screen.getByLabelText('Email')
    fireEvent.blur(input)
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('blocks an invalid submit and reveals the error', () => {
    const onSubmit = vi.fn()
    const { container } = render(<Harness onSubmit={onSubmit} />)
    fireEvent.submit(container.querySelector('form')!)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
  })

  it('submits parsed values when valid', () => {
    const onSubmit = vi.fn()
    const { container } = render(<Harness onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    fireEvent.submit(container.querySelector('form')!)
    expect(onSubmit).toHaveBeenCalledWith(
      { email: 'a@b.com' },
      expect.objectContaining({ reset: expect.any(Function) }),
    )
  })
})

describe('Form scroll-to-error', () => {
  const multi = z.object({
    email: z.string().email('Invalid email'),
    code: z.string().min(1, 'Required'),
  })

  function MultiHarness({ scrollToError }: { scrollToError?: boolean }) {
    const form = useForm({ schema: multi, defaultValues: { email: '', code: '' }, scrollToError })
    return (
      <Form form={form}>
        <TextField name="email" label="Email" />
        <TextField name="code" label="Code" />
        <button type="submit">Go</button>
      </Form>
    )
  }

  const rectAt = (top: number) => (): DOMRect => ({
    top,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })

  it('focuses the highest invalid field on a failed submit (by position, not DOM order)', () => {
    const { container } = render(<MultiHarness />)
    const email = screen.getByLabelText('Email') as HTMLInputElement
    const code = screen.getByLabelText('Code') as HTMLInputElement
    // make "code" sit higher than "email" — it must win even though "email" comes first
    email.getBoundingClientRect = rectAt(200)
    code.getBoundingClientRect = rectAt(50)

    fireEvent.submit(container.querySelector('form')!)
    expect(document.activeElement).toBe(code)
  })

  it('does not focus a field when scrollToError is false', () => {
    const { container } = render(<MultiHarness scrollToError={false} />)
    const email = screen.getByLabelText('Email')
    fireEvent.submit(container.querySelector('form')!)
    expect(document.activeElement).not.toBe(email)
  })
})
