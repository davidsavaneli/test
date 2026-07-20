import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import { Icon } from '../Icon'
import { TextField } from './TextField'

describe('TextField', () => {
  it('renders a label associated with the input', () => {
    render(<TextField label="Title" />)
    expect(screen.getByLabelText('Title')).toBeInstanceOf(HTMLInputElement)
  })

  it('shows helper text', () => {
    render(<TextField label="Title" helperText="Required" />)
    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('marks the field invalid in the error state', () => {
    render(<TextField label="Title" error helperText="Required" />)
    const input = screen.getByLabelText('Title')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby')
  })

  it('disables the input', () => {
    render(<TextField label="Title" disabled />)
    expect(screen.getByLabelText('Title')).toBeDisabled()
  })

  it('applies the size class', () => {
    const { container } = render(<TextField size="lg" label="Title" />)
    expect(container.firstElementChild?.className).toContain('lg')
  })

  describe('regex filter', () => {
    it('rejects input that fails the pattern', () => {
      const onChange = vi.fn()
      render(<TextField label="Digits" regex={/^\d*$/} onChange={onChange} />)
      const input = screen.getByLabelText('Digits')
      fireEvent.change(input, { target: { value: '12a' } })
      expect(onChange).not.toHaveBeenCalled()
    })

    it('accepts input that matches the pattern', () => {
      const onChange = vi.fn()
      render(<TextField label="Digits" regex={/^\d*$/} onChange={onChange} />)
      const input = screen.getByLabelText('Digits')
      fireEvent.change(input, { target: { value: '123' } })
      expect(onChange).toHaveBeenCalledTimes(1)
      expect((input as HTMLInputElement).value).toBe('123')
    })
  })

  describe('mask', () => {
    it('formats the value as it is entered', () => {
      render(<TextField label="Phone" mask="(999) 999-9999" />)
      const input = screen.getByLabelText('Phone') as HTMLInputElement
      fireEvent.change(input, { target: { value: '1234567890' } })
      expect(input.value).toBe('(123) 456-7890')
    })

    it('strips characters that do not fit a mask slot', () => {
      render(<TextField label="Phone" mask="999-999" />)
      const input = screen.getByLabelText('Phone') as HTMLInputElement
      fireEvent.change(input, { target: { value: '12ab34' } })
      expect(input.value).toBe('123-4')
    })
  })

  describe('adornment', () => {
    it('renders a string adornment as muted text (not a button)', () => {
      render(<TextField label="Website" adornment="https://" />)
      expect(screen.getByText('https://')).toBeInTheDocument()
      expect(screen.queryByRole('button', { hidden: true })).not.toBeInTheDocument()
    })

    it('renders an icon adornment hidden from the a11y tree by default (no accessible button)', () => {
      render(<TextField label="Time" adornment={<Icon name="Clock" />} />)
      // not exposed as a button to assistive tech...
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      // ...but it still renders, inside a non-interactive aria-hidden IconButton
      expect(screen.getByRole('button', { hidden: true })).toHaveAttribute('aria-hidden', 'true')
    })

    it('renders a clickable icon adornment and fires onAdornmentClick', () => {
      const onAdornmentClick = vi.fn()
      render(
        <TextField
          label="Search"
          adornment={<Icon name="SearchNormal" />}
          adornmentLabel="Search"
          onAdornmentClick={onAdornmentClick}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Search' }))
      expect(onAdornmentClick).toHaveBeenCalledTimes(1)
    })

    it('disables the icon adornment when the field is disabled', () => {
      render(
        <TextField
          label="Search"
          adornment={<Icon name="SearchNormal" />}
          adornmentLabel="Search"
          onAdornmentClick={() => {}}
          disabled
        />,
      )
      expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled()
    })
  })

  describe('password reveal', () => {
    it('adds a reveal toggle and flips the input type for type="password"', () => {
      render(<TextField label="Password" type="password" />)
      const input = screen.getByLabelText('Password')
      expect(input).toHaveAttribute('type', 'password')

      const toggle = screen.getByRole('button', { name: 'Show password' })
      fireEvent.click(toggle)

      expect(input).toHaveAttribute('type', 'text')
      expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()
    })

    it('omits the reveal toggle when passwordToggle is false', () => {
      render(<TextField label="Password" type="password" passwordToggle={false} />)
      expect(screen.queryByRole('button', { name: 'Show password' })).not.toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
    })
  })

  describe('capsLockWarning', () => {
    // Caps Lock is read off the key event's getModifierState — put it on the dispatched native event.
    const keyDownCaps = (input: HTMLElement, on: boolean) => {
      const evt = createEvent.keyDown(input, { key: 'a' })
      Object.defineProperty(evt, 'getModifierState', { value: () => on })
      fireEvent(input, evt)
    }

    it('shows the hint while Caps Lock is on and hides it on blur', () => {
      render(<TextField label="Password" type="password" capsLockWarning />)
      const input = screen.getByLabelText('Password')

      expect(screen.queryByText('Caps Lock is on')).not.toBeInTheDocument()
      keyDownCaps(input, true)
      expect(screen.getByText('Caps Lock is on')).toBeInTheDocument()

      keyDownCaps(input, false)
      expect(screen.queryByText('Caps Lock is on')).not.toBeInTheDocument()

      keyDownCaps(input, true)
      expect(screen.getByText('Caps Lock is on')).toBeInTheDocument()
      fireEvent.blur(input)
      expect(screen.queryByText('Caps Lock is on')).not.toBeInTheDocument()
    })

    it('does nothing without the prop', () => {
      render(<TextField label="Password" type="password" />)
      keyDownCaps(screen.getByLabelText('Password'), true)
      expect(screen.queryByText('Caps Lock is on')).not.toBeInTheDocument()
    })
  })

  describe('passwordStrength', () => {
    it('rates strength by value and hides when empty', () => {
      const { rerender } = render(
        <TextField
          label="Password"
          type="password"
          passwordStrength
          value=""
          onChange={() => {}}
        />,
      )
      expect(screen.queryByText(/Weak|Medium|Strong/)).not.toBeInTheDocument()

      rerender(
        <TextField
          label="Password"
          type="password"
          passwordStrength
          value="abcdefgh"
          onChange={() => {}}
        />,
      )
      expect(screen.getByText('Weak')).toBeInTheDocument() // length only → score 1

      rerender(
        <TextField
          label="Password"
          type="password"
          passwordStrength
          value="Abcdef1!"
          onChange={() => {}}
        />,
      )
      expect(screen.getByText('Strong')).toBeInTheDocument()
    })
  })

  it('is full width by default', () => {
    const { container } = render(<TextField label="Title" />)
    expect(container.firstElementChild?.className).toContain('fullWidth')
  })

  it('forwards the ref to the input element', () => {
    const ref = createRef<HTMLInputElement>()
    render(<TextField label="Title" ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
