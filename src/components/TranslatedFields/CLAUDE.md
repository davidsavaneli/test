# TranslatedFields

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A tabbed group of **per-locale** form fields (built on **`Tabs`**) — one tab per content locale, each
rendering the **same** fields with locale-namespaced `name`s, so a `<Form>` submits e.g.
`translations[en-US].title` / `translations[ka-GE].title`. **Fields are supplied via a render
function** (children): `children: (name, locale) => ReactNode`, where **`name(field)`** returns the
namespaced form name for the active locale and `locale` is its code — you bring the field components
(`TextField`, `MultilineTextField`, a rich-text editor, anything). The render runs **once per locale**
to build each tab's content; only the active tab mounts, and switching tabs **remounts** the fields
(keyed by locale — no value/state bleed). **Locales** come from `<ConfigProvider config={{ locales }}>`
(via `useLocales()`), overridable with the **`locales`** prop (`{ code, label? }[]`; tab label =
`label ?? code`; globe **`icon`** default `'Global'`). The top-level word is the **`namespace`** —
field names are `<namespace>[<locale>].<field>` (the exported **`buildTranslationName(locale, field, namespace?)`**,
the flat bracket key that maps to `FormData`); it resolves **`namespace` prop →
`<ConfigProvider config={{ keys: { translationsNamespace } }}>` → `'translations'`** (via
`useTranslationsNamespace()`). Inside a `<Form>`, a locale's tab is flagged **`error`** (the `Tabs`
**red dot** — no full-tab tint) when any of its fields is invalid **and** shown (submitted/touched). On
submit, if the active locale is complete but **another locale holds the only remaining errors**, the
strip **auto-advances to that locale and focuses its first invalid field** — the form's own
scroll-to-error can't reach an unmounted tab, so `TranslatedFields` watches the form's **`submitCount`**
and does it (only when every remaining error is a translation key, so a plain-field error still scrolls
above the tabs first). Controlled
(`value`+`onChange`) or uncontrolled (`defaultValue`) active locale; `variant`/`size` pass through to
`Tabs`. The form values stay **flat** (`translations[en-US].title` — the `FormData` shape).
**Helpers** (all take an optional `namespace`): **`buildTranslations(locales, fields, namespace?)`**
expands a per-field map into the flat record — for the `<Form>`'s `defaultValues` **and** (with Zod
field schemas as the values) the schema shape: `z.object(buildTranslations(codes, { title: z.string().min(1), … }))`;
**`nestTranslations(flat, namespace?)`** folds the flat values into the **nested** JSON shape
(`{ translations: { 'en-US': { title } } }`, others stay top-level) for a JSON POST; and
**`flattenTranslations(nested, namespace?)`** is the inverse (a backend response → flat `defaultValues`);
and **`toFormData(flatValues)`** serializes the flat values into a `FormData` (translation keys pass
through, arrays → `tags[0]`, `Blob`/`File` as-is, `null` skipped) for a `multipart/form-data` POST.
`TranslatedFields` ships named **and** default from `sava-test/components`. The **helpers are
framework-agnostic** and live in `src/helpers/translations.ts`, exported from **`sava-test/helpers`**
(not `/components`): `buildTranslationName` / `buildTranslations` / `nestTranslations` /
`flattenTranslations` / `toFormData` / `DEFAULT_TRANSLATIONS_NAMESPACE`. Own CSS module (just the
per-locale field stack; the strip/panel chrome is `Tabs`).
