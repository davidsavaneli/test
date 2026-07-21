// Public surface for `sava-test/theme` — the provider, theme + config hooks, config types, and the
// low-level applyTheme utility. The i18n hooks/builders/message-types live in `sava-test/i18n`
// (only `I18nConfig` stays here, since it's part of `Config`).
export {
  applyTheme,
  ConfigProvider,
  useTheme,
  useLocales,
  useTranslationsNamespace,
  useTabsQueryKey,
  useNestedTabQueryKey,
  useStepQueryKey,
  useTableQueryConfig,
  useHeaderConfig,
  DEFAULT_TABS_QUERY_KEY,
  DEFAULT_NESTED_TAB_QUERY_KEY,
  DEFAULT_STEP_QUERY_KEY,
  DEFAULT_FONT_FAMILY,
} from '../theme'
export type {
  ThemePalette,
  ThemeColor,
  Config,
  ThemeConfig,
  ThemeColors,
  ThemeMode,
  ConfigProviderProps,
  LocaleConfig,
  KeysConfig,
  TableConfig,
  TableQueryConfig,
  HeaderConfig,
  HeaderUser,
  I18nConfig,
} from '../theme'
