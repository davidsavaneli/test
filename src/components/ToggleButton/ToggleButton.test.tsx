import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ToggleButton } from './ToggleButton'
import { ToggleButtonGroup } from './ToggleButtonGroup'

describe('ToggleButton (standalone)', () => {
  it('reflects selected via aria-pressed and the selected class', () => {
    const { rerender } = render(
      <ToggleButton value="bold" selected={false}>
        Bold
      </ToggleButton>,
    )
    const btn = screen.getByRole('button', { name: 'Bold' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(btn).not.toHaveClass('selected')

    rerender(
      <ToggleButton value="bold" selected>
        Bold
      </ToggleButton>,
    )
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    expect(btn).toHaveClass('selected')
  })

  it('fires onChange with the toggled state + value', () => {
    const onChange = vi.fn()
    render(
      <ToggleButton value="bold" selected={false} onChange={onChange}>
        Bold
      </ToggleButton>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Bold' }))
    expect(onChange).toHaveBeenCalledWith(true, 'bold')
  })

  it('sets the --tz-btn-rgb var from color and defaults to primary', () => {
    const { rerender } = render(<ToggleButton value="a">A</ToggleButton>)
    expect(screen.getByRole('button').style.getPropertyValue('--tz-btn-rgb')).toBe(
      'var(--tz-color-primary-rgb)',
    )
    rerender(
      <ToggleButton value="a" color="success">
        A
      </ToggleButton>,
    )
    expect(screen.getByRole('button').style.getPropertyValue('--tz-btn-rgb')).toBe(
      'var(--tz-color-success-rgb)',
    )
  })

  it('does not fire onChange when disabled', () => {
    const onChange = vi.fn()
    render(
      <ToggleButton value="a" disabled onChange={onChange}>
        A
      </ToggleButton>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('forwards the ref to the button', () => {
    const ref = createRef<HTMLButtonElement>()
    render(
      <ToggleButton value="a" ref={ref}>
        A
      </ToggleButton>,
    )
    expect(ref.current?.tagName).toBe('BUTTON')
  })
})

const ALIGN = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
]

describe('ToggleButtonGroup', () => {
  it('renders a role="group" of data-driven options', () => {
    render(<ToggleButtonGroup options={ALIGN} />)
    expect(screen.getByRole('group')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('exclusive: selects a value, and deselects it (→ null) when clicked again', () => {
    const onChange = vi.fn()
    render(<ToggleButtonGroup exclusive options={ALIGN} defaultValue="left" onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Left' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Center' }))
    expect(onChange).toHaveBeenLastCalledWith('center')
    expect(screen.getByRole('button', { name: 'Center' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Left' })).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(screen.getByRole('button', { name: 'Center' }))
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('multiple (default): toggles values in and out of an array', () => {
    const onChange = vi.fn()
    render(<ToggleButtonGroup options={ALIGN} defaultValue={['left']} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Center' }))
    expect(onChange).toHaveBeenLastCalledWith(['left', 'center'])

    fireEvent.click(screen.getByRole('button', { name: 'Left' }))
    expect(onChange).toHaveBeenLastCalledWith(['center'])
  })

  it('disables every button when the group is disabled', () => {
    const onChange = vi.fn()
    render(<ToggleButtonGroup exclusive disabled options={ALIGN} onChange={onChange} />)
    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: 'Left' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('honors a controlled value', () => {
    render(<ToggleButtonGroup exclusive options={ALIGN} value="right" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Right' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Left' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('works with <ToggleButton> children sharing group context', () => {
    const onChange = vi.fn()
    render(
      <ToggleButtonGroup exclusive onChange={onChange}>
        <ToggleButton value="a">A</ToggleButton>
        <ToggleButton value="b">B</ToggleButton>
      </ToggleButtonGroup>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'B' }))
    expect(onChange).toHaveBeenLastCalledWith('b')
  })

  it('forwards the ref to the group element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<ToggleButtonGroup ref={ref} options={ALIGN} />)
    expect(ref.current).toHaveAttribute('role', 'group')
  })
})
