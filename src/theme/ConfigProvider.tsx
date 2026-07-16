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

/**
 * The configurable key / param **names** the library's components read — grouped under `Config.keys`
 * so they live in one place. Each is overridable; omit one to use its built-in default. Grows over
 * time (e.g. `page` / `size` for paginated tables ⇒ `?page=1&size=10`).
 */
export interface KeysConfig {
  /**
   * URL query param name a **top-level** `<Tabs>` syncs its active tab to (e.g. `'view'` ⇒ `?view=…`),
   * unless that strip sets its own `queryKey` (or `queryKey={null}` to opt out). Defaults to `'tab'`.
   */
  tabQueryKey?: string
  /**
   * URL query param name a **nested** `<Tabs>` (one rendered inside another tab's panel) syncs to, so it
   * doesn't collide with the outer strip's `tabQueryKey` (e.g. `?tab=…&nestedTab=…`). Auto-applied by
   * nesting depth; overridable per strip via `queryKey`. Defaults to `'nestedTab'`.
   */
  nestedTabQueryKey?: string
  /**
   * URL query param name a `<Stepper queryKey>` (the bare/`true` form) syncs its active step to
   * (**1-based**, e.g. `?step=2`); a string `queryKey` overrides it per stepper. Defaults to `'step'`.
   * (The sync itself is **opt-in** — a stepper with no `queryKey` never touches the URL.)
   */
  stepQueryKey?: string
  /**
   * Top-level namespace word for `<TranslatedFields>`' form names + the nested object — e.g.
   * `'languages'` ⇒ `languages[en-US].title`. Defaults to `'translations'`.
   */
  translationsNamespace?: string
}

/**
 * How a `<Table>` builds its **server-request** params — the query it hands the consumer (as `params` /
 * `query`) in `onChange`, so a server-mode fetch doesn't hand-map page/size/search/sort every time. This is
 * the **backend transport** layer, distinct from `keys.*QueryKey` (the browser-URL sync, always page-based
 * for shareable links). Set once in `config.table.query`, override per table via the `queryMapping` prop.
 * Every field is optional; the defaults reproduce the browser-URL shape (`?page=1&size=10&search=…&sort=-key`).
 */
export interface TableQueryConfig {
  /** Request param name for the page / offset. Defaults to `'page'` (e.g. `'skip'` for an offset API). */
  pageParam?: string
  /** Request param name for the page size. Defaults to `'size'` (e.g. `'limit'`). */
  sizeParam?: string
  /** Request param name for the search query (omitted when the search is empty). Defaults to `'search'` (e.g. `'q'`). */
  searchParam?: string
  /**
   * Request param name holding the sort **key**. Defaults to `'sort'` (e.g. `'sortBy'`). With
   * `sortFormat: 'field'` this single param also carries the direction (`-key` = desc); with `'separate'`
   * the direction goes to `sortOrderParam`.
   */
  sortParam?: string
  /**
   * Pagination style. `'page'` (default) emits the **1-based page number** as-is (`page=2`); `'offset'`
   * emits a **zero-based offset** `(page - 1) * size` instead (`skip=10`), for skip/offset APIs.
   */
  pagination?: 'page' | 'offset'
  /**
   * Sort encoding. `'field'` (default) is a single param with a `-` prefix for descending (`sort=-price`);
   * `'separate'` splits into two params — the key in `sortParam` + the direction in `sortOrderParam`
   * (`sortBy=price&order=desc`); `'suffix'` appends the direction value to the key in a single param
   * (`sort=priceAsc` / `sort=priceDesc` with `ascValue: 'Asc'` / `descValue: 'Desc'`).
   */
  sortFormat?: 'field' | 'separate' | 'suffix'
  /** Direction param name when `sortFormat: 'separate'`. Defaults to `'order'`. */
  sortOrderParam?: string
  /**
   * Value emitted for an ascending sort — the `sortOrderParam` value when `sortFormat: 'separate'`, or the
   * suffix appended to the key when `sortFormat: 'suffix'`. Defaults to `'asc'`.
   */
  ascValue?: string
  /**
   * Value emitted for a descending sort — the `sortOrderParam` value when `sortFormat: 'separate'`, or the
   * suffix appended to the key when `sortFormat: 'suffix'`. Defaults to `'desc'`.
   */
  descValue?: string
  /**
   * What to emit for the size param when the **"All"** rows-per-page choice is active. A `string`/`number`
   * sets `size=<allValue>` (e.g. `0` for APIs where `limit=0` means "all"); omit it (default) to drop the
   * size param entirely (many APIs treat a missing limit as unbounded).
   */
  allValue?: string | number
  /**
   * How a **`multiSelect`** filter serializes into the request query: `'repeat'` (default — `cat=a&cat=b`),
   * `'csv'` (`cat=a,b`), or `'indexed'` (`cat[0]=a&cat[1]=b`).
   */
  multiSelectFormat?: 'repeat' | 'csv' | 'indexed'
  /**
   * Suffix appended to a **range** filter's param for its lower / upper bound — e.g. `Min`/`Max` (default)
   * → `priceMin`/`priceMax`; set `'_gte'`/`'_lte'`, `'[gte]'`/`'[lte]'`, `'From'`/`'To'`, … to match your API.
   */
  rangeMinSuffix?: string
  rangeMaxSuffix?: string
}

/** `<Table>`-specific configuration. Grows over time; today just the server-request query mapping. */
export interface TableConfig {
  /** How `<Table>` builds its server-request params (emitted as `params` / `query` in `onChange`). */
  query?: TableQueryConfig
}

/** Signed-in user shown in the shell header avatar + its account menu (see `HeaderConfig`). */
export interface HeaderUser {
  /** Full name — shown as the menu's name line. */
  name?: string
  /** Email shown under the name in the account menu. */
  email?: string
  /** Avatar image URL (falls back to a user icon). */
  avatar?: string
}

/**
 * `RootLayout` header configuration — the shell's top-bar controls. Set it once app-wide in
 * `config.header`, or per shell via the `RootLayout` `header` prop (the prop wins, merged over config).
 */
export interface HeaderConfig {
  /** Show the built-in light/dark theme toggle. Defaults to `true`. */
  theme?: boolean
  /** Show the browser-fullscreen toggle (auto-hides where the Fullscreen API is unavailable). Defaults to `true`. */
  fullscreen?: boolean
  /** Show the nav search over the sidebar's pages (with suggestions). Defaults to `true`. */
  search?: boolean
  /** Show the breadcrumb trail at the top of the content. Defaults to **`false`** (hidden). */
  breadcrumbs?: boolean
  /** Render the automatic page-title `h2` (the active route's `staticData.name`). Defaults to `true`. */
  pageTitle?: boolean
  /** When provided, an account `Avatar` appears; its menu has a **Sign out** item that calls this. */
  onLogout?: () => void
  /** Signed-in user — shown in the header avatar and as a header block atop the account menu. */
  user?: HeaderUser
}

/**
 * App-level configuration passed to `<ConfigProvider config={…}>`. Groups theming under `theme`,
 * the configurable key/param names under `keys`, and keeps the rest (`locales`, …) at the top — a
 * single place to grow.
 */
export interface Config {
  /** Theme settings (color overrides + initial mode). Omit entirely to use the built-in theme. */
  theme?: ThemeConfig
  /** Content locales the app supports — drive `<TranslatedFields>`' tabs (one per locale). */
  locales?: LocaleConfig[]
  /**
   * Configurable key / query-param names the components read — e.g. the `<Tabs>` query keys
   * (`tabQueryKey` / `nestedTabQueryKey`) and the `<TranslatedFields>` namespace
   * (`translationsNamespace`). Grows over time (`page`, `size`, …).
   */
  keys?: KeysConfig
  /** `<Table>` config — today the server-request query mapping (`table.query`) shared by every table. */
  table?: TableConfig
  /**
   * `RootLayout` header config, app-wide — the shell top-bar toggles (`theme` / `fullscreen` /
   * `search` / `breadcrumbs` / `pageTitle`) + the account (`onLogout` / `user`). A `RootLayout`
   * `header` prop is merged over this (the prop wins), so a specific shell can override.
   */
  header?: HeaderConfig
}

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
  locales: LocaleConfig[]
  /** Resolved translations namespace (`config.keys.translationsNamespace` ?? the built-in default). */
  translationsNamespace: string
  /** Resolved top-level tabs query key (`config.keys.tabQueryKey` ?? the built-in default). */
  tabQueryKey: string
  /** Resolved nested tabs query key (`config.keys.nestedTabQueryKey` ?? the built-in default). */
  nestedTabQueryKey: string
  /** Resolved stepper query key (`config.keys.stepQueryKey` ?? the built-in default). */
  stepQueryKey: string
  /** The `<Table>` server-request query mapping (`config.table.query` ?? `{}`). Defaults applied by `buildTableQuery`. */
  tableQuery: TableQueryConfig
  /** App-wide `RootLayout` header config (`config.header` ?? `{}`); the `RootLayout` prop merges over it. */
  header: HeaderConfig
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'tz-theme-mode'
/** The built-in default URL query param name a **top-level** `<Tabs>` syncs to (no `queryKey`/config). */
export const DEFAULT_TABS_QUERY_KEY = 'tab'
/** The built-in default URL query param name a **nested** `<Tabs>` syncs to (no `queryKey`/config). */
export const DEFAULT_NESTED_TAB_QUERY_KEY = 'nestedTab'
/** The built-in default URL query param name a `<Stepper>` syncs to (no `queryKey`/config). */
export const DEFAULT_STEP_QUERY_KEY = 'step'
/** Stable empty-locales fallback so the context value memo doesn't churn when no locales are configured. */
const EMPTY_LOCALES: LocaleConfig[] = []
/** Stable empty table-query fallback so the context memo doesn't churn when no `table.query` is configured. */
const EMPTY_TABLE_QUERY: TableQueryConfig = {}
/** Stable empty header fallback so the context memo doesn't churn when no `header` is configured. */
const EMPTY_HEADER: HeaderConfig = {}

/**
 * The library's built-in light palette — the single source of truth for every brand color's default
 * value. Apps override any subset via `config.colors.light`; the rest fall back to these. (theme.css
 * holds only the structure that references these values, not the values themselves.)
 */
const DEFAULT_LIGHT_COLORS: ThemePalette = {
  primary: '#13404e',
  secondary: '#ffffff',
  background: '#ffffff',
  surface: '#f5f7fa',
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
  surface: '#2a2a28', // a touch lighter than the dark background, for an elevated surface
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
  const translationsNamespace =
    config?.keys?.translationsNamespace ?? DEFAULT_TRANSLATIONS_NAMESPACE
  const tabQueryKey = config?.keys?.tabQueryKey ?? DEFAULT_TABS_QUERY_KEY
  const nestedTabQueryKey = config?.keys?.nestedTabQueryKey ?? DEFAULT_NESTED_TAB_QUERY_KEY
  const stepQueryKey = config?.keys?.stepQueryKey ?? DEFAULT_STEP_QUERY_KEY
  const tableQuery = config?.table?.query ?? EMPTY_TABLE_QUERY
  const headerConfig = config?.header ?? EMPTY_HEADER

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
      toggleMode,
      locales,
      translationsNamespace,
      tabQueryKey,
      nestedTabQueryKey,
      stepQueryKey,
      tableQuery,
      header: headerConfig,
    }),
    [
      mode,
      setMode,
      toggleMode,
      locales,
      translationsNamespace,
      tabQueryKey,
      nestedTabQueryKey,
      stepQueryKey,
      tableQuery,
      headerConfig,
    ],
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
 * The translations namespace configured on `<ConfigProvider config={{ keys: { translationsNamespace } }}>`,
 * resolved against the built-in default (`'translations'`). Lenient outside a provider. Use it to pass
 * the same namespace to the helpers, e.g. `buildTranslations(codes, fields, useTranslationsNamespace())`.
 */
export function useTranslationsNamespace(): string {
  return useContext(ThemeContext)?.translationsNamespace ?? DEFAULT_TRANSLATIONS_NAMESPACE
}

/**
 * The default top-level tabs query key configured on `<ConfigProvider config={{ keys: { tabQueryKey } }}>`,
 * resolved against the built-in default (`'tab'`). Lenient outside a provider. A top-level `<Tabs>` reads
 * it as the fallback for an omitted `queryKey`, so every tab strip URL-syncs out of the box.
 */
export function useTabsQueryKey(): string {
  return useContext(ThemeContext)?.tabQueryKey ?? DEFAULT_TABS_QUERY_KEY
}

/**
 * The default nested tabs query key configured on
 * `<ConfigProvider config={{ keys: { nestedTabQueryKey } }}>`, resolved against the built-in default
 * (`'nestedTab'`). Lenient outside a provider. A `<Tabs>` nested inside another tab's panel uses this
 * (instead of `tabQueryKey`) so the two strips don't collide on the same URL param.
 */
export function useNestedTabQueryKey(): string {
  return useContext(ThemeContext)?.nestedTabQueryKey ?? DEFAULT_NESTED_TAB_QUERY_KEY
}

/**
 * The default stepper query key configured on `<ConfigProvider config={{ keys: { stepQueryKey } }}>`,
 * resolved against the built-in default (`'step'`). Lenient outside a provider. A `<Stepper queryKey>`
 * (the bare/`true` opt-in form) reads it as the param name; a string `queryKey` overrides it.
 */
export function useStepQueryKey(): string {
  return useContext(ThemeContext)?.stepQueryKey ?? DEFAULT_STEP_QUERY_KEY
}

/**
 * The `<Table>` server-request query mapping configured on `<ConfigProvider config={{ table: { query } }}>`
 * (`{}` when unset / outside a provider). `<Table>` merges its own `queryMapping` prop over this, then feeds
 * the result to `buildTableQuery`, which applies the field defaults — so an unconfigured table emits the
 * default page-based `?page=…&size=…&search=…&sort=…` shape.
 */
export function useTableQueryConfig(): TableQueryConfig {
  return useContext(ThemeContext)?.tableQuery ?? EMPTY_TABLE_QUERY
}

/**
 * The app-wide `RootLayout` header config set on `<ConfigProvider config={{ header }}>` (`{}` when
 * unset / outside a provider). `RootLayout` merges its own `header` prop over this (the prop wins), so
 * a specific shell can override the app-wide defaults.
 */
export function useHeaderConfig(): HeaderConfig {
  return useContext(ThemeContext)?.header ?? EMPTY_HEADER
}
