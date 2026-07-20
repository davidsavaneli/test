import { beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { ConfigProvider, useTheme } from './ConfigProvider'
import type { ThemePalette } from './applyTheme'

const LIGHT: ThemePalette = {
  primary: '#13404e',
  secondary: '#f4f9f8',
  background: '#ffffff',
  surface: '#f5f7fa',
  accent: '#056472',
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

/** A button that sets the accent-color override (optionally for a specific mode), from the DOM. */
function AccentSetter({ color, target }: { color: string | null; target?: 'light' | 'dark' }) {
  const { setAccentColor } = useTheme()
  return <button onClick={() => setAccentColor(color, target)}>set accent</button>
}

/** Renders the resolved default accent (light), so we can assert what the provider exposes. */
function AccentReader() {
  const { defaultAccentColors } = useTheme()
  return <span>{defaultAccentColors.light}</span>
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
    // a color not in the override is filled from DEFAULT_LIGHT_COLORS (accent = #056472)
    expect(cssVar('--tz-color-accent-rgb')).toBe('5, 100, 114')
  })

  it('overrides the accent color for the current mode via setAccentColor and persists it (per mode)', () => {
    render(
      <ConfigProvider>
        <AccentSetter color="#7c3aed" />
      </ConfigProvider>,
    )
    // default accent before the override (DEFAULT_LIGHT_COLORS.accent = #056472 -> 5, 100, 114)
    expect(cssVar('--tz-color-accent-rgb')).toBe('5, 100, 114')
    fireEvent.click(screen.getByRole('button'))
    // #7c3aed -> 124, 58, 237, applied live + persisted under the light-mode key
    expect(cssVar('--tz-color-accent-rgb')).toBe('124, 58, 237')
    expect(localStorage.getItem('tz-accent-color-light')).toBe('#7c3aed')
    // dark keeps its own (unset) override
    expect(localStorage.getItem('tz-accent-color-dark')).toBeNull()
  })

  it('restores a persisted accent color on mount, and clearing it removes the key', () => {
    localStorage.setItem('tz-accent-color-light', '#2563eb')
    render(
      <ConfigProvider>
        <AccentSetter color={null} />
      </ConfigProvider>,
    )
    // #2563eb -> 37, 99, 235, applied from storage on first paint
    expect(cssVar('--tz-color-accent-rgb')).toBe('37, 99, 235')
    // clearing the override falls back to the configured/default accent + drops the key
    fireEvent.click(screen.getByRole('button'))
    expect(cssVar('--tz-color-accent-rgb')).toBe('5, 100, 114')
    expect(localStorage.getItem('tz-accent-color-light')).toBeNull()
  })

  it('can target another mode without touching the active one', () => {
    render(
      <ConfigProvider config={{ theme: { mode: 'light' } }}>
        <AccentSetter color="#111111" target="dark" />
      </ConfigProvider>,
    )
    fireEvent.click(screen.getByRole('button'))
    // active mode (light) keeps its default accent; only dark's override was set + persisted
    expect(cssVar('--tz-color-accent-rgb')).toBe('5, 100, 114')
    expect(localStorage.getItem('tz-accent-color-dark')).toBe('#111111')
    expect(localStorage.getItem('tz-accent-color-light')).toBeNull()
  })

  it('keeps accent overrides independent per mode', () => {
    // a light override is persisted; dark was never set
    localStorage.setItem('tz-accent-color-light', '#7c3aed')
    render(
      <ConfigProvider config={{ theme: { mode: 'light' } }}>
        <Toggle />
      </ConfigProvider>,
    )
    // light shows its override (#7c3aed -> 124, 58, 237)
    expect(cssVar('--tz-color-accent-rgb')).toBe('124, 58, 237')
    // toggle to dark → no dark override, so the dark default accent applies (#16a6b4 -> 22, 166, 180)
    fireEvent.click(screen.getByRole('button'))
    expect(cssVar('--tz-color-accent-rgb')).toBe('22, 166, 180')
  })

  it('exposes the configured/default accent via defaultAccentColors (app override wins)', () => {
    const { rerender } = render(
      <ConfigProvider>
        <AccentReader />
      </ConfigProvider>,
    )
    // DEFAULT_LIGHT_COLORS.accent
    expect(screen.getByText('#056472')).toBeInTheDocument()
    // an app's configured accent is reflected (no override set)
    rerender(
      <ConfigProvider config={{ theme: { colors: { light: { accent: '#123456' } } } }}>
        <AccentReader />
      </ConfigProvider>,
    )
    expect(screen.getByText('#123456')).toBeInTheDocument()
  })

  it('throws when useTheme is called outside a provider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(/within a <ConfigProvider>/)
  })

  describe('header sticky preference', () => {
    it('defaults to static (false), and follows config.header.sticky when set', () => {
      const a = renderHook(() => useTheme(), { wrapper: ConfigProvider })
      expect(a.result.current.headerSticky).toBe(false)

      const b = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <ConfigProvider config={{ header: { sticky: true } }}>{children}</ConfigProvider>
        ),
      })
      expect(b.result.current.headerSticky).toBe(true)
    })

    it('setHeaderSticky updates + persists, and a stored value wins over the config default', () => {
      const { result } = renderHook(() => useTheme(), { wrapper: ConfigProvider })
      act(() => result.current.setHeaderSticky(true))
      expect(result.current.headerSticky).toBe(true)
      expect(localStorage.getItem('tz-header-sticky')).toBe('1')

      // a persisted '0' overrides config.header.sticky: true on the next mount
      localStorage.setItem('tz-header-sticky', '0')
      const restored = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <ConfigProvider config={{ header: { sticky: true } }}>{children}</ConfigProvider>
        ),
      })
      expect(restored.result.current.headerSticky).toBe(false)
    })
  })
})
