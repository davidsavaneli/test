import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  it('renders title, icon, body, header actions and footer', () => {
    render(
      <Card title="Settings" icon="Setting2" actions={<span>act</span>} footer={<span>foot</span>}>
        Body content
      </Card>,
    )
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Body content')).toBeInTheDocument()
    expect(screen.getByText('act')).toBeInTheDocument()
    expect(screen.getByText('foot')).toBeInTheDocument()
    expect(document.querySelector('svg')).toBeInTheDocument() // the icon
  })

  it('is not collapsible by default — no toggle, body shown', () => {
    const { container } = render(<Card title="X">Body</Card>)
    expect(screen.queryByRole('button', { name: /collapse|expand/i })).toBeNull()
    expect(container.firstElementChild).not.toHaveClass('collapsed')
  })

  it('toggles collapse when collapsible (uncontrolled)', () => {
    const { container } = render(
      <Card title="X" collapsible>
        Body
      </Card>,
    )
    const card = container.firstElementChild as HTMLElement
    const toggle = screen.getByRole('button', { name: 'Collapse' })
    expect(card).not.toHaveClass('collapsed')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(toggle)
    expect(card).toHaveClass('collapsed')
    expect(screen.getByRole('button', { name: 'Expand' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('honors a controlled collapsed state and reports changes', () => {
    const onCollapsedChange = vi.fn()
    const { container } = render(
      <Card title="X" collapsible collapsed onCollapsedChange={onCollapsedChange}>
        Body
      </Card>,
    )
    expect(container.firstElementChild).toHaveClass('collapsed')
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }))
    expect(onCollapsedChange).toHaveBeenCalledWith(false)
  })

  it('hides header actions while collapsed and shows them when expanded', () => {
    render(
      <Card title="X" collapsible defaultCollapsed actions={<span>act</span>}>
        Body
      </Card>,
    )
    expect(screen.queryByText('act')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }))
    expect(screen.getByText('act')).toBeInTheDocument()
  })

  it('starts collapsed with defaultCollapsed', () => {
    const { container } = render(
      <Card title="X" collapsible defaultCollapsed>
        Body
      </Card>,
    )
    expect(container.firstElementChild).toHaveClass('collapsed')
    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument()
  })
})
