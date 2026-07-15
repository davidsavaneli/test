import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Timeline, type TimelineEntry } from './Timeline'
import { TimelineItem } from './TimelineItem'

const items: TimelineEntry[] = [
  {
    label: 'Product Shipped',
    time: '13th May 2021',
    icon: 'Truck',
    content: 'We shipped your product via FedEx.',
  },
  { label: 'Order Confirmed', time: '18th May 2021', icon: 'TickCircle' },
  { label: 'Order Delivered', time: '20th May 2021, 10:30am' },
]

describe('Timeline', () => {
  it('renders a list with one item per entry (label, time, content)', () => {
    render(<Timeline items={items} aria-label="Order history" />)
    expect(screen.getByRole('list', { name: 'Order history' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('Product Shipped')).toBeInTheDocument()
    expect(screen.getByText('13th May 2021')).toBeInTheDocument()
    expect(screen.getByText('We shipped your product via FedEx.')).toBeInTheDocument()
  })

  it('renders an icon circle for icon entries and a dot for icon-less ones', () => {
    const { container } = render(<Timeline items={items} />)
    const nodes = container.querySelectorAll('.node')
    expect(nodes).toHaveLength(3)
    expect(nodes[0].classList.contains('dotNode')).toBe(false)
    expect(nodes[0].querySelector('svg')).not.toBeNull() // the icon
    expect(nodes[2].classList.contains('dotNode')).toBe(true)
    expect(nodes[2].querySelector('.dot')).not.toBeNull()
  })

  it('tints nodes via --tl-rgb — the timeline color, overridden per item', () => {
    const { container } = render(
      <Timeline
        color="medium"
        items={[
          { label: 'A', icon: 'TickCircle', color: 'success' },
          { label: 'B', icon: 'Truck' },
        ]}
      />,
    )
    const [first, second] = [...container.querySelectorAll('li')]
    expect(first.getAttribute('style')).toContain('--tl-rgb: var(--tz-color-success-rgb)')
    expect(second.getAttribute('style')).toContain('--tl-rgb: var(--tz-color-medium-rgb)')
  })

  it('applies the size class to every item', () => {
    const { container } = render(<Timeline size="lg" items={items} />)
    const listItems = container.querySelectorAll('li')
    expect([...listItems].every((li) => li.classList.contains('lg'))).toBe(true)
  })

  it('composes via <TimelineItem> children too, inheriting the timeline size/color', () => {
    const { container } = render(
      <Timeline size="sm" color="info">
        <TimelineItem label="Created" time="Yesterday" />
        <TimelineItem label="Updated">Changed the title.</TimelineItem>
      </Timeline>,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Changed the title.')).toBeInTheDocument()
    const li = container.querySelector('li')
    expect(li?.classList.contains('sm')).toBe(true)
    expect(li?.getAttribute('style')).toContain('--tl-rgb: var(--tz-color-info-rgb)')
  })

  it('renders a connector on every item except the last (CSS hides it there)', () => {
    const { container } = render(<Timeline items={items} />)
    // the connector span exists on all items; the :last-child rule hides the final one visually
    expect(container.querySelectorAll('.connector')).toHaveLength(3)
  })

  it('forwards the ref to the root <ol>', () => {
    const ref = createRef<HTMLOListElement>()
    render(<Timeline items={items} ref={ref} />)
    expect(ref.current?.tagName).toBe('OL')
  })
})
