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
  light: ThemePalette
  dark?: Partial<ThemePalette>
}

export interface ThemeConfig {
  colors: ThemeColors
  mode?: ThemeMode
}

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'tz-theme-mode'

const DEFAULT_DARK_COLORS: Partial<ThemePalette> = {
  primary: '#e6e8eb',
  secondary: '#181c21',
}

function getInitialMode(fallback: ThemeMode): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : fallback
}

export interface ThemeProviderProps {
  config: ThemeConfig
  children: ReactNode
}

export function ThemeProvider({ config, children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(() => getInitialMode(config.mode ?? 'light'))

  useLayoutEffect(() => {
    const { light, dark } = config.colors
    // dark = light base, then library dark defaults, then the app's own dark overrides
    const palette = mode === 'dark' ? { ...light, ...DEFAULT_DARK_COLORS, ...dark } : light
    applyTheme(palette)

    const root = document.documentElement
    root.setAttribute('data-tz-theme', mode)
    root.style.setProperty('color-scheme', mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode, config.colors])

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
