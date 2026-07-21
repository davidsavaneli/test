// Public surface for `sava-test/i18n` — everything for localizing the panel in one place: the two
// translator hooks (`useT` for the library's own strings, `useTranslations` for the app's own copy),
// the active-language switcher (`useLanguage`), and the pure builders + types behind them. These also
// reach the root `.` import. The i18n *config* shape (`I18nConfig`) stays with `Config` in `./theme`.
export { useT, useTranslations, useLanguage } from '../theme/ConfigProvider'
export { createTranslator, createAppTranslator } from '../i18n/messages'
export type {
  Messages,
  MessageKey,
  MessageCatalog,
  MessageOverrides,
  Translator,
  AppMessages,
  AppTranslator,
} from '../i18n/messages'
