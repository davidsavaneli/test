/**
 * The library's own static UI strings, shipped **pre-translated** so a consuming app gets a localized
 * admin panel with zero setup — it just lists the languages in `config.i18n`. This is deliberately a
 * tiny, dependency-free layer (no i18next): the string set is small and fixed, resolved by a plain
 * `createTranslator`. Apps translate their **own** content however they like (react-i18next, …); this
 * only covers the library's built-in labels.
 *
 * This module owns the **types + resolution logic**; the actual per-language catalogs live one file
 * each under `./locales/` (`en.ts`, `ka.ts`, …), so the file stays small as languages are added.
 * **To add a string:** add its key to the `Messages` interface below, fill it in `./locales/en.ts`
 * (the complete baseline), and translate it in the other catalogs you can. **To add a language:** drop
 * a `./locales/<base>.ts` (a `MessageCatalog`) and register it in `BUILTIN_MESSAGES`. Any language the
 * library doesn't ship can still be supplied by the consumer via `config.i18n.messages`, falling back
 * to English per key. `{name}` tokens are interpolated from the `vars` passed to `t`.
 */
import { EN_MESSAGES } from './locales/en'
import { KA_MESSAGES } from './locales/ka'

// re-exported so `EN_MESSAGES` stays importable from `../i18n/messages` (its original home)
export { EN_MESSAGES }

export interface Messages {
  // shared / reused across components
  'common.close': string
  'common.cancel': string
  'common.confirm': string
  'common.delete': string
  'common.remove': string
  'common.loading': string
  'common.clear': string
  'common.apply': string
  'common.search': string
  'common.all': string
  'common.any': string
  'common.yes': string
  'common.no': string
  'common.save': string
  'common.insert': string
  'common.update': string
  'common.done': string
  'common.min': string
  'common.max': string
  'common.from': string
  'common.to': string
  // Select / MultiSelect
  'select.placeholder': string
  'select.noOptions': string
  'select.clear': string
  'multiSelect.clearAll': string
  // Pagination
  'pagination.previous': string
  'pagination.next': string
  'pagination.first': string
  'pagination.last': string
  'pagination.page': string
  // misc components
  'emptyState.title': string
  'userCard.signOut': string
  'textField.fieldAction': string
  'textField.showPassword': string
  'textField.hidePassword': string
  'textField.capsLock': string
  'textField.strengthWeak': string
  'textField.strengthMedium': string
  'textField.strengthStrong': string
  'numberField.decrease': string
  'numberField.increase': string
  'otpField.digit': string
  'breadcrumbs.label': string
  'breadcrumbs.home': string
  'themeToggle.label': string
  'fullscreenToggle.label': string
  'loader.label': string
  'tagsField.add': string
  // RemoveDialog
  'removeDialog.title': string
  'removeDialog.message': string
  // ColorPicker
  'colorPicker.pick': string
  'colorPicker.value': string
  'colorPicker.noColor': string
  'colorPicker.saturation': string
  'colorPicker.hue': string
  'colorPicker.opacity': string
  // date / time pickers
  'datePicker.clear': string
  'datePicker.open': string
  'calendar.prevMonth': string
  'calendar.nextMonth': string
  'timePicker.clear': string
  'timePicker.open': string
  'dateTimePicker.clear': string
  'dateTimePicker.open': string
  'dateTimePicker.label': string
  'dateTimePicker.dateTab': string
  'dateTimePicker.timeTab': string
  // Table
  'table.export': string
  'table.sendOnEmail': string
  'table.sort': string
  'table.sortBy': string
  'table.filters': string
  'table.filtersDescription': string
  'table.dragHandle': string
  'table.range': string
  'table.rowsPerPage': string
  // calendar — full month names (0–11) + short weekday labels (0 = Sunday … 6 = Saturday)
  'calendar.month0': string
  'calendar.month1': string
  'calendar.month2': string
  'calendar.month3': string
  'calendar.month4': string
  'calendar.month5': string
  'calendar.month6': string
  'calendar.month7': string
  'calendar.month8': string
  'calendar.month9': string
  'calendar.month10': string
  'calendar.month11': string
  'calendar.weekday0': string
  'calendar.weekday1': string
  'calendar.weekday2': string
  'calendar.weekday3': string
  'calendar.weekday4': string
  'calendar.weekday5': string
  'calendar.weekday6': string
  'calendar.selectYear': string
  // time columns
  'time.hour': string
  'time.minute': string
  'time.second': string
  'time.meridiem': string
  'time.am': string
  'time.pm': string
  // SettingsDrawer
  'settings.themeTitle': string
  'settings.themeDesc': string
  'settings.light': string
  'settings.lightDesc': string
  'settings.dark': string
  'settings.darkDesc': string
  'settings.languageDesc': string
  'settings.accentTitle': string
  'settings.accentDesc': string
  'settings.lightTheme': string
  'settings.darkTheme': string
  'settings.accentDefault': string
  'settings.fontTitle': string
  'settings.fontDesc': string
  'settings.fontFamily': string
  'settings.fontSearch': string
  'settings.fontDefault': string
  'settings.headerTitle': string
  'settings.headerDesc': string
  'settings.scrollable': string
  'settings.scrollableDesc': string
  'settings.fixed': string
  'settings.fixedDesc': string
  // RichTextEditor
  'rte.placeholder': string
  'rte.formatting': string
  'rte.undo': string
  'rte.redo': string
  'rte.fontSize': string
  'rte.textColor': string
  'rte.bold': string
  'rte.italic': string
  'rte.underline': string
  'rte.bulletList': string
  'rte.numberedList': string
  'rte.quote': string
  'rte.alignLeft': string
  'rte.alignCenter': string
  'rte.alignRight': string
  'rte.link': string
  'rte.insertImage': string
  'rte.insertVideo': string
  'rte.uploadImage': string
  'rte.imageByUrl': string
  'rte.imageError': string
  'rte.linkTitle': string
  'rte.linkUrl': string
  'rte.imageTitle': string
  'rte.imageUrl': string
  'rte.videoTitle': string
  'rte.videoUrl': string
  'rte.videoUrlPlaceholder': string
  'rte.embeddedVideo': string
  // FileUploader
  'fileUploader.choose': string
  'fileUploader.dropSuffix': string
  'fileUploader.uploaded': string
  'fileUploader.hintUpToOne': string
  'fileUploader.hintUpToMany': string
  'fileUploader.hintMax': string
  'fileUploader.exceedsLimit': string
  'fileUploader.download': string
  'fileUploader.remove': string
  'fileUploader.crop': string
  'fileUploader.editAlt': string
  'fileUploader.preview': string
  'fileUploader.closePreview': string
  'fileUploader.duplicate': string
  'fileUploader.wrongTypeOne': string
  'fileUploader.wrongTypeMany': string
  'fileUploader.tooLargeOne': string
  'fileUploader.tooLargeMany': string
  'fileUploader.cropTitle': string
  'fileUploader.altTitle': string
  'fileUploader.cropHint': string
  'fileUploader.altPlaceholder': string
  'fileUploader.cropError': string
  // CodeBlock
  'codeBlock.copy': string
  'codeBlock.copied': string
  // Sidebar / shell
  'sidebar.searchPages': string
  'account.label': string
  'settings.label': string
  'language.label': string
}

/** A message key (autocompleted + checked by `t`). */
export type MessageKey = keyof Messages
/** A (possibly partial) catalog for one language. */
export type MessageCatalog = Partial<Messages>
/** Consumer-supplied catalogs, keyed by language code (`'ka-GE'`) or base language (`'ka'`). */
export type MessageOverrides = Record<string, MessageCatalog>

/** Built-in catalogs the library ships, keyed by **base** language code. */
export const BUILTIN_MESSAGES: Record<string, MessageCatalog> = {
  en: EN_MESSAGES,
  ka: KA_MESSAGES,
}

/** Base language of a locale code — `'ka-GE'` → `'ka'`. */
const baseLang = (locale: string): string => locale.split('-')[0].toLowerCase()

/** A bound translator: `t('key')`, with optional `{name}` interpolation. */
export type Translator = (key: MessageKey, vars?: Record<string, string | number>) => string

/**
 * Build a translator for `locale`. Resolution per key: consumer override (exact code, then base) →
 * built-in catalog for the base language → English baseline → the key itself. `{name}` tokens in the
 * resolved string are replaced from `vars`.
 */
export function createTranslator(locale: string, overrides?: MessageOverrides): Translator {
  const b = baseLang(locale)
  const consumer: MessageCatalog = { ...overrides?.[b], ...overrides?.[locale] }
  const builtin = BUILTIN_MESSAGES[b] ?? {}
  return (key, vars) => {
    const raw = consumer[key] ?? builtin[key] ?? EN_MESSAGES[key] ?? key
    return vars ? raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : raw
  }
}

/**
 * Catalogs for the **consuming app's own** UI strings (used by `useTranslations()`), keyed by language
 * code or base language (`'ka-GE'` or `'ka'`), then by an arbitrary string key the app chooses. Unlike
 * {@link MessageOverrides} (which overrides the library's fixed `Messages`), these keys are free-form —
 * this is how an app localizes its own copy (section titles, labels) through the same language switcher.
 */
export type AppMessages = Record<string, Record<string, string>>

/** A translator over the app's own `AppMessages` — any string key, optional `{name}` interpolation. */
export type AppTranslator = (key: string, vars?: Record<string, string | number>) => string

/**
 * Build a translator over the consuming app's own `AppMessages` for `locale`. Resolution per key: exact
 * code → base language → English (`'en'`) → the key itself (so a missing translation renders the key
 * visibly rather than blank). `{name}` tokens are interpolated from `vars`. Powers `useTranslations()`.
 */
export function createAppTranslator(locale: string, appMessages?: AppMessages): AppTranslator {
  const b = baseLang(locale)
  const src = appMessages ?? {}
  return (key, vars) => {
    const raw = src[locale]?.[key] ?? src[b]?.[key] ?? src.en?.[key] ?? key
    return vars ? raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : raw
  }
}
