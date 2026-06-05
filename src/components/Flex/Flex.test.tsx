import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Col, Flex, Grid, Row } from './index'

describe('Flex', () => {
  it('renders a flex box with direction and resolved gap/padding', () => {
    const { container } = render(
      <Flex direction="column" gap={40} padding="24px 8px">
        x
      </Flex>,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.display).toBe('flex')
    expect(el.style.flexDirection).toBe('column')
    expect(el.style.gap).toBe('40px')
    expect(el.style.padding).toBe('24px 8px')
  })

  it('maps a scale key to a --tz-space token', () => {
    const { container } = render(<Flex gap="md">x</Flex>)
    expect((container.firstElementChild as HTMLElement).style.gap).toBe('var(--tz-space-md)')
  })

  it('maps align/justify and wrap', () => {
    const { container } = render(
      <Flex align="start" justify="between" wrap>
        x
      </Flex>,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.alignItems).toBe('flex-start')
    expect(el.style.justifyContent).toBe('space-between')
    expect(el.style.flexWrap).toBe('wrap')
  })

  it('supports inline-flex and merges consumer style last', () => {
    const { container } = render(<Flex inline style={{ display: 'grid', color: 'red' }} />)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.display).toBe('grid') // consumer style wins
    expect(el.style.color).toBe('red')
  })
})

describe('Row / Col', () => {
  it('Row defaults to a centered row', () => {
    const { container } = render(<Row gap="sm">x</Row>)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.flexDirection).toBe('row')
    expect(el.style.alignItems).toBe('center')
    expect(el.style.gap).toBe('var(--tz-space-sm)')
  })

  it('Col defaults to a column (no forced align)', () => {
    const { container } = render(<Col>x</Col>)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.flexDirection).toBe('column')
    expect(el.style.alignItems).toBe('')
  })

  it('forwards arbitrary props and children', () => {
    render(
      <Row data-testid="bar" aria-label="toolbar">
        <span>child</span>
      </Row>,
    )
    expect(screen.getByTestId('bar')).toHaveAttribute('aria-label', 'toolbar')
    expect(screen.getByText('child')).toBeInTheDocument()
  })
})

describe('Grid', () => {
  it('lays out a fixed column count', () => {
    const { container } = render(
      <Grid cols={2} gap="md">
        x
      </Grid>,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.display).toBe('grid')
    expect(el.style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))')
    expect(el.style.gap).toBe('var(--tz-space-md)')
  })

  it('builds a responsive auto-fit template from minItemWidth (overrides cols)', () => {
    const { container } = render(
      <Grid cols={3} minItemWidth={220}>
        x
      </Grid>,
    )
    expect((container.firstElementChild as HTMLElement).style.gridTemplateColumns).toBe(
      'repeat(auto-fit, minmax(220px, 1fr))',
    )
  })
})
