import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { z } from 'zod'
import { Form, useForm } from '../../form'
import { ChoiceCard } from './ChoiceCard'
import { ChoiceCardGroup, type ChoiceCardOption } from './ChoiceCardGroup'

const options: ChoiceCardOption[] = [
  { value: 'admin', label: 'Admin', description: 'Full access', icon: 'ShieldTick' },
  { value: 'user', label: 'User', description: 'Limited access', icon: 'User' },
  { value: 'guest', label: 'Guest', description: 'Read-only access', icon: 'Global' },
]

describe('ChoiceCardGroup', () => {
  it('renders a card (checkbox) per option in multiple mode', () => {
    render(<ChoiceCardGroup options={options} aria-label="Roles" />)
    expect(screen.getByRole('group', { name: 'Roles' })).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Full access')).toBeInTheDocument()
  })

  it('renders radios inside a radiogroup in exclusive mode', () => {
    render(<ChoiceCardGroup exclusive options={options} aria-label="Role" />)
    expect(screen.getByRole('radiogroup', { name: 'Role' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('toggles values on and off in multiple mode (string[])', () => {
    const onChange = vi.fn()
    render(<ChoiceCardGroup options={options} onChange={onChange} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /Admin/ }))
    expect(onChange).toHaveBeenLastCalledWith(['admin'])
    fireEvent.click(screen.getByRole('checkbox', { name: /User/ }))
    expect(onChange).toHaveBeenLastCalledWith(['admin', 'user'])
    fireEvent.click(screen.getByRole('checkbox', { name: /Admin/ }))
    expect(onChange).toHaveBeenLastCalledWith(['user'])
  })

  it('selects a single value in exclusive mode (string) and re-clicking keeps it', () => {
    const onChange = vi.fn()
    render(<ChoiceCardGroup exclusive options={options} onChange={onChange} />)
    const admin = screen.getByRole('radio', { name: /Admin/ })
    fireEvent.click(admin)
    expect(onChange).toHaveBeenLastCalledWith('admin')
    expect(admin).toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: /User/ }))
    expect(onChange).toHaveBeenLastCalledWith('user')
    expect(screen.getByRole('radio', { name: /User/ })).toBeChecked()
    expect(admin).not.toBeChecked()
  })

  it('respects defaultValue (uncontrolled) and value (controlled)', () => {
    const { unmount } = render(<ChoiceCardGroup exclusive options={options} defaultValue="guest" />)
    expect(screen.getByRole('radio', { name: /Guest/ })).toBeChecked()
    unmount()
    render(<ChoiceCardGroup options={options} value={['admin', 'guest']} />)
    expect(screen.getByRole('checkbox', { name: /Admin/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Guest/ })).toBeChecked()
  })

  it('does not fire for a disabled card', () => {
    const onChange = vi.fn()
    render(
      <ChoiceCardGroup
        options={[...options.slice(0, 2), { value: 'blocked', label: 'Blocked', disabled: true }]}
        onChange={onChange}
      />,
    )
    const blocked = screen.getByRole('checkbox', { name: /Blocked/ })
    expect(blocked).toBeDisabled()
    fireEvent.click(blocked)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('applies the error class and aria-invalid', () => {
    const { container } = render(<ChoiceCardGroup options={options} error aria-label="Roles" />)
    expect(screen.getByRole('group')).toHaveAttribute('aria-invalid', 'true')
    expect(container.querySelector('.error')).not.toBeNull()
  })

  it('renders a radio-style indicator in exclusive mode and a tick style in multiple', () => {
    const { container, rerender } = render(<ChoiceCardGroup exclusive options={options} />)
    expect(container.querySelector('.indicator.radioDot')).not.toBeNull()
    rerender(<ChoiceCardGroup options={options} />)
    expect(container.querySelector('.indicator.radioDot')).toBeNull()
    expect(container.querySelector('.indicator')).not.toBeNull()
  })

  it('smart-aligns by default: an icon card centers, an icon-less card left-aligns', () => {
    const { container } = render(
      <ChoiceCardGroup
        options={[
          { value: 'a', label: 'With Icon', icon: 'User' },
          { value: 'b', label: 'No Icon' },
        ]}
      />,
    )
    const cards = container.querySelectorAll('label')
    expect(cards[0].classList.contains('left')).toBe(false)
    expect(cards[1].classList.contains('left')).toBe(true)
  })

  it('align overrides the smart default (left with icons, center without)', () => {
    const { container, rerender } = render(
      <ChoiceCardGroup align="left" options={options} />, // all have icons → still left
    )
    let cards = container.querySelectorAll('label')
    expect([...cards].every((c) => c.classList.contains('left'))).toBe(true)
    rerender(<ChoiceCardGroup align="center" options={[{ value: 'b', label: 'No Icon' }]} />)
    cards = container.querySelectorAll('label')
    expect(cards[0].classList.contains('left')).toBe(false)
  })

  it('tints via the --tz-btn-rgb inline var from color', () => {
    const { container } = render(<ChoiceCardGroup options={options} color="success" />)
    const card = container.querySelector('label')
    expect(card?.getAttribute('style')).toContain('--tz-btn-rgb: var(--tz-color-success-rgb)')
  })

  it('binds to a <Form> by name (exclusive → string)', () => {
    function Demo() {
      const form = useForm({
        schema: z.object({ role: z.string().min(1) }),
        defaultValues: { role: '' },
      })
      return (
        <Form form={form}>
          <ChoiceCardGroup exclusive name="role" options={options} aria-label="Role" />
          <output data-testid="value">{String(form.values.role)}</output>
        </Form>
      )
    }
    render(<Demo />)
    fireEvent.click(screen.getByRole('radio', { name: /User/ }))
    expect(screen.getByTestId('value')).toHaveTextContent('user')
  })
})

describe('ChoiceCard (standalone)', () => {
  it('works as a single checkbox card', () => {
    const onChange = vi.fn()
    render(<ChoiceCard value="terms" label="Accept Terms" onChange={onChange} />)
    const box = screen.getByRole('checkbox', { name: /Accept Terms/ })
    fireEvent.click(box)
    expect(onChange).toHaveBeenLastCalledWith(true)
    expect(box).toBeChecked()
    fireEvent.click(box)
    expect(onChange).toHaveBeenLastCalledWith(false)
  })

  it('forwards the ref to the input', () => {
    const ref = createRef<HTMLInputElement>()
    render(<ChoiceCard value="a" label="A" ref={ref} />)
    expect(ref.current?.tagName).toBe('INPUT')
  })
})
