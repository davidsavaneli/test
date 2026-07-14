import { createRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ConfigProvider } from '../../theme'
import { Stepper, type StepItem } from './Stepper'

beforeEach(() => window.history.replaceState({}, '', '/'))

const steps: StepItem[] = [
  { label: 'Account' },
  { label: 'Shipping' },
  { label: 'Payment' },
  { label: 'Review' },
]

const withContent: StepItem[] = [
  { label: 'One', content: <p>First panel</p> },
  { label: 'Two', content: <p>Second panel</p> },
]

describe('Stepper', () => {
  it('renders one list item per step', () => {
    render(<Stepper steps={steps} activeStep={1} aria-label="Checkout" />)
    expect(screen.getByRole('list', { name: 'Checkout' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('shows the step number for an upcoming step and marks the active step with aria-current', () => {
    render(<Stepper steps={steps} activeStep={1} />)
    // upcoming steps 3 & 4 render their 1-based numbers
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    const current = document.querySelector('[aria-current="step"]')
    expect(current).not.toBeNull()
    expect(current).toHaveTextContent('Shipping')
  })

  it('renders a check (not a number) for completed steps', () => {
    render(<Stepper steps={steps} activeStep={2} />)
    // steps 0 & 1 are completed → their numbers "1"/"2" are replaced by the check icon
    expect(screen.queryByText('1')).toBeNull()
    expect(screen.queryByText('2')).toBeNull()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders only the active step content and swaps it with activeStep (horizontal panel)', () => {
    const { rerender } = render(<Stepper steps={withContent} activeStep={0} />)
    expect(screen.getByText('First panel')).toBeInTheDocument()
    expect(screen.queryByText('Second panel')).toBeNull()
    rerender(<Stepper steps={withContent} activeStep={1} />)
    expect(screen.getByText('Second panel')).toBeInTheDocument()
    expect(screen.queryByText('First panel')).toBeNull()
  })

  it('renders the active step content inline inside its list item (vertical)', () => {
    render(<Stepper orientation="vertical" steps={withContent} activeStep={0} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('First panel')
    expect(screen.queryByText('Second panel')).toBeNull()
  })

  it('is display-only by default (no buttons)', () => {
    render(<Stepper steps={steps} activeStep={1} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('fires onStepClick with the index when clickable', () => {
    const onStepClick = vi.fn()
    render(<Stepper steps={steps} activeStep={1} onStepClick={onStepClick} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)
    fireEvent.click(buttons[2])
    expect(onStepClick).toHaveBeenCalledWith(2)
  })

  it('does not fire onStepClick for a disabled step', () => {
    const onStepClick = vi.fn()
    const withDisabled: StepItem[] = [
      { label: 'One' },
      { label: 'Two', disabled: true },
      { label: 'Three' },
    ]
    render(<Stepper steps={withDisabled} activeStep={0} onStepClick={onStepClick} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[1]).toBeDisabled()
    fireEvent.click(buttons[1])
    expect(onStepClick).not.toHaveBeenCalled()
  })

  it('applies the error state class to an error step', () => {
    const withError: StepItem[] = [{ label: 'One' }, { label: 'Two', error: true }]
    const { container } = render(<Stepper steps={withError} activeStep={1} />)
    expect(container.querySelector('.error')).not.toBeNull()
  })

  it('sets the color tint via the --tz-btn-rgb inline var on the root', () => {
    const { container } = render(<Stepper steps={steps} activeStep={0} color="success" />)
    const root = container.firstElementChild
    expect(root?.getAttribute('style')).toContain('--tz-btn-rgb: var(--tz-color-success-rgb)')
  })

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Stepper steps={steps} activeStep={0} ref={ref} />)
    expect(ref.current?.tagName).toBe('DIV')
    expect(ref.current?.querySelector('ol')).not.toBeNull()
  })
})

describe('Stepper URL sync (opt-in via queryKey)', () => {
  it('leaves the URL untouched by default (no queryKey)', () => {
    render(<Stepper steps={steps} activeStep={2} />)
    expect(window.location.search).toBe('')
  })

  it('canonicalizes the URL on mount with the bare queryKey (1-based ?step=)', () => {
    render(<Stepper steps={steps} activeStep={1} queryKey />)
    expect(window.location.search).toBe('?step=2')
  })

  it('reads the step from the URL on mount (uncontrolled)', () => {
    window.history.replaceState({}, '', '/?step=3')
    render(<Stepper steps={steps} queryKey onStepClick={() => {}} />)
    const current = document.querySelector('[aria-current="step"]')
    expect(current).toHaveTextContent('Payment')
  })

  it('ignores an invalid URL value and falls back to the first enabled step', () => {
    window.history.replaceState({}, '', '/?step=99')
    render(<Stepper steps={steps} queryKey onStepClick={() => {}} />)
    const current = document.querySelector('[aria-current="step"]')
    expect(current).toHaveTextContent('Account')
    // and the URL is canonicalized back to the resolved step
    expect(window.location.search).toBe('?step=1')
  })

  it('selects on click (uncontrolled) and writes the URL + fires onStepChange', () => {
    const onStepChange = vi.fn()
    render(<Stepper steps={steps} queryKey onStepClick={() => {}} onStepChange={onStepChange} />)
    fireEvent.click(screen.getAllByRole('button')[2])
    expect(onStepChange).toHaveBeenCalledWith(2)
    const current = document.querySelector('[aria-current="step"]')
    expect(current).toHaveTextContent('Payment')
    expect(window.location.search).toBe('?step=3')
  })

  it('uses a custom string queryKey as the param name', () => {
    render(<Stepper steps={steps} activeStep={1} queryKey="wizard" />)
    expect(window.location.search).toBe('?wizard=2')
  })

  it('resolves the bare queryKey through the configured keys.stepQueryKey', () => {
    render(
      <ConfigProvider config={{ keys: { stepQueryKey: 'phase' } }}>
        <Stepper steps={steps} activeStep={1} queryKey />
      </ConfigProvider>,
    )
    expect(window.location.search).toBe('?phase=2')
  })

  it('does not write an out-of-range active step (the "all done" pattern)', () => {
    render(<Stepper steps={steps} activeStep={steps.length} queryKey />)
    expect(window.location.search).toBe('')
  })

  it('restores the step from the query on popstate (uncontrolled)', () => {
    render(<Stepper steps={steps} queryKey onStepClick={() => {}} />)
    window.history.replaceState({}, '', '/?step=4')
    fireEvent.popState(window)
    const current = document.querySelector('[aria-current="step"]')
    expect(current).toHaveTextContent('Review')
  })
})
