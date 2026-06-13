import { forwardRef, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useFormContext } from '../../form/formContext'
import { useLocales, useTranslationsNamespace, type LocaleConfig } from '../../theme'
import { buildTranslationName } from '../../helpers/translations'
import type { IconName } from '../../icons/names'
import { Tabs, type TabsSize, type TabsVariant } from '../Tabs'
import styles from './TranslatedFields.module.css'

/** Builds a field's namespaced form name for the active locale (`(field) => name`). */
export type TranslatedFieldName = (field: string) => string

export interface TranslatedFieldsProps {
  /**
   * Render the fields for one locale. `name(field)` returns the namespaced form name to put on each
   * control (e.g. `translations[en-US].title`); `locale` is the active code. The same render runs per
   * locale, so the fields are identical bar their names.
   */
  children: (name: TranslatedFieldName, locale: string) => ReactNode
  /**
   * Locales (one tab each). Defaults to the app's configured locales
   * (`<ConfigProvider config={{ locales }}>`).
   */
  locales?: LocaleConfig[]
  /**
   * Top-level namespace for the field names (`<namespace>[<locale>].<field>`) and the nested object.
   * Falls back to `<ConfigProvider config={{ keys: { translationsNamespace } }}>`, then `'translations'`.
   * Pass to override per-instance (e.g. `'languages'`).
   */
  namespace?: string
  /** Controlled active locale code. */
  value?: string
  /** Initial active locale code (uncontrolled). Defaults to the first locale. */
  defaultValue?: string
  /** Fires with the next active locale code. */
  onChange?: (locale: string) => void
  /** Icon shown on each locale tab. Defaults to `'Global'`. */
  icon?: IconName
  /** Tab strip variant. Defaults to `Tabs`' default (`underline`). */
  variant?: TabsVariant
  /** Tab + field density. Defaults to `Tabs`' default (`md`). */
  size?: TabsSize
  /** Accessible label for the tablist. Defaults to `'Translations'`. */
  'aria-label'?: string
  className?: string
  style?: CSSProperties
}

/**
 * A tabbed group of **per-locale** form fields — one tab per content locale, each rendering the same
 * fields with locale-namespaced `name`s (`translations[<locale>].<field>` by default), so a `<Form>`
 * submits e.g. `translations[en-US].title` / `translations[ka-GE].title`. You supply the fields once
 * via a render function that receives a `name(field)` builder for the active locale; bring any field
 * component (`TextField`, `MultilineTextField`, a rich-text editor, …). Locales come from
 * `<ConfigProvider config={{ locales }}>` (override with the `locales` prop). The top-level word is the
 * `namespace` (default `'translations'`, e.g. `'languages'`). While inside a `<Form>`, an incomplete
 * locale's tab shows a **dot**, and on submit the strip auto-advances to the first locale with errors
 * and focuses its field. Build the schema / defaults with `buildTranslations`; the form values stay
 * **flat** (`translations[en-US].title` — the `FormData` shape) — convert to/from the **nested** JSON
 * shape (`{ translations: { 'en-US': { title } } }`) with `nestTranslations` / `flattenTranslations`.
 * Requires the `Tabs` component.
 */
export const TranslatedFields = forwardRef<HTMLDivElement, TranslatedFieldsProps>(
  function TranslatedFields(
    {
      children,
      locales: localesProp,
      namespace: namespaceProp,
      value,
      defaultValue,
      onChange,
      icon = 'Global',
      variant,
      size,
      'aria-label': ariaLabel = 'Translations',
      className,
      style,
    },
    ref,
  ) {
    const configLocales = useLocales()
    const locales = localesProp ?? configLocales
    // namespace: the `namespace` prop wins, else the ConfigProvider's (which falls back to the default)
    const configNamespace = useTranslationsNamespace()
    const namespace = namespaceProp ?? configNamespace
    const form = useFormContext()

    // active locale — controlled (`value`) or internal; falls back to the first locale
    const isControlled = value !== undefined
    const [internal, setInternal] = useState<string | undefined>(defaultValue)
    const active = (isControlled ? value : internal) ?? locales[0]?.code ?? ''
    const setActive = (next: string) => {
      if (!isControlled) setInternal(next)
      onChange?.(next)
    }

    // the namespaced-name prefix for a locale (e.g. `translations[en-US].`)
    const prefixOf = (code: string) => buildTranslationName(code, '', namespace)
    // a locale's tab is flagged when any of its fields is invalid AND the error is shown (submitted/touched)
    const localeHasError = (code: string): boolean =>
      !!form &&
      Object.keys(form.errors).some(
        (key) => key.startsWith(prefixOf(code)) && (form.isSubmitted || form.touched[key] === true),
      )

    // merge the forwarded ref with an internal one (to query the mounted fields for scroll/focus)
    const rootRef = useRef<HTMLDivElement | null>(null)
    const setRootRef = (node: HTMLDivElement | null) => {
      rootRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as { current: HTMLDivElement | null }).current = node
    }

    // on each submit, if the active tab is complete but another locale has the only remaining errors,
    // switch to it and focus its first invalid field (the form's own scroll can't reach an unmounted tab)
    const lastSubmit = useRef(0)
    const pendingFocus = useRef<string | null>(null)
    useEffect(() => {
      const count = form?.submitCount ?? 0
      if (!form || count === lastSubmit.current) return
      lastSubmit.current = count
      const errorKeys = Object.keys(form.errors)
      if (errorKeys.length === 0) return
      const isTranslationKey = (k: string) => locales.some((l) => k.startsWith(prefixOf(l.code)))
      // a non-translation field is still invalid → the form's scroll-to-error handles it (above the tabs)
      if (!errorKeys.every(isTranslationKey)) return
      // active locale already shows its (mounted) errors → nothing to switch to
      if (errorKeys.some((k) => k.startsWith(prefixOf(active)))) return
      const firstBad = locales.find((l) => errorKeys.some((k) => k.startsWith(prefixOf(l.code))))
      if (firstBad && firstBad.code !== active) {
        pendingFocus.current = firstBad.code
        setActive(firstBad.code)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form?.submitCount])

    // once the auto-switched tab has mounted, focus its first invalid field
    useEffect(() => {
      if (pendingFocus.current == null || pendingFocus.current !== active) return
      pendingFocus.current = null
      const root = rootRef.current
      if (!root || !form) return
      const errorKeys = new Set(Object.keys(form.errors))
      const target = Array.from(root.querySelectorAll<HTMLElement>('[name]')).find((el) =>
        errorKeys.has(el.getAttribute('name') ?? ''),
      )
      target?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
      target?.focus({ preventScroll: true })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active])

    if (locales.length === 0) return null

    const items = locales.map((loc) => ({
      value: loc.code,
      label: loc.label ?? loc.code,
      icon,
      // an invalid locale shows the Tabs error dot (a small red dot — no full-tab tint)
      error: localeHasError(loc.code),
      // keyed by locale so switching tabs remounts the fields (no value/state bleed between locales)
      content: (
        <div key={loc.code} className={styles.fields}>
          {children((field) => buildTranslationName(loc.code, field, namespace), loc.code)}
        </div>
      ),
    }))

    return (
      <Tabs
        ref={setRootRef}
        className={className}
        style={style}
        items={items}
        value={active}
        onChange={setActive}
        variant={variant}
        size={size}
        // locale tabs are internal UI — never sync them to the page URL
        queryKey={null}
        aria-label={ariaLabel}
      />
    )
  },
)
