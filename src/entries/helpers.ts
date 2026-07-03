// Public surface for `sava-test/helpers` — framework-agnostic utilities usable outside React
// (e.g. RBAC checks in a router `beforeLoad` guard, or shaping a form payload).
export { setAccessKeys, getAccessKeys, hasAccess } from '../helpers/access'
export {
  buildTranslationName,
  buildTranslations,
  nestTranslations,
  flattenTranslations,
  toFormData,
  DEFAULT_TRANSLATIONS_NAMESPACE,
} from '../helpers/translations'
export { buildTableQuery } from '../helpers/table'
export type { TableQueryState } from '../helpers/table'
