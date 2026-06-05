import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from './Avatar'
import { AvatarGroup } from './AvatarGroup'

describe('Avatar', () => {
  it('renders an image with alt from `alt` (or `name`)', () => {
    render(<Avatar src="/x.png" name="David Savaneli" />)
    const img = screen.getByRole('img') as HTMLImageElement
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', '/x.png')
    expect(img).toHaveAccessibleName('David Savaneli')
  })

  it('derives initials from `name`', () => {
    render(<Avatar name="David Savaneli" />)
    expect(screen.getByText('DS')).toBeInTheDocument()
  })

  it('renders explicit children (initials) over derived ones', () => {
    render(<Avatar name="David Savaneli">D.S.</Avatar>)
    expect(screen.getByText('D.S.')).toBeInTheDocument()
    expect(screen.queryByText('DS')).toBeNull()
  })

  it('exposes a non-image avatar as role=img with the name as its label', () => {
    render(<Avatar name="David Savaneli" />)
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'David Savaneli')
  })

  it('tints via the --tz-btn-rgb inline var and applies size/shape classes', () => {
    const { container } = render(<Avatar name="D" color="error" size="lg" shape="square" />)
    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue('--tz-btn-rgb')).toBe('var(--tz-color-error-rgb)')
    expect(root).toHaveClass('lg')
    expect(root).toHaveClass('square')
  })
})

describe('AvatarGroup', () => {
  it('shows all avatars when under the max', () => {
    render(
      <AvatarGroup max={5}>
        <Avatar name="Aa Bb" />
        <Avatar name="Cc Dd" />
      </AvatarGroup>,
    )
    expect(screen.getByText('AB')).toBeInTheDocument()
    expect(screen.getByText('CD')).toBeInTheDocument()
    expect(screen.queryByText(/^\+/)).toBeNull()
  })

  it('collapses overflow past max into a +N avatar', () => {
    render(
      <AvatarGroup max={3}>
        <Avatar name="A A" />
        <Avatar name="B B" />
        <Avatar name="C C" />
        <Avatar name="D D" />
      </AvatarGroup>,
    )
    // max 3 → 2 avatars shown + "+2"
    expect(screen.getByText('AA')).toBeInTheDocument()
    expect(screen.getByText('BB')).toBeInTheDocument()
    expect(screen.queryByText('CC')).toBeNull()
    expect(screen.getByText('+2')).toBeInTheDocument()
  })
})
