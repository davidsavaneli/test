import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { applyTheme, type ThemePalette } from './applyTheme'

export type ThemeMode = 'light' | 'dark'

export interface ThemeColors {
  /** Light-mode palette. Override any subset of the brand colors — the rest use the library defaults. */
  light?: Partial<ThemePalette>
  /** Dark-mode overrides, layered on the (merged) light palette + the library's dark defaults. */
  dark?: Partial<ThemePalette>
}

export interface ThemeConfig {
  /** Brand color overrides. Omit entirely to use the library's built-in theme. */
  colors?: ThemeColors
  mode?: ThemeMode
}

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'tz-theme-mode'

/**
 * The library's built-in light palette — the single source of truth for every brand color's default
 * value. Apps override any subset via `config.colors.light`; the rest fall back to these. (theme.css
 * holds only the structure that references these values, not the values themselves.)
 */
const DEFAULT_LIGHT_COLORS: ThemePalette = {
  primary: '#13404e',
  secondary: '#ffffff',
  background: '#ffffff',
  dark: '#033b44',
  medium: '#056472',
  light: '#039aa1',
  success: '#00a854',
  error: '#f04134',
  info: '#039aa1',
  warning: '#ffbf00',
}

/**
 * Built-in dark-mode overrides — only the colors that differ from light; everything else inherits the
 * (merged) light palette. Apps override any of these via `config.colors.dark`.
 */
const DEFAULT_DARK_COLORS: Partial<ThemePalette> = {
  primary: '#e6e8eb',
  secondary: '#1F1F1E',
  background: '#1F1F1E',
  // background: '#04191d',
  // brighter cyan-teal ramp for dark mode — the light-mode teals are too dark on #1F1F1E
  dark: '#0e8896',
  medium: '#16a6b4',
  light: '#25bac8',
  success: '#00a854',
  error: '#f04134',
  info: '#039aa1',
  warning: '#ffbf00',
}

function getInitialMode(fallback: ThemeMode): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : fallback
}

export interface ThemeProviderProps {
  /** Theme overrides + initial mode. Omit to use the built-in defaults (light mode). */
  config?: ThemeConfig
  children: ReactNode
}

export function ThemeProvider({ config, children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(() => getInitialMode(config?.mode ?? 'light'))

  const colors = config?.colors

  useLayoutEffect(() => {
    // light = the library defaults, then the app's light overrides
    const light = { ...DEFAULT_LIGHT_COLORS, ...colors?.light }
    // dark = the merged light palette, then the library dark deltas, then the app's dark overrides
    const palette = mode === 'dark' ? { ...light, ...DEFAULT_DARK_COLORS, ...colors?.dark } : light
    applyTheme(palette)

    const root = document.documentElement
    root.setAttribute('data-tz-theme', mode)
    root.style.setProperty('color-scheme', mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode, colors])

  const toggleMode = useCallback(() => {
    setMode((current) => (current === 'light' ? 'dark' : 'light'))
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, toggleMode }),
    [mode, setMode, toggleMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) {
    throw new Error('useTheme must be used within a <ThemeProvider>')
  }
  return value
}
