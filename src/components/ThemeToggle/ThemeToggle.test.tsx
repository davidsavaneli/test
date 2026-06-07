import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeProvider } from '../../theme'
import type { ThemePalette } from '../../theme'
import { ThemeToggle } from './ThemeToggle'

const LIGHT: ThemePalette = {
  primary: '#13404e',
  secondary: '#f4f9f8',
  dark: '#056472',
  medium: '#039aa1',
  light: '#adc3c9',
  success: '#00a854',
  error: '#f04134',
  info: '#039aa1',
  warning: '#ffbf00',
}

const withTheme = (ui: ReactNode) => (
  <ThemeProvider config={{ mode: 'light', colors: { light: LIGHT } }}>{ui}</ThemeProvider>
)

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-tz-theme')
    document.documentElement.removeAttribute('style')
  })

  it('renders a labeled switch, unchecked in light mode', () => {
    render(withTheme(<ThemeToggle />))
    const toggle = screen.getByRole('switch', { name: 'Toggle color theme' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('checks the switch and swaps the icon when toggled to dark', () => {
    render(withTheme(<ThemeToggle />))
    const toggle = screen.getByRole('switch')
    const sun = toggle.querySelector('svg')!.innerHTML

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(document.documentElement.getAttribute('data-tz-theme')).toBe('dark')
    const moon = toggle.querySelector('svg')!.innerHTML
    expect(moon).not.toBe(sun) // Sun -> Moon
  })
})
