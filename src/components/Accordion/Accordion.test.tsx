import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Accordion } from './Accordion'
import { AccordionItem } from './AccordionItem'

const ITEMS = [
  { value: 'a', label: 'First', content: 'Body A' },
  { value: 'b', label: 'Second', content: 'Body B' },
  { value: 'c', label: 'Third', content: 'Body C' },
]

describe('Accordion', () => {
  it('renders data-driven headers with the right a11y wiring', () => {
    render(<Accordion items={ITEMS} />)
    const first = screen.getByRole('button', { name: 'First' })
    expect(first).toHaveAttribute('aria-expanded', 'false')
    // the header controls a labelled region
    const region = screen.getByRole('region', { name: 'First' })
    expect(first).toHaveAttribute('aria-controls', region.id)
  })

  it('toggles a panel open/closed on header click (uncontrolled, multi-open)', () => {
    render(<Accordion items={ITEMS} />)
    const first = screen.getByRole('button', { name: 'First' })
    fireEvent.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps multiple panels open by default', () => {
    render(<Accordion items={ITEMS} />)
    fireEvent.click(screen.getByRole('button', { name: 'First' }))
    fireEvent.click(screen.getByRole('button', { name: 'Second' }))
    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('exclusive mode keeps only one panel open and emits a string | null', () => {
    const onChange = vi.fn()
    render(<Accordion items={ITEMS} exclusive onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'First' }))
    expect(onChange).toHaveBeenLastCalledWith('a')
    fireEvent.click(screen.getByRole('button', { name: 'Second' }))
    expect(onChange).toHaveBeenLastCalledWith('b')
    // opening Second closed First
    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-expanded', 'true')
    // clicking the open one closes it → null
    fireEvent.click(screen.getByRole('button', { name: 'Second' }))
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('respects the controlled value and does not self-toggle', () => {
    const onChange = vi.fn()
    render(<Accordion items={ITEMS} value={['a']} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Second' }))
    expect(onChange).toHaveBeenCalledWith(['a', 'b'])
    // still controlled by the parent → Second stays closed
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens the matching panel from defaultValue', () => {
    render(<Accordion items={ITEMS} defaultValue={['b']} />)
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('disables a single item and the whole group', () => {
    const { rerender } = render(<Accordion items={[{ ...ITEMS[0], disabled: true }, ITEMS[1]]} />)
    expect(screen.getByRole('button', { name: 'First' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Second' })).not.toBeDisabled()

    rerender(<Accordion items={ITEMS} disabled />)
    expect(screen.getByRole('button', { name: 'First' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Second' })).toBeDisabled()
  })

  it('works with <AccordionItem> children', () => {
    render(
      <Accordion defaultValue={['x']}>
        <AccordionItem value="x" label="Children X">
          Body X
        </AccordionItem>
      </Accordion>,
    )
    expect(screen.getByRole('button', { name: 'Children X' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByText('Body X')).toBeInTheDocument()
  })

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Accordion ref={ref} items={ITEMS} />)
    expect(ref.current?.tagName).toBe('DIV')
  })
})
