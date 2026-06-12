import { createRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Tabs, type TabItem } from './Tabs'

const items: TabItem[] = [
  { value: 'general', label: 'General' },
  { value: 'security', label: 'Security' },
  { value: 'billing', label: 'Billing', disabled: true },
  { value: 'advanced', label: 'Advanced' },
]

beforeEach(() => window.history.replaceState({}, '', '/'))

describe('Tabs', () => {
  it('renders a tablist with the first enabled tab active by default', () => {
    render(<Tabs items={items} aria-label="Settings" />)
    expect(screen.getByRole('tablist', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
  })

  it('respects defaultValue (uncontrolled)', () => {
    render(<Tabs items={items} defaultValue="security" />)
    expect(screen.getByRole('tab', { name: 'Security' })).toHaveAttribute('aria-selected', 'true')
  })

  it('selects on click and fires onChange', () => {
    const onChange = vi.fn()
    render(<Tabs items={items} onChange={onChange} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Security' }))
    expect(onChange).toHaveBeenCalledWith('security')
    expect(screen.getByRole('tab', { name: 'Security' })).toHaveAttribute('aria-selected', 'true')
  })

  it('reflects a controlled value and does not self-update', () => {
    const onChange = vi.fn()
    render(<Tabs items={items} value="advanced" onChange={onChange} />)
    expect(screen.getByRole('tab', { name: 'Advanced' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('tab', { name: 'General' }))
    expect(onChange).toHaveBeenCalledWith('general')
    expect(screen.getByRole('tab', { name: 'Advanced' })).toHaveAttribute('aria-selected', 'true') // unchanged
  })

  it('does not select a disabled tab', () => {
    const onChange = vi.fn()
    render(<Tabs items={items} onChange={onChange} />)
    const billing = screen.getByRole('tab', { name: 'Billing' })
    expect(billing).toBeDisabled()
    fireEvent.click(billing)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('navigates with arrows, skipping disabled, wrapping, + Home/End', () => {
    const onChange = vi.fn()
    render(<Tabs items={items} onChange={onChange} />)
    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'ArrowRight' }) // General → Security
    expect(onChange).toHaveBeenLastCalledWith('security')
    fireEvent.keyDown(tablist, { key: 'ArrowRight' }) // Security → (skip Billing) Advanced
    expect(onChange).toHaveBeenLastCalledWith('advanced')
    fireEvent.keyDown(tablist, { key: 'ArrowRight' }) // Advanced → wrap to General
    expect(onChange).toHaveBeenLastCalledWith('general')
    fireEvent.keyDown(tablist, { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith('advanced')
    fireEvent.keyDown(tablist, { key: 'Home' })
    expect(onChange).toHaveBeenLastCalledWith('general')
  })

  it('uses roving tabindex (only the active tab is tabbable)', () => {
    render(<Tabs items={items} defaultValue="security" />)
    expect(screen.getByRole('tab', { name: 'Security' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('tabindex', '-1')
  })

  it('renders the active tab panel', () => {
    render(
      <Tabs
        items={[
          { value: 'a', label: 'A', content: 'Panel A' },
          { value: 'b', label: 'B', content: 'Panel B' },
        ]}
      />,
    )
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel A')
    fireEvent.click(screen.getByRole('tab', { name: 'B' }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel B')
  })

  it('renders a trailing count indicator', () => {
    render(<Tabs items={[{ value: 'a', label: 'Inbox', badge: 3 }]} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('caps a large count at 99+', () => {
    render(<Tabs items={[{ value: 'a', label: 'Inbox', badge: 250 }]} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  // ── URL query sync ──────────────────────────────────────────────────────────
  it('initializes the active tab from the URL query', () => {
    window.history.replaceState({}, '', '/?tab=advanced')
    render(<Tabs items={items} queryKey="tab" />)
    expect(screen.getByRole('tab', { name: 'Advanced' })).toHaveAttribute('aria-selected', 'true')
  })

  it('writes the active tab to the URL query on change (custom param name)', () => {
    render(<Tabs items={items} queryKey="section" />)
    expect(new URLSearchParams(window.location.search).get('section')).toBe('general') // canonicalized on mount
    fireEvent.click(screen.getByRole('tab', { name: 'Security' }))
    expect(new URLSearchParams(window.location.search).get('section')).toBe('security')
  })

  it('restores the tab from the query on Back/Forward (popstate)', () => {
    render(<Tabs items={items} queryKey="tab" pushHistory />)
    fireEvent.click(screen.getByRole('tab', { name: 'Advanced' }))
    expect(screen.getByRole('tab', { name: 'Advanced' })).toHaveAttribute('aria-selected', 'true')
    // simulate Back: the previous query is restored, then popstate fires
    window.history.replaceState({}, '', '/?tab=general')
    act(() => window.dispatchEvent(new PopStateEvent('popstate')))
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
  })

  it('leaves the URL untouched without a queryKey', () => {
    render(<Tabs items={items} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Security' }))
    expect(window.location.search).toBe('')
  })

  // ── robustness: active clamped to a selectable tab (no keyboard trap) ─────────
  it('clamps a defaultValue pointing at a disabled tab to the first enabled tab', () => {
    render(<Tabs items={items} defaultValue="billing" />) // billing is disabled
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('tabindex', '0') // focusable tabstop
  })

  it('clamps an invalid controlled value to the first enabled tab', () => {
    render(<Tabs items={items} value="does-not-exist" />)
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
  })

  it('always keeps exactly one tabbable tab even with a bad active value', () => {
    render(<Tabs items={items} value="billing" />)
    const tabbable = screen
      .getAllByRole('tab')
      .filter((t) => t.getAttribute('tabindex') === '0' && !(t as HTMLButtonElement).disabled)
    expect(tabbable).toHaveLength(1)
  })

  // ── a11y ──────────────────────────────────────────────────────────────────────
  it('gives an icon-only tab an accessible name (ariaLabel, else value)', () => {
    render(
      <Tabs
        items={[
          { value: 'home', icon: 'Profile' },
          { value: 'settings', icon: 'Setting2', ariaLabel: 'Settings' },
        ]}
      />,
    )
    expect(screen.getByRole('tab', { name: 'home' })).toBeInTheDocument() // falls back to value
    expect(screen.getByRole('tab', { name: 'Settings' })).toBeInTheDocument() // explicit ariaLabel
  })

  it('only the active content tab references the panel (no dangling aria-controls)', () => {
    render(
      <Tabs
        items={[
          { value: 'a', label: 'A' }, // active, no content → no panel
          { value: 'b', label: 'B', content: 'Panel B' },
        ]}
      />,
    )
    expect(screen.queryByRole('tabpanel')).toBeNull() // active tab has no content
    expect(screen.getByRole('tab', { name: 'B' })).not.toHaveAttribute('aria-controls') // not active → no IDREF
  })

  it('forwards the ref to the root', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Tabs items={items} ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})
