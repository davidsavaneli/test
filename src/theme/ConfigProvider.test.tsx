import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, renderHook, screen } from '@testing-library/react'
import { ConfigProvider, useTheme } from './ConfigProvider'
import type { ThemePalette } from './applyTheme'

const LIGHT: ThemePalette = {
  primary: '#13404e',
  secondary: '#f4f9f8',
  background: '#ffffff',
  surface: '#f5f7fa',
  brand: '#056472',
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

/** A button that sets the brand-color override, so we can drive it from the DOM. */
function BrandSetter({ color }: { color: string | null }) {
  const { setBrandColor } = useTheme()
  return <button onClick={() => setBrandColor(color)}>set brand</button>
}

describe('ConfigProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    root().removeAttribute('data-tz-theme')
    root().removeAttribute('style')
  })

  it('applies the light palette and marks the mode on <html>', () => {
    render(
      <ConfigProvider config={{ theme: { mode: 'light', colors: { light: LIGHT } } }}>
        <Toggle />
      </ConfigProvider>,
    )
    expect(root().getAttribute('data-tz-theme')).toBe('light')
    expect(cssVar('--tz-color-primary-rgb')).toBe('19, 64, 78')
    // the rear canvas background comes from the provided LIGHT palette (#ffffff here)
    expect(cssVar('--tz-color-background-rgb')).toBe('255, 255, 255')
    expect(localStorage.getItem('tz-theme-mode')).toBe('light')
  })

  it('toggles the mode and persists it', () => {
    render(
      <ConfigProvider config={{ theme: { mode: 'light', colors: { light: LIGHT } } }}>
        <Toggle />
      </ConfigProvider>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(root().getAttribute('data-tz-theme')).toBe('dark')
    expect(localStorage.getItem('tz-theme-mode')).toBe('dark')
    expect(screen.getByRole('button')).toHaveTextContent('dark')
  })

  it('falls back to the library dark defaults when the app gives no dark overrides', () => {
    render(
      <ConfigProvider config={{ theme: { mode: 'dark', colors: { light: LIGHT } } }}>
        <Toggle />
      </ConfigProvider>,
    )
    // DEFAULT_DARK_COLORS.primary = #e6e8eb -> 230, 232, 235
    expect(cssVar('--tz-color-primary-rgb')).toBe('230, 232, 235')
    // DEFAULT_DARK_COLORS.background = #0f0f0f -> 15, 15, 15 (near-black rear + canvas)
    expect(cssVar('--tz-color-background-rgb')).toBe('15, 15, 15')
  })

  it('lets the app dark override win over the library default', () => {
    render(
      <ConfigProvider
        config={{
          theme: { mode: 'dark', colors: { light: LIGHT, dark: { secondary: '#04202b' } } },
        }}
      >
        <Toggle />
      </ConfigProvider>,
    )
    // app override: #04202b -> 4, 32, 43
    expect(cssVar('--tz-color-secondary-rgb')).toBe('4, 32, 43')
  })

  it('prefers the persisted mode over config.mode on first render', () => {
    localStorage.setItem('tz-theme-mode', 'dark')
    render(
      <ConfigProvider config={{ theme: { mode: 'light', colors: { light: LIGHT } } }}>
        <Toggle />
      </ConfigProvider>,
    )
    expect(root().getAttribute('data-tz-theme')).toBe('dark')
  })

  it('uses the built-in default palette when no config is given', () => {
    render(
      <ConfigProvider>
        <Toggle />
      </ConfigProvider>,
    )
    expect(root().getAttribute('data-tz-theme')).toBe('light')
    // DEFAULT_LIGHT_COLORS.primary = #13404e -> 19, 64, 78
    expect(cssVar('--tz-color-primary-rgb')).toBe('19, 64, 78')
    // DEFAULT_LIGHT_COLORS.background = #f9f9f9 (soft off-white canvas) -> 249, 249, 249
    expect(cssVar('--tz-color-background-rgb')).toBe('249, 249, 249')
  })

  it('merges a partial light override onto the built-in defaults', () => {
    render(
      <ConfigProvider config={{ theme: { colors: { light: { primary: '#000000' } } } }}>
        <Toggle />
      </ConfigProvider>,
    )
    expect(cssVar('--tz-color-primary-rgb')).toBe('0, 0, 0') // overridden
    // a color not in the override is filled from DEFAULT_LIGHT_COLORS (brand = #056472)
    expect(cssVar('--tz-color-brand-rgb')).toBe('5, 100, 114')
  })

  it('overrides the brand color via setBrandColor and persists it to localStorage', () => {
    render(
      <ConfigProvider>
        <BrandSetter color="#7c3aed" />
      </ConfigProvider>,
    )
    // default brand before the override (DEFAULT_LIGHT_COLORS.brand = #056472 -> 5, 100, 114)
    expect(cssVar('--tz-color-brand-rgb')).toBe('5, 100, 114')
    fireEvent.click(screen.getByRole('button'))
    // #7c3aed -> 124, 58, 237, applied live + persisted
    expect(cssVar('--tz-color-brand-rgb')).toBe('124, 58, 237')
    expect(localStorage.getItem('tz-brand-color')).toBe('#7c3aed')
  })

  it('restores a persisted brand color on mount, and clearing it removes the key', () => {
    localStorage.setItem('tz-brand-color', '#2563eb')
    render(
      <ConfigProvider>
        <BrandSetter color={null} />
      </ConfigProvider>,
    )
    // #2563eb -> 37, 99, 235, applied from storage on first paint
    expect(cssVar('--tz-color-brand-rgb')).toBe('37, 99, 235')
    // clearing the override falls back to the configured/default brand + drops the key
    fireEvent.click(screen.getByRole('button'))
    expect(cssVar('--tz-color-brand-rgb')).toBe('5, 100, 114')
    expect(localStorage.getItem('tz-brand-color')).toBeNull()
  })

  it('throws when useTheme is called outside a provider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(/within a <ConfigProvider>/)
  })
})
