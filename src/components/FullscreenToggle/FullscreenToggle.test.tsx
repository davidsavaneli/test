import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { FullscreenToggle } from './FullscreenToggle'

// jsdom doesn't implement the Fullscreen API, so stub the bits the component touches.
const requestFs = vi.fn(() => Promise.resolve())
const exitFs = vi.fn(() => Promise.resolve())

function setFullscreenElement(el: Element | null) {
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: el })
}

describe('FullscreenToggle', () => {
  beforeEach(() => {
    requestFs.mockClear()
    exitFs.mockClear()
    setFullscreenElement(null)
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: requestFs,
    })
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exitFs })
  })

  it('renders a labeled switch, unchecked when not fullscreen', () => {
    render(<FullscreenToggle />)
    const toggle = screen.getByRole('switch', { name: 'Toggle fullscreen' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('requests fullscreen on click when not fullscreen', () => {
    render(<FullscreenToggle />)
    fireEvent.click(screen.getByRole('switch'))
    expect(requestFs).toHaveBeenCalledTimes(1)
    expect(exitFs).not.toHaveBeenCalled()
  })

  it('reflects external fullscreen state, flips the icon, and exits on click', () => {
    render(<FullscreenToggle />)
    const toggle = screen.getByRole('switch')
    expect(toggle.querySelector('svg')!.style.transform).toBe('') // windowed: not rotated

    // a fullscreen session begins outside the component
    setFullscreenElement(document.documentElement)
    fireEvent(document, new Event('fullscreenchange'))

    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(toggle.querySelector('svg')!.style.transform).toBe('rotate(180deg)') // flipped while fullscreen

    fireEvent.click(toggle)
    expect(exitFs).toHaveBeenCalledTimes(1)
  })
})
