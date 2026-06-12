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
import { DEFAULT_TRANSLATIONS_NAMESPACE } from '../helpers/translations'

export type ThemeMode = 'light' | 'dark'

export interface ThemeColors {
  /** Light-mode palette. Override any subset of the brand colors — the rest use the library defaults. */
  light?: Partial<ThemePalette>
  /** Dark-mode overrides, layered on the (merged) light palette + the library's dark defaults. */
  dark?: Partial<ThemePalette>
}

/** A content locale the app supports — a tab in `<TranslatedFields>`. */
export interface LocaleConfig {
  /** BCP-47 locale code, e.g. `'en-US'`. Namespaces the form field names and is the tab's fallback label. */
  code: string
  /** Human-readable tab label. Falls back to `code`. */
  label?: string
}

/** Theme settings — color overrides + initial mode. Lives under `Config.theme`. */
export interface ThemeConfig {
  /** Brand color overrides. Omit entirely to use the library's built-in theme. */
  colors?: ThemeColors
  /** Initial color mode. */
  mode?: ThemeMode
}

/** Translation settings. Lives under `Config.translations`. */
export interface TranslationsConfig {
  /**
   * Top-level namespace word for `<TranslatedFields>`' form names + the nested object — e.g.
   * `'languages'` ⇒ `languages[en-US].title`. Defaults to `'translations'` when omitted.
   */
  namespace?: string
}

/**
 * App-level configuration passed to `<ConfigProvider config={…}>`. Groups theming under `theme` and
 * keeps non-theme app config (`locales`, `translations`, …) at the top — a single place to grow.
 */
export interface Config {
  /** Theme settings (color overrides + initial mode). Omit entirely to use the built-in theme. */
  theme?: ThemeConfig
  /** Content locales the app supports — drive `<TranslatedFields>`' tabs (one per locale). */
  locales?: LocaleConfig[]
  /** Translation settings — e.g. the `namespace` word for `<TranslatedFields>` (default `'translations'`). */
  translations?: TranslationsConfig
}

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
  locales: LocaleConfig[]
  /** Resolved translations namespace (`config.translations.namespace` ?? the built-in default). */
  translationsNamespace: string
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'tz-theme-mode'
/** Stable empty-locales fallback so the context value memo doesn't churn when no locales are configured. */
const EMPTY_LOCALES: LocaleConfig[] = []

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
  // brighter teal accent ramp for dark mode (the light-mode teals are too dark on #1F1F1E)
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

export interface ConfigProviderProps {
  /** App config — theme overrides, initial mode, locales. Omit for the built-in defaults (light mode). */
  config?: Config
  children: ReactNode
}

export function ConfigProvider({ config, children }: ConfigProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(() => getInitialMode(config?.theme?.mode ?? 'light'))

  const colors = config?.theme?.colors

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

  const locales = config?.locales ?? EMPTY_LOCALES
  const translationsNamespace = config?.translations?.namespace ?? DEFAULT_TRANSLATIONS_NAMESPACE

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, toggleMode, locales, translationsNamespace }),
    [mode, setMode, toggleMode, locales, translationsNamespace],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) {
    throw new Error('useTheme must be used within a <ConfigProvider>')
  }
  return value
}

/**
 * The content locales configured on `<ConfigProvider config={{ locales }}>`. Lenient — returns `[]`
 * outside a provider (locales are optional), so `<TranslatedFields>` can also take a `locales` prop.
 */
export function useLocales(): LocaleConfig[] {
  return useContext(ThemeContext)?.locales ?? EMPTY_LOCALES
}

/**
 * The translations namespace configured on `<ConfigProvider config={{ translations: { namespace } }}>`,
 * resolved against the built-in default (`'translations'`). Lenient outside a provider. Use it to pass
 * the same namespace to the helpers, e.g. `buildTranslations(codes, fields, useTranslationsNamespace())`.
 */
export function useTranslationsNamespace(): string {
  return useContext(ThemeContext)?.translationsNamespace ?? DEFAULT_TRANSLATIONS_NAMESPACE
}
