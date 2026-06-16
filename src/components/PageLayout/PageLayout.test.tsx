import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageLayout } from './PageLayout'

describe('PageLayout', () => {
  it('renders its children as a flat (non-elevated) card', () => {
    const { container } = render(<PageLayout>Page body</PageLayout>)
    expect(screen.getByText('Page body')).toBeInTheDocument()
    const root = container.firstChild as HTMLElement
    expect(root).toHaveClass('card')
    expect(root).toHaveClass('flat')
  })

  it('forwards Card header props (title / actions)', () => {
    render(
      <PageLayout title="Settings" actions={<button>Edit</button>}>
        body
      </PageLayout>,
    )
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<PageLayout ref={ref}>x</PageLayout>)
    expect(ref.current).toHaveClass('card')
  })
})
