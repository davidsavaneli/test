import type { LocaleConfig } from '../theme'

/**
 * Translation form helpers — framework-agnostic glue between `<TranslatedFields>`' **flat** field
 * names (`translations[en-US].title` — the `FormData` shape) and the **nested** JSON shape
 * (`{ translations: { 'en-US': { title } } }`). Public from `sava-test/helpers`.
 */

/** The default top-level namespace for the translation field names + the nested object. */
export const DEFAULT_TRANSLATIONS_NAMESPACE = 'translations'

/**
 * Builds a field's form name: `<namespace>[<locale>].<field>` (e.g. `translations[en-US].title`) —
 * the flat, bracketed key that maps cleanly to `FormData`. `namespace` defaults to `'translations'`.
 */
export const buildTranslationName = (
  locale: string,
  field: string,
  namespace: string = DEFAULT_TRANSLATIONS_NAMESPACE,
): string => `${namespace}[${locale}].${field}`

/**
 * Expands a per-field map into the flat, locale-namespaced record `<TranslatedFields>` submits — use
 * it to build a `<Form>`'s `defaultValues` **and** (with Zod field schemas as the values) the schema
 * shape. Pass the same `namespace` you give the component if you changed it.
 *
 * ```ts
 * const locales = ['en-US', 'ka-GE']
 * const fields = { title: '', description: '', shortDescription: '' }
 * const defaultValues = buildTranslations(locales, fields)
 * //   { 'translations[en-US].title': '', …, 'translations[ka-GE].shortDescription': '' }
 * const schema = z.object(
 *   buildTranslations(locales, { title: z.string().min(1), description: z.string(), shortDescription: z.string() }),
 * )
 * ```
 */
export function buildTranslations<T>(
  locales: ReadonlyArray<string | LocaleConfig>,
  fields: Record<string, T>,
  namespace: string = DEFAULT_TRANSLATIONS_NAMESPACE,
): Record<string, T> {
  const out: Record<string, T> = {}
  for (const loc of locales) {
    const code = typeof loc === 'string' ? loc : loc.code
    for (const field of Object.keys(fields)) {
      out[buildTranslationName(code, field, namespace)] = fields[field]
    }
  }
  return out
}

/** Parse a flat translation key (`<namespace>[<locale>].<field>`) → `{ locale, field }`, or `null`. */
function parseTranslationKey(
  key: string,
  namespace: string,
): { locale: string; field: string } | null {
  const open = `${namespace}[`
  if (!key.startsWith(open)) return null
  const close = key.indexOf(']', open.length)
  if (close === -1 || key[close + 1] !== '.') return null
  const locale = key.slice(open.length, close)
  const field = key.slice(close + 2)
  return locale && field ? { locale, field } : null
}

/**
 * Flat form values → the **nested** JSON shape. Translation keys (`translations[en-US].title`) fold
 * into `{ [namespace]: { [locale]: { [field]: value } } }`; every other key stays top-level. Use it at
 * the submit boundary when you POST JSON (rather than `FormData`):
 *
 * ```ts
 * await api.post('/news', nestTranslations(form.values))
 * //   { email: 1, translations: { 'en-US': { title: '…' }, 'ka-GE': { title: '…' } } }
 * ```
 */
export function nestTranslations(
  flat: Record<string, unknown>,
  namespace: string = DEFAULT_TRANSLATIONS_NAMESPACE,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(flat)) {
    const parsed = parseTranslationKey(key, namespace)
    if (parsed) {
      const bucket = (out[namespace] ??= {}) as Record<string, Record<string, unknown>>
      ;(bucket[parsed.locale] ??= {})[parsed.field] = value
    } else {
      out[key] = value
    }
  }
  return out
}

/**
 * The inverse of `nestTranslations`: a **nested** object (e.g. a backend response) → the flat values a
 * `<Form>` / `<TranslatedFields>` expects. Feed the result as `defaultValues` (or into `reset`):
 *
 * ```ts
 * const form = useForm({ schema, defaultValues: flattenTranslations(response) })
 * //   { email: 1, 'translations[en-US].title': '…', 'translations[ka-GE].title': '…' }
 * ```
 */
export function flattenTranslations(
  nested: Record<string, unknown>,
  namespace: string = DEFAULT_TRANSLATIONS_NAMESPACE,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(nested)) {
    if (key === namespace && value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [locale, fields] of Object.entries(value as Record<string, unknown>)) {
        if (fields && typeof fields === 'object') {
          for (const [field, v] of Object.entries(fields as Record<string, unknown>)) {
            out[buildTranslationName(locale, field, namespace)] = v
          }
        }
      }
    } else {
      out[key] = value
    }
  }
  return out
}

/**
 * Serialize flat form values into a `FormData` for a `multipart/form-data` POST. The flat translation
 * keys map straight through (`translations[en-US].title`); arrays become indexed keys (`tags[0]`,
 * `tags[1]`); `Blob`/`File` values are appended as-is; `null`/`undefined` are skipped; everything else
 * is stringified.
 *
 * ```ts
 * await fetch('/news', { method: 'POST', body: toFormData(form.values) })
 * ```
 */
export function toFormData(values: Record<string, unknown>): FormData {
  const fd = new FormData()
  const append = (key: string, value: unknown): void => {
    if (value === null || value === undefined) return
    if (value instanceof Blob) {
      fd.append(key, value)
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => append(`${key}[${index}]`, item))
    } else if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value as Record<string, unknown>))
        append(`${key}[${k}]`, v)
    } else {
      fd.append(key, String(value))
    }
  }
  for (const [key, value] of Object.entries(values)) append(key, value)
  return fd
}
