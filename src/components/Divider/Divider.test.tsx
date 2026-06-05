import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Divider } from './Divider'

describe('Divider', () => {
  it('renders a plain horizontal separator by default', () => {
    render(<Divider />)
    const sep = screen.getByRole('separator')
    expect(sep).toHaveClass('horizontal')
    expect(sep).not.toHaveClass('labelled')
    expect(sep).toHaveTextContent('')
  })

  it('renders a vertical rule with aria-orientation', () => {
    render(<Divider orientation="vertical" />)
    const sep = screen.getByRole('separator')
    expect(sep).toHaveClass('vertical')
    expect(sep).toHaveAttribute('aria-orientation', 'vertical')
  })

  it('renders a label and defaults its alignment to center', () => {
    render(<Divider>Section</Divider>)
    const sep = screen.getByRole('separator')
    expect(screen.getByText('Section')).toBeInTheDocument()
    expect(sep).toHaveClass('labelled')
    expect(sep).toHaveClass('center')
  })

  it('applies the requested label alignment', () => {
    render(<Divider align="right">Section</Divider>)
    expect(screen.getByRole('separator')).toHaveClass('right')
  })

  it('ignores a label when vertical (no labelled class)', () => {
    render(<Divider orientation="vertical">x</Divider>)
    const sep = screen.getByRole('separator')
    expect(sep).not.toHaveClass('labelled')
    expect(sep).toHaveTextContent('')
  })
})
