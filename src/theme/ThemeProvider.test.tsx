import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, renderHook, screen } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeProvider'
import type { TechzyTheme } from './applyTheme'

const LIGHT: TechzyTheme = {
  primary: '#13404e',
  secondary: '#f4f9f8',
  tertiary: '#5c7687',
  dark: '#056472',
  medium: '#039aa1',
  light: '#adc3c9',
  success: '#00a854',
  error: '#f04134',
  info: '#039aa1',
  warning: '#ffbf00',
}

const root = () => document.documentElement
const cssVar = (name: string) => root().style.getPropertyValue(name).trim()

/** A button that flips the mode, so we can drive the provider from the DOM. */
function Toggle() {
  const { mode, toggleMode } = useTheme()
  return <button onClick={toggleMode}>{mode}</button>
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    root().removeAttribute('data-tz-theme')
    root().removeAttribute('style')
  })

  it('applies the light palette and marks the mode on <html>', () => {
    render(
      <ThemeProvider config={{ mode: 'light', colors: { light: LIGHT } }}>
        <Toggle />
      </ThemeProvider>,
    )
    expect(root().getAttribute('data-tz-theme')).toBe('light')
    expect(cssVar('--tz-color-primary-rgb')).toBe('19, 64, 78')
    expect(localStorage.getItem('tz-theme-mode')).toBe('light')
  })

  it('toggles the mode and persists it', () => {
    render(
      <ThemeProvider config={{ mode: 'light', colors: { light: LIGHT } }}>
        <Toggle />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(root().getAttribute('data-tz-theme')).toBe('dark')
    expect(localStorage.getItem('tz-theme-mode')).toBe('dark')
    expect(screen.getByRole('button')).toHaveTextContent('dark')
  })

  it('falls back to the library dark defaults when the app gives no dark overrides', () => {
    render(
      <ThemeProvider config={{ mode: 'dark', colors: { light: LIGHT } }}>
        <Toggle />
      </ThemeProvider>,
    )
    // DEFAULT_DARK_COLORS.primary = #e6e8eb -> 230, 232, 235
    expect(cssVar('--tz-color-primary-rgb')).toBe('230, 232, 235')
  })

  it('lets the app dark override win over the library default', () => {
    render(
      <ThemeProvider
        config={{ mode: 'dark', colors: { light: LIGHT, dark: { secondary: '#04202b' } } }}
      >
        <Toggle />
      </ThemeProvider>,
    )
    // app override: #04202b -> 4, 32, 43
    expect(cssVar('--tz-color-secondary-rgb')).toBe('4, 32, 43')
  })

  it('prefers the persisted mode over config.mode on first render', () => {
    localStorage.setItem('tz-theme-mode', 'dark')
    render(
      <ThemeProvider config={{ mode: 'light', colors: { light: LIGHT } }}>
        <Toggle />
      </ThemeProvider>,
    )
    expect(root().getAttribute('data-tz-theme')).toBe('dark')
  })

  it('throws when useTheme is called outside a provider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(/within a <ThemeProvider>/)
  })
})
