# @techzy/ui — Component Library Spec

Authoring guide and design-system reference for `@techzy/ui`. Every new component, token,
and style **must** follow the patterns documented here so the library stays visually and
structurally consistent. When in doubt, copy an existing component's anatomy verbatim and
change only what differs.

> Communication note: the maintainer (David) writes and prefers replies in **Georgian**.
> Code, comments, JSDoc, and this document stay in **English**.

---

## 1. What this is

- **`@techzy/ui`** — a reusable, framework-agnostic React component library; the shared UI
  foundation for Techzy admin panels.
- **Stack:** React 19 (peer dep `>=18`), TypeScript (strict), Vite 6 library mode, CSS Modules,
  dual ESM/CJS output.
- **Scope & dependency policy — batteries-included for admin panels.** The goal is to pre-build as
  much reusable logic as possible so consuming apps stay thin; adding weight or a dependency is fine
  when it materially simplifies app code. (This supersedes the earlier "keep it light at all costs"
  rule.) Today the only **bundled** runtime dep is `clsx`. The **optional peer dependencies** are
  `external` (never bundled, used via the consumer's own instance): **`zod`** powers the form layer
  (`useForm`), **`@tanstack/react-router`** (`>=1`) powers the admin shell (`RootLayout` /
  `Sidebar` / `FirstRouteRedirect`), **`@tanstack/react-table`** (`>=8`, headless) powers the
  **`Table`**, **`dayjs`** (`>=1.11`) powers the date components
  (`DatePicker`, …), **`lexical`** (`>=0.45`) + its `@lexical/*` React packages power the
  **`RichTextEditor`**, and **`react-dropzone`** (`>=14`) + **`@dnd-kit/*`** (`core`/`sortable`/`utilities`)
  - **`@formkit/auto-animate`** (`>=0.8`) + **`react-image-crop`** (`>=11`) power the **`FileUploader`**
    (file picking/drop, drag reorder, list animation, per-item image crop). **`@dnd-kit/*`** also powers
    the **`Table`'s row reorder** (`reorderable`), and **`shiki`** (`>=1`) powers the **`CodeBlock`**
    (VS Code-engine syntax highlighting). Prefer React Context + hooks
    for internal state; reach for a dependency when it clearly earns its place.

---

## 2. Repository layout

```
src/
  components/             # every component (incl. the admin shell) — each its own folder
    <Name>/
      <Name>.tsx          # component (forwardRef + props interface)
      <Name>.module.css   # scoped styles (CSS Modules)
      CLAUDE.md           # this component's full spec (auto-loaded when working in the folder — see §7)
      index.ts            # barrel: re-export component + its types + `as default`
    Flex/                 # layout primitives — Flex engine + Row/Col presets + Grid (inline-style)
    RootLayout/           # admin shell (sidebar + header + content)
    Sidebar/              # auto-generated nav (Sidebar + FirstRouteRedirect + buildNavTree + nav hooks)
    Breadcrumbs/          # auto-generated breadcrumb trail (home → module → group → page)
    PageLayout/           # page-canvas container a page's body sits in
    index.ts              # re-exports every component (UI + shell)
  theme/
    applyTheme.ts         # ThemePalette type, hex→rgb, contrast logic, applyTheme()
    ConfigProvider.tsx     # ConfigProvider, useTheme, useLocales, Config (theme+locales+…), DEFAULT_LIGHT/DARK_COLORS
    index.ts
  hooks/
    useDisclosure.ts      # example hook (open/close/toggle)
    index.ts
  form/
    useForm.ts            # zod-powered form hook (validation, blur-then-live, submit gating)
    Form.tsx              # <Form form={...}> provider — binds nested fields by `name`
    formContext.ts        # FormContext + useFormContext (TextField auto-binds through this)
    index.ts
  helpers/
    access.ts             # RBAC access store (setAccessKeys/getAccessKeys/hasAccess/useAccessKeys)
    translations.ts       # translation form helpers (buildTranslations/nest/flatten/toFormData)
  icons/
    icons.ts              # generated inline-SVG registry (committed source of truth)
    names.ts              # generated IconName union + ICON_NAMES / ICON_COUNT (~1198 names)
  entries/                # curated public surfaces, one file per subpath export
    components.ts hooks.ts theme.ts i18n.ts icons.ts helpers.ts
  styles/
    reset.css             # global reset (consumer imports once)
    theme.css             # --tz-* token structure (solids/shades/contrast); color values come from TS
    general.css           # base body styles (consumer imports once)
  css-modules.d.ts        # ambient decls for *.module.css and *.css
  index.ts                # root entry: re-exports every subpath (see §10 for the exports map)
playground/main.tsx       # local demo (admin shell + component explorer; run via `npm run playground`)
scripts/build-icons.mjs   # regenerates icons.ts + names.ts from a raw Iconsax dump
scripts/post-build.mjs    # assembles dist/index.css + duplicates .d.ts → .d.cts (CJS types)
```

---

## 3. Design tokens (`--tz-*`)

All tokens live in `src/styles/theme.css` under `:root`. **Always use a token; never hardcode a
literal** color, size, radius, spacing, shadow, z-index, or duration in a component's CSS.

### 3.1 Color model — RGB triplets

Each theme color resolves to a **comma-separated RGB triplet** (not hex) so we can derive alpha shades
with `rgba()`. The triplet itself is **injected at runtime** by `ConfigProvider` (from
`DEFAULT_LIGHT_COLORS` + the app's overrides — see §5); `theme.css` declares only the structure that
references it:

```css
--tz-color-primary-rgb: 19, 64, 78; /* the triplet — injected by ConfigProvider, NOT in theme.css */
--tz-color-primary: rgb(var(--tz-color-primary-rgb)); /* solid convenience (in theme.css) */
--tz-color-primary-shade100: rgba(var(--tz-color-primary-rgb), 0.06); /* shades (in theme.css) */
/* ...shade200..shade800 */
--tz-color-primary-contrast: #ffffff; /* readable text color on a solid fill (theme.css fallback) */
```

**Theme palette (9 colors)** — light-mode defaults:

| token        | hex       | role                                                                                |
| ------------ | --------- | ----------------------------------------------------------------------------------- |
| `primary`    | `#13404e` | primary brand / default text                                                        |
| `secondary`  | `#ffffff` | a free theme color (near-white), selectable via `color` — **not** the panel surface |
| `background` | `#f9f9f9` | rear page background + shell canvas + flat `PageLayout` (behind the panels)         |
| `surface`    | `#ffffff` | the elevated panel surface — cards, sidebar, inputs, dropdowns, modals              |
| `accent`     | `#056472` | the single accent color (tints controls via `--tz-btn-rgb`)                         |
| `success`    | `#00a854` | semantic — success                                                                  |
| `error`      | `#f04134` | semantic — error/danger                                                             |
| `info`       | `#039aa1` | semantic — info                                                                     |
| `warning`    | `#ffbf00` | semantic — warning                                                                  |

> These hex values are the library's built-in light defaults — they live in `DEFAULT_LIGHT_COLORS`
> (`ConfigProvider.tsx`), the single source of truth. Consuming apps override any subset through
> `ConfigProvider` (see §5). Components must reference colors by **token name**, never by hex.

**Shade scale** (alpha applied to the color's triplet) — same steps for every color:

| token       | alpha | token       | alpha |
| ----------- | ----- | ----------- | ----- |
| `-shade100` | 0.06  | `-shade500` | 0.5   |
| `-shade200` | 0.10  | `-shade600` | 0.7   |
| `-shade300` | 0.14  | `-shade700` | 0.8   |
| `-shade400` | 0.30  | `-shade800` | 0.9   |

**Contrast tokens** (`--tz-color-<name>-contrast`): the text color that stays legible on top of
that color used as a solid fill. Used by `contained` controls. Defaults are mostly `#ffffff`;
`secondary-contrast` is `rgb(var(--tz-color-primary-rgb))` and `background-contrast` is `#04202b`
(dark text on the light canvas). These are **recomputed per mode** by `applyTheme()` — see §4.

### 3.2 Semantic colors

Thin aliases derived from theme tokens, so they flip automatically when the palette is swapped per
mode. The surface hierarchy is **two layers**: `--tz-color-background` is the **rear + canvas** — the
`<body>` fill and the shell canvas the panels float on (the flat `PageLayout` blends into it), and
`--tz-color-surface` is the **elevated panel surface** — the sidebar card, cards, inputs, dropdowns,
modals, and the Badge / Avatar cut-out rings. `--tz-color-secondary` is **no longer a surface**: it's
just a free theme color (near-white by default, selectable via `color`). `RootLayout` uses a **floating
layout**: the soft `--tz-color-background` canvas with rounded, elevated `--tz-color-surface` panels
(border + `--tz-shadow-xs`) floating on it. So the surface stack is **background (rear + canvas + flat
`PageLayout`) → surface (floating panels)**:

```css
--tz-color-text: rgb(var(--tz-color-primary-rgb)); /* = primary, the default text color */
--tz-color-border: rgba(var(--tz-color-primary-rgb), 0.12); /* hairline rules / control borders */
```

### 3.3 Typography tokens

```css
--tz-font-family: 'Inter', system-ui, -apple-system, ... sans-serif;
--tz-font-weight-regular: 400; /* DEFAULT for body and most components */
--tz-font-weight-medium: 500;
--tz-font-weight-bold: 600; /* only h1–h4 headings */
--tz-line-height: 1.4; /* single line-height for ALL Typography variants */
```

`--tz-line-height` is set once on the `.typography` base and every variant inherits it (no
per-variant line-heights). Controls (`Button`, `IconButton`) keep `line-height: 1` for crisp
vertical centering — they are not text blocks. `reset.css` uses `var(--tz-line-height, 1.4)` so it
still works when imported standalone.

Font-size scale (used by Typography variants and control sizes):

| token                | px  | token                | px  |
| -------------------- | --- | -------------------- | --- |
| `--tz-font-size-xxs` | 8   | `--tz-font-size-lg`  | 16  |
| `--tz-font-size-xs`  | 10  | `--tz-font-size-xl`  | 20  |
| `--tz-font-size-sm`  | 12  | `--tz-font-size-xxl` | 26  |
| `--tz-font-size-md`  | 14  |                      |     |

### 3.4 Radius & spacing

`--tz-space-*` (one scale for margin, padding, and gap): `xxs 4 · xs 8 · sm 16 · md 24 · lg 32 ·
xl 40 · xxl 48` (px). `--tz-radius-*` shares the small steps but tops out tighter (corners shouldn't
balloon): `xxs 4 · xs 8 · sm 16 · md 20 · lg 24 · xl 28 · xxl 32` (px).

### 3.5 Control heights

Inputs, selects, buttons — the `sm/md/lg` sizing baseline:

```css
--tz-control-height-sm: 34px;
--tz-control-height-md: 40px; /* default */
--tz-control-height-lg: 46px;
```

### 3.6 Shadow, z-index, motion

- `--tz-shadow-xs … -xl` — elevation for cards, dropdowns, modals, popovers.
- `--tz-z-dropdown 1000 · -sticky 1100 · -overlay 1200 · -modal 1300 · -popover 1400 · -toast 1500 · -tooltip 1600`.
  The portaled floating menus/popovers (`Dropdown` + the shared `FloatingPanel` behind `Select` /
  `MultiSelect` / the date-time pickers / `ColorPicker`) sit at **`--tz-z-popover`** — deliberately
  **above** `--tz-z-modal` — so a select/picker/menu opened **inside a `Modal`** floats over it (and
  over sticky headers). `--tz-z-dropdown` is the lowest floating layer for non-portaled cases.
- `--tz-duration: 300ms` — **the single motion duration**. All transitions use
  `var(--tz-duration)` with no custom easing (browser default). Do not introduce extra
  duration/easing tokens.

---

## 4. Color application (`applyTheme`)

`src/theme/applyTheme.ts` writes per-color CSS variables onto an element (default
`document.documentElement`) from a `ThemePalette` (a `{ name: hex }` map of the 9 theme colors):

For each color it sets:

- `--tz-color-<name>-rgb` — the hex converted to an `r, g, b` triplet.
- `--tz-color-<name>-contrast` — a readable text color for solid fills, via:
  1. **`CONTRAST_OVERRIDE`** map for hand-tuned colors:
     - `secondary` → `rgb(var(--tz-color-primary-rgb))` (near-white fill blends with the page, so
       the label uses the primary color and flips with the mode — no border needed).
     - `warning` → `#ffffff` (kept white by design).
  2. Otherwise **YIQ luminance**: `(r*299 + g*587 + b*114) / 1000 >= 150 ? '#04202b' : '#ffffff'`.

Because contrast is recomputed from the live triplet, a light `primary` in dark mode automatically
gets a dark label and stays readable.

### The `--tz-btn-rgb` / `--tz-btn-on` pattern

`Button` and `IconButton` set **two inline CSS vars** from the `color` prop, then the CSS derives
all 4 variants × 9 colors with `rgb()`/`rgba()` alpha math — no per-color CSS classes:

```tsx
style={{
  '--tz-btn-rgb': `var(--tz-color-${color}-rgb)`,
  '--tz-btn-on': `var(--tz-color-${color}-contrast, #fff)`,
  ...style,
}}
```

```css
.contained {
  background: rgb(var(--tz-btn-rgb));
  border-color: rgb(var(--tz-btn-rgb));
  color: var(--tz-btn-on, #fff);
}
.contained:hover:not(:disabled) {
  filter: brightness(0.92);
}
.filled {
  background: rgba(var(--tz-btn-rgb), 0.12);
  color: rgb(var(--tz-btn-rgb));
}
.filled:hover:not(:disabled) {
  background: rgba(var(--tz-btn-rgb), 0.2);
}
.outlined {
  background: transparent;
  border-color: rgba(var(--tz-btn-rgb), 0.5);
  color: rgb(var(--tz-btn-rgb));
}
.outlined:hover:not(:disabled) {
  background: rgba(var(--tz-btn-rgb), 0.08);
  border-color: rgb(var(--tz-btn-rgb));
}
.text {
  background: transparent;
  color: rgb(var(--tz-btn-rgb));
}
.text:hover:not(:disabled) {
  background: rgba(var(--tz-btn-rgb), 0.08);
}
```

Any future tintable control (Chip, Badge, Tab, …) should reuse this exact pattern.

---

## 5. Theming (`ConfigProvider` / `useTheme`)

```tsx
// fully themed — or just <ConfigProvider><App/></ConfigProvider> to use the built-in Techzy theme
<ConfigProvider config={{ locales, theme: { mode: 'light', colors: { light: { primary: '#...' }, dark: {...} } } }}>
  <App />
</ConfigProvider>
```

- **Default palettes live in TS, in `ConfigProvider.tsx`** — `DEFAULT_LIGHT_COLORS` (the full built-in
  light palette = the single source of truth for every theme color's default value) and
  `DEFAULT_DARK_COLORS` (the deltas that differ in dark: `primary #e6e8eb`, `secondary` & `surface
#191919`, `background #0f0f0f`, plus a brighter `accent` teal `#16a6b4`). `theme.css` holds **no** color values — only the structure (solids, shades,
  contrast fallbacks) that references the `-rgb` triplets `applyTheme` writes onto `<html>`.
- **`Config`** (the `<ConfigProvider config={…}>` type): `{ theme?: ThemeConfig; locales?: LocaleConfig[]; keys?: KeysConfig; table?: TableConfig; header?: HeaderConfig }`
  — theme settings grouped under **`theme`** (`{ colors?: { light?: Partial<ThemePalette>; dark?: Partial<ThemePalette> }; mode?: 'light' | 'dark' }`),
  the configurable key/param **names** grouped under **`keys`**, the `<Table>` server-request query mapping
  under **`table`** (`{ query?: TableQueryConfig }` — see below), the **`RootLayout` header** app-wide
  under **`header`** (`HeaderConfig` — the shell top-bar `theme`/`fullscreen`/`settings`/`search`/`breadcrumbs`/
  `pageTitle` toggles + `onLogout`/`user`; a `RootLayout` `header` prop merges over it, prop wins; read
  via **`useHeaderConfig()`**). Best practice: put the **static toggles** in `config.header` (app-wide)
  and pass the **runtime `user` + `onLogout`** via the `RootLayout` `header` prop at the render site
  (where the live auth state is), rather than hardcoding them in the module-level config. Then the rest
  (`locales`, …) at the top.
  Everything optional — omit `config` (or `theme`) to ship the built-in theme; override any **subset** of
  either palette. (Grows over time.)
- **`locales`** (`LocaleConfig[]` = `{ code: string; label?: string }[]`): the app's content locales —
  the single source the **`<TranslatedFields>`** tabs read (one tab per locale). Exposed via
  **`useLocales()`** (lenient — returns `[]` outside a provider, since a `<TranslatedFields locales>`
  prop can override). It's not theming per se, but it's the app-level config the provider already owns.
- **`keys`** (`KeysConfig`): the configurable key / query-param **names** the components read, grouped in
  one place (grows over time). Today:
  - **`keys.tabQueryKey`** (default `'tab'`): the URL query param a **top-level** **`Tabs`** syncs its
    active tab to — resolves **`queryKey` prop → `config.keys.tabQueryKey` → `DEFAULT_TABS_QUERY_KEY`
    (`'tab'`)**, so every strip is URL-synced out of the box (pass `queryKey={null}` on a strip to opt
    out). Read via **`useTabsQueryKey()`**.
  - **`keys.nestedTabQueryKey`** (default `'nestedTab'`): the query param a **nested** `Tabs` (one
    rendered inside another tab's panel) syncs to, so it doesn't collide with the outer strip's
    `tabQueryKey` (`?tab=…&nestedTab=…`). Auto-applied by nesting depth (`Tabs` tracks depth via an
    internal context); resolves **`queryKey` prop → `config.keys.nestedTabQueryKey` →
    `DEFAULT_NESTED_TAB_QUERY_KEY` (`'nestedTab'`)**. Read via **`useNestedTabQueryKey()`**. (3+ nesting
    levels reuse the nested key — set distinct `queryKey`s explicitly there.)
  - **`keys.stepQueryKey`** (default `'step'`): the URL query param a **`Stepper`** with the **bare
    `queryKey`** opt-in syncs its active step to (**1-based** — `?step=2` = index 1). Stepper sync is
    **opt-in (off by default)** — `queryKey` (`true`) uses this configured name, a string `queryKey`
    overrides it per stepper, and omitting the prop leaves the URL untouched (two synced steppers on
    one page need distinct keys). Read via **`useStepQueryKey()`**.
  - **`keys.translationsNamespace`** (default `'translations'`): the **`<TranslatedFields>`** namespace
    word — field names resolve **`namespace` prop → `config.keys.translationsNamespace` →
    `DEFAULT_TRANSLATIONS_NAMESPACE` (`'translations'`)**. Read via **`useTranslationsNamespace()`** —
    pass it to the helpers to match, e.g. `buildTranslations(codes, fields, useTranslationsNamespace())`.
    (The `<Table>` URL sync is **not** a `keys.*` entry — it reuses `table.query` below, so the address bar
    matches the server request; see §7.)
  - All the key hooks return the resolved string and are lenient outside a provider.
- **`table.query`** (`TableQueryConfig`): how a **`Table`** builds its **server-request** params — the query
  it hands the consumer as `state.params` / `state.query` in `onChange`, so a server-mode fetch doesn't
  hand-map page/size/search/sort every time. **The same mapping also drives the browser-URL sync** (`urlSync`),
  so the address bar mirrors `state.query` exactly — one shape for both the URL and the request. Fields (all
  optional; defaults reproduce the page-based shape `?page=1&size=10&search=…&sort=-key`): **`pageParam`** /
  **`sizeParam`** / **`searchParam`** / **`sortParam`** (request-param names, e.g. `skip`/`limit`/`q`/`sortBy`), **`pagination`**
  (`'page'` default emits the 1-based page; `'offset'` emits `(page-1)*size` under the `pageParam` name — a
  `skip`), **`sortFormat`** (`'field'` default = one `-`-prefixed param `sort=-price`; `'separate'` = key in
  `sortParam` + direction in **`sortOrderParam`** default `'order'` → `sortBy=price&order=desc`; `'suffix'` = the
  direction appended to the key in one param → `sort=priceAsc`/`sort=priceDesc`; the last two use **`ascValue`**
  / **`descValue`** default `'asc'`/`'desc'`), and **`allValue`** (what the size param emits for the **"All"**
  rows choice — e.g. `0`; on **"All"** the **page/offset param is dropped entirely** (no meaningful page) and
  only `allValue` is emitted — with no `allValue`, "All" emits neither). The same config also governs how the
  **`Table`'s filters** fold into `state.query`: **`multiSelectFormat`** (`'repeat'` default `cat=a&cat=b` /
  `'csv'` `cat=a,b` / `'indexed'` `cat[0]=a&cat[1]=b`) and **`rangeMinSuffix`** / **`rangeMaxSuffix`** (a range filter's two params, default
  `Min`/`Max` → `priceMin`/`priceMax`; set `_gte`/`_lte`, `[gte]`/`[lte]`, … — each filter's param base is its
  `queryKey ?? key`). Set once app-wide in `config.table.query`; override
  per table via the **`queryMapping`** prop (merged over the config). Read via **`useTableQueryConfig()`**;
  the pure builders are **`buildTableQuery(state, mapping)`** (page/size/search/sort, from `sava-test/helpers`)
  - the internal **`buildFilterQuery(filters, filterState, mapping)`**, which `Table` calls internally. Their
    inverses — **`parseTableQuery(params, mapping)`** (also from `sava-test/helpers`) + the internal
    `parseFilterQuery` — read the state back out, and power the browser-URL sync (which reuses this exact
    mapping, so the address bar matches `state.query`). Because they're just param builders, the **endpoint /
    path / fetch stay the consumer's** (e.g. DummyJSON puts search on a different path) — `Table` never fetches.
- **Light merge**: `{ ...DEFAULT_LIGHT_COLORS, ...config.colors.light }` — built-in defaults as base,
  the app's light overrides win.
- **Dark merge**: `{ ...light, ...DEFAULT_DARK_COLORS, ...config.colors.dark }` — the merged light
  palette as base, then the library's dark deltas, then the app's own dark overrides win.
- On mode / accent change the resolved palette is committed to `<html>` — `applyTheme(palette)` + the
  `data-tz-theme` attr + CSS `color-scheme` + persisting the mode to `localStorage['tz-theme-mode']`.
  This runs **eagerly in `setMode`/`toggleMode`/`setAccentColor`** (so `<html>` updates the instant you
  toggle, not after React re-renders the whole subtree) **and** in a `useLayoutEffect` (mount / external
  changes) — the commit is idempotent, so doing both is safe.
- **Accent-color override**: a user-picked `accent` color (via `useTheme().setAccentColor(color, mode?)`)
  overrides the configured/default `accent` **per mode** (light and dark keep **independent** overrides),
  is applied by the same effect, and persists to **`localStorage['tz-accent-color-<mode>']`** — so each
  mode's chosen accent is restored on the next visit (`null` clears that mode's, back to its
  configured/default accent). The `RootLayout` header **Settings** drawer drives it with **two swatch
  pickers** (one per mode — deeper tones for light, brighter for dark; see the Layout §).
- **`useTheme()`** returns `{ mode, setMode, toggleMode, accentColors, defaultAccentColors, setAccentColor, headerSticky, setHeaderSticky, fontFamily, setFontFamily }`
  where **`accentColors`** / **`defaultAccentColors`** are `Record<'light'|'dark', …>` (the per-mode
  overrides `string | null` / the per-mode configured defaults `string`, i.e. the "no override" values —
  so UI needn't hardcode), and **`setAccentColor(color, mode?)`** sets one mode's override (defaults to
  the current mode). **`headerSticky`** (`boolean`) is the persisted fixed-vs-static shell-header
  preference (seeded from `config.header.sticky`, default `false`) and **`setHeaderSticky(bool)`** sets +
  persists it (`localStorage['tz-header-sticky']`) — the `RootLayout` **Settings** drawer drives it.
  **`fontFamily`** (`string`) is the active font (seeded from `config.theme.fontFamily`, default `Inter`)
  and **`setFontFamily(family)`** sets + persists it (`localStorage['tz-font-family']`), writing the stack
  to `--tz-font-family` and loading the Google Font on demand (only the default `Inter` is pre-imported;
  any other family loads lazily on first selection). The Settings drawer surfaces this as one searchable
  `Select` — Inter is the only preset, and typing any Google Font name offers it as a pick.
  Throws outside a provider.
- Initial mode = stored value if present, else `config.mode`, else `'light'`; initial `accentColors` = the
  stored per-mode overrides if present, else `null` each.
- **No-JS note:** because the triplet values are injected by `applyTheme` (not declared in `theme.css`),
  colors require `ConfigProvider` to have mounted. It runs in `useLayoutEffect` (before first paint), so
  there's no flash in a normal CSR app; importing the CSS alone (no provider) yields no theme colors.
- **UI i18n (`config.i18n`, distinct from `locales`).** The library **ships translations for its own
  built-in strings** (labels/placeholders/aria-labels), so a consuming app gets a localized panel with
  zero setup — it just lists **`config.i18n.languages`** (`{ code, label }[]`, default English only) and
  optionally a default **`language`**. It's a tiny **dependency-free** layer (no i18next — the string set
  is small + fixed), in `src/i18n/messages.ts`: a typed `Messages` interface, a complete **English**
  baseline + built-in **Georgian** (`ka`), and `createTranslator(locale, overrides)`. Components read via
  **`useT()`** (lenient — English outside a provider, so they render standalone / in tests):
  `t('select.noOptions')`, with `{name}` interpolation (`t('pagination.page', { page })`). Resolution per
  key: consumer `config.i18n.messages` (exact code → base) → built-in catalog → English → the key. The
  active language is persisted (`localStorage['tz-locale']`), default English, switched via
  **`useLanguage()`** / the `RootLayout` **Settings → Language** `Select` (shown when >1 language).
  **Adding a built-in string:** add its key to `Messages`, fill `EN_MESSAGES`, translate in the built-in
  catalogs. _Coverage of the library's own components is complete — every user-facing string routes through
  `useT()`; a couple of deliberate exceptions stay English-in-all-languages by design (the `CodeBlock`
  syntax content is code, and the `RichTextEditor` block-type dropdown labels — Paragraph / Heading /
  Bullet List / … — are editor-standard terms kept literal on purpose)._
- **App's OWN strings — `config.i18n.appMessages` + `useTranslations()`.** For the consuming app's own copy
  (section titles, labels, business text — e.g. `"Customer transactions"`), the app passes its **own**
  free-form catalogs in **`config.i18n.appMessages`** (`Record<langCode, Record<key, string>>`, keyed by
  language code/base then any string key it picks) and reads them via **`useTranslations()`** — an
  `AppTranslator` `(key, vars?) => string` **bound to the active UI language**, so the app's text switches
  together with the panel from the one language switcher. Per-key resolution: exact code → base language →
  English (`'en'`) → **the key itself** (a missing translation renders visibly, not blank), with the same
  `{name}` interpolation. Lenient outside a provider (echoes the key). This keeps app localization
  **zero-extra-infra** (no second i18n library needed for the panel), but apps are still free to use
  react-i18next/etc. for their own content if they prefer — `useTranslations()` is the built-in shortcut,
  not a mandate. `useT()` is for the library's strings; `useTranslations()` is for the app's. The pure
  builder is **`createAppTranslator(locale, appMessages)`**. All i18n exports (`useT`, `useTranslations`,
  `useLanguage`, `createTranslator`/`createAppTranslator`, message types) live on the **`sava-test/i18n`**
  subpath — its own home, so localization imports don't reach through `theme`; they're on the root `.`
  import too. (`I18nConfig` stays with `Config` in `sava-test/theme`.)

---

## 6. Component anatomy (the required pattern)

Every component follows this shape. Deviating breaks consistency — don't.

```tsx
import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
import styles from './Widget.module.css'

export type WidgetVariant = 'contained' | 'filled' | 'outlined' | 'text'
export type WidgetSize = 'sm' | 'md' | 'lg'

export interface WidgetProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  /** JSDoc on EVERY prop — short, English, describes behavior + default. */
  variant?: WidgetVariant
  /** Theme palette token that tints the control. Defaults to `accent`. */
  color?: ThemeColor
  size?: WidgetSize
}

export const Widget = forwardRef<HTMLButtonElement, WidgetProps>(function Widget(
  { variant = 'contained', color = 'dark', size = 'md', className, style, children, ...props },
  ref,
) {
  return (
    <element
      ref={ref}
      className={clsx(styles.widget, styles[variant], styles[size], className)}
      style={{ '--tz-btn-rgb': `var(--tz-color-${color}-rgb)`, ...style } as CSSProperties}
      {...props}
    >
      {children}
    </element>
  )
})
```

Rules baked into the pattern:

1. **`forwardRef`** with a named function (shows in React DevTools). Ref points at the root DOM node.
2. **Props extend the matching DOM attributes** and **`Omit<…, 'color'>`** — `color` is redefined as
   a brand `ThemeColor` token, not a CSS color string.
3. **Destructure every prop you handle** out of `props`, give defaults inline, then spread `{...props}`.
   Destructured names are removed from `props`, so your explicit attributes (`type`, `disabled`, …)
   are safe.
4. **`clsx`** composes class names: `styles.base`, `styles[variant]`, `styles[size]`,
   `condition && styles.modifier`, then the incoming `className` **last** (consumer can override).
5. **`style`** merges design-system CSS vars first, then `...style` so the consumer can override.
6. **CSS Modules** for all styling. Class names are camelCase and map 1:1 to prop values
   (`variant="outlined"` → `styles.outlined`).
7. **`index.ts` barrel** per component:
   ```ts
   export { Widget } from './Widget'
   export type { WidgetProps, WidgetVariant, WidgetSize } from './Widget'
   ```
   Then add `export * from './Widget'` to `src/components/index.ts`.

### Standard prop vocabulary (reuse these names/types)

| prop           | type                                        | default       | notes                                                                                                                               |
| -------------- | ------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `variant`      | `'contained'\|'filled'\|'outlined'\|'text'` | `'contained'` | for tintable controls                                                                                                               |
| `color`        | `ThemeColor`                                | `'accent'`    | theme palette token; drives `--tz-btn-rgb`. Text/`Typography` default stays `primary` (via `--tz-color-text`).                      |
| `size`         | `'sm'\|'md'\|'lg'`                          | `'md'`        | maps to control-height / font / icon size                                                                                           |
| `loading`      | `boolean`                                   | `false`       | shows `Loader`, sets native `disabled` + `aria-busy`                                                                                |
| `disabled`     | `boolean`                                   | `false`       | `opacity: 0.5` + `cursor: not-allowed`                                                                                              |
| `rounded`      | `boolean`                                   | `false`       | pill (`999px`) / circle                                                                                                             |
| `fullWidth`    | `boolean`                                   | `false`       | `width: 100%` (the field inputs — `TextField`/`NumberField` — default it to `true`)                                                 |
| `nonClickable` | `boolean`                                   | `false`       | non-interactive but **normal** look (not dimmed) — `pointer-events: none` + `tabIndex={-1}` + `aria-disabled`, no native `disabled` |

### Color inheritance (`Icon`, `Loader`, `Typography`)

Display primitives **inherit the surrounding text color** via `currentColor` when `color` is
omitted, and use `var(--tz-color-<color>)` when a token is given. This lets an `Icon`/`Loader`
adopt its parent `Button`'s text color automatically. Preserve this behavior in new primitives.

---

## 7. Component reference

Every component's full spec now lives in a **co-located `CLAUDE.md` inside its own folder**
(`src/components/<Name>/CLAUDE.md`, and `src/hooks` / `src/form` for those) — Claude Code auto-loads
that file when you work in the folder, so you get the full prop/behavior spec exactly when you need it
and nothing when you don't. This section is the **index**: each entry is a one-line hook + a link to its
doc. All components export from the package root; sizes are always `sm | md | lg`. When you add a
component, create its folder `CLAUDE.md` too (see §12).

### Display & typography

- [Icon](src/components/Icon/CLAUDE.md) — inline SVG from the generated registry; follows text color.
- [Loader](src/components/Loader/CLAUDE.md) — circular CSS spinner; inherits text color.
- [Typography](src/components/Typography/CLAUDE.md) — text/heading variants (h1–h4, body, caption, …).
- [Divider](src/components/Divider/CLAUDE.md) — horizontal/vertical separator, optional label.
- [Badge](src/components/Badge/CLAUDE.md) — pins a count/dot to a child's corner.
- [Chip](src/components/Chip/CLAUDE.md) — compact pill tag/token (optional delete / avatar / icon).
- [Avatar / AvatarGroup](src/components/Avatar/CLAUDE.md) — image/initials/icon avatar; overlapping group with `+N` overflow.

### Buttons & actions

- [Button](src/components/Button/CLAUDE.md) — the standard button (4 variants × colors × sizes, loading, icons).
- [IconButton](src/components/IconButton/CLAUDE.md) — square icon-only button (requires `aria-label`).
- [ToggleButton / ToggleButtonGroup](src/components/ToggleButton/CLAUDE.md) — two-state button + segmented control.
- [SpeedDial / SpeedDialAction](src/components/SpeedDial/CLAUDE.md) — floating action button that fans out actions.
- [ThemeToggle](src/components/ThemeToggle/CLAUDE.md) — light/dark mode switch (wraps `IconButton`).
- [FullscreenToggle](src/components/FullscreenToggle/CLAUDE.md) — Fullscreen-API toggle; auto-hides where unsupported.

### Form fields (bind to `<Form>` by `name`)

- [TextField](src/components/TextField/CLAUDE.md) — labeled text input (adornments, mask, regex, password reveal).
- [MultilineTextField](src/components/MultilineTextField/CLAUDE.md) — auto-growing `textarea` sibling of TextField.
- [NumberField](src/components/NumberField/CLAUDE.md) — numeric input with `+`/`−` steppers + thousand separators.
- [OtpField](src/components/OtpField/CLAUDE.md) — one-time-passcode boxes.
- [TagsField](src/components/TagsField/CLAUDE.md) — tags / token input (Chips).
- [Slider](src/components/Slider/CLAUDE.md) — range slider (single or two-thumb).
- [Checkbox](src/components/Checkbox/CLAUDE.md) — labeled checkbox (CSS tick).
- [Switch](src/components/Switch/CLAUDE.md) — on/off toggle switch.
- [Radio / RadioGroup](src/components/Radio/CLAUDE.md) — radio button + single-select group.
- [ChoiceCard / ChoiceCardGroup](src/components/ChoiceCard/CLAUDE.md) — selectable cards (radio / checkbox semantics).
- [Select](src/components/Select/CLAUDE.md) — single-select dropdown (searchable, server search).
- [MultiSelect](src/components/MultiSelect/CLAUDE.md) — the `string[]` sibling of Select.
- [ColorPicker](src/components/ColorPicker/CLAUDE.md) — color field with a popover picker + alpha.
- [SwatchPicker](src/components/SwatchPicker/CLAUDE.md) — pick a color from a fixed preset palette of swatches (rounded tiles).
- [DatePicker](src/components/DatePicker/CLAUDE.md) — masked date input + calendar popover.
- [DateTimePicker](src/components/DateTimePicker/CLAUDE.md) — date + time (tabbed popover; store-UTC / show-local).
- [TimePicker](src/components/TimePicker/CLAUDE.md) — time-only picker.
- [RichTextEditor](src/components/RichTextEditor/CLAUDE.md) — Lexical WYSIWYG editor (HTML value).
- [FileUploader](src/components/FileUploader/CLAUDE.md) — file field (pick/drop/reorder/crop/alt-text); never uploads itself.
- [TranslatedFields](src/components/TranslatedFields/CLAUDE.md) — per-locale tabbed fields for a `<Form>`.

### Form engine

- [Form — `useForm`](src/form/CLAUDE.md) — the Zod-powered form hook + `<Form>` provider (`src/form/`).

### Feedback & overlays

- [Alert](src/components/Alert/CLAUDE.md) — inline message banner (info / success / warning / error).
- [Toast / Toaster](src/components/Toast/CLAUDE.md) — imperative transient notifications (reuses `Alert`).
- [Tooltip](src/components/Tooltip/CLAUDE.md) — floating label on hover / focus.
- [Modal](src/components/Modal/CLAUDE.md) — centered backdrop dialog / side drawer.
- [RemoveDialog](src/components/RemoveDialog/CLAUDE.md) — ready-made delete-confirmation over `Modal`.
- [Popover](src/components/Popover/CLAUDE.md) — anchored popover for arbitrary content.
- [Dropdown](src/components/Dropdown/CLAUDE.md) — floating menu of `ListItem`s.
- [FloatingPanel](src/components/FloatingPanel/CLAUDE.md) — **internal** shared popover plumbing (Select / pickers / Popover).
- [Overlay](src/components/Overlay/CLAUDE.md) — **internal** shared backdrop (Modal + the FileUploader lightbox).

### Layout & containers

- [Flex / Row / Col / Grid](src/components/Flex/CLAUDE.md) — flexbox + grid layout primitives (inline-styled).
- [Card](src/components/Card/CLAUDE.md) — surface container with header / body / footer, collapsible.
- [List / ListItem](src/components/List/CLAUDE.md) — flexible rows + a semantic container.
- [Accordion / AccordionItem](src/components/Accordion/CLAUDE.md) — collapsible panels.
- [Tabs](src/components/Tabs/CLAUDE.md) — data-driven tab strip with URL sync.
- [Stepper](src/components/Stepper/CLAUDE.md) — step-progress indicator (wizard / checkout).
- [Table](src/components/Table/CLAUDE.md) — TanStack-powered data table (sort / filter / paginate / URL sync / server mode).
- [Pagination](src/components/Pagination/CLAUDE.md) — page navigator (`1 … 4 5 6 … 10`).
- [Timeline / TimelineItem](src/components/Timeline/CLAUDE.md) — vertical event timeline.
- [EmptyState](src/components/EmptyState/CLAUDE.md) — empty-state placeholder.
- [CodeBlock](src/components/CodeBlock/CLAUDE.md) — shiki syntax-highlighted code block.
- [UserCard](src/components/UserCard/CLAUDE.md) — compact account card (avatar + name/email + sign-out).

### Admin shell (TanStack Router)

The shell is documented as one unit in **[RootLayout/CLAUDE.md](src/components/RootLayout/CLAUDE.md)**
(covers `RootLayout`, `Sidebar`, `Breadcrumbs`, `PageLayout`, RBAC, and route `staticData`); the
sibling folders each carry a local capsule of their own facts + a pointer to that full narrative.

- [RootLayout](src/components/RootLayout/CLAUDE.md) — the floating admin shell (sidebar + header + content); mounts `Toaster`.
- [Sidebar](src/components/Sidebar/CLAUDE.md) — auto-generated 3-level nav from the routes.
- [Breadcrumbs](src/components/Breadcrumbs/CLAUDE.md) — auto-generated breadcrumb trail.
- [PageLayout](src/components/PageLayout/CLAUDE.md) — the flat `Card` a page's body sits in.

### Hooks

- [Hooks](src/hooks/CLAUDE.md) — `useDisclosure`, `useLockBodyScroll`, `useMediaQuery`, `useFloatingPanel` (`src/hooks/`).

---

## 8. Conventions (hard rules)

- **Title Case** all visible UI text and demo labels (`Save`, `Full Width`, not `save`).
- **Default font weight is `regular` (400).** Only `h1`–`h4` use `bold` (600). Don't bold body text.
- **Tokens over literals.** Every color/size/radius/space/shadow/z/duration in CSS must be a
  `--tz-*` token. Hardcoded values are only allowed inside `theme.css` (the token definitions
  themselves) and the contrast constants in `applyTheme.ts`.
- **English JSDoc** on every exported component and every public prop. Keep it short and describe
  behavior + default.
- **Formatting is Prettier** (`.prettierrc.json`: single quotes, no semicolons, `printWidth: 100`,
  `trailingComma: "all"`). Run `npm run format`; `npm run format:check` must pass. Don't hand-fight
  the formatter. The generated icon files and the lockfile are in `.prettierignore`.
- **Accessibility is part of the component**, not an afterthought: `aria-busy` while loading,
  `aria-label` for icon-only controls, `role`/`aria-checked` for toggles, `aria-hidden` for
  decorative icons, `role="status"` for the loader.
- **Dependencies earn their place** (see §1). Prefer pre-building reusable logic in the lib over
  pushing it to every app; add a dependency when it materially simplifies consumer code. Keep new
  deps **bundle-free where possible** (`external` + optional peer, like `zod`).

---

## 9. Icons pipeline

- Icons are an Iconsax-derived set, ~1198 entries. The committed source of truth is
  `src/icons/icons.ts` (inline SVG strings) + `src/icons/names.ts` (the `IconName` union). Raw
  `.svg` files are **not** kept in the repo.
- To change the set: drop the raw Iconsax dump into `icons-raw/` (gitignored), run
  `npm run build:icons`, commit the regenerated `icons.ts` + `names.ts`, then clear `icons-raw/`.
- The generator strips `width`/`height` (size comes from `<Icon>`), drops no-op clipPaths, and
  normalizes every color to `currentColor`. Names are PascalCase; numeric suffixes resolve clashes.
- **Custom (non-Iconsax) icons** live in `scripts/custom-icons.mjs` (`{ name, inner }`, matching the
  fill-based style); `build:icons` merges them into the registry so they survive regeneration. Today:
  `ListBullet` / `ListNumber` (bulleted & numbered-list icons reusing the `Task` checklist's line paths,
  used by the `RichTextEditor` block dropdown) and `Close` (a bare × — the `Add` plus paths rotated 45°,
  so it keeps Add's thin stroke weight — used by the `Modal` close button). When hand-editing the
  generated `icons.ts`/`names.ts` directly (e.g. when no raw dump is present), keep them in sync with
  `custom-icons.mjs`.

---

## 10. Build, scripts & publishing

| script                 | does                                                 |
| ---------------------- | ---------------------------------------------------- |
| `npm run playground`   | `vite` dev server for `playground/main.tsx`          |
| `npm run dev`          | `vite build --watch` (library watch build)           |
| `npm run build`        | lib build + types + CSS assembly (see below)         |
| `npm run build:icons`  | regenerate the icon registry                         |
| `npm run typecheck`    | `tsc --noEmit`                                       |
| `npm test`             | run the Vitest suite once (`vitest run`)             |
| `npm run format`       | Prettier-format the whole repo                       |
| `npm run format:check` | verify formatting (CI-friendly, no writes)           |
| `npm run lint:pkg`     | `publint` — validate the package `exports`/types map |

### Subpath exports (the public API shape)

The package exposes **scoped subpaths**, not just the root. The aggregator files in `src/entries/`
define each surface; the root `src/index.ts` re-exports them all. `package.json` `exports` maps:

| subpath                               | source entry                          | what's in it                                                                                                                                                                                                                                           |
| ------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.` (root)                            | `src/index.ts`                        | everything (back-compat / classic resolution)                                                                                                                                                                                                          |
| `./components`                        | `src/entries/components.ts`           | every component + shell + `Form`                                                                                                                                                                                                                       |
| `./components/*`                      | each `src/components/<Name>/index.ts` | one component (named **and** `default`)                                                                                                                                                                                                                |
| `./hooks`                             | `src/entries/hooks.ts`                | `useDisclosure`, `useLockBodyScroll`, `useMediaQuery`, `useForm`, `useAccessKeys`                                                                                                                                                                      |
| `./theme`                             | `src/entries/theme.ts`                | `ConfigProvider`, `useTheme`, `useLocales`, `useTranslationsNamespace`, `useTabsQueryKey`, `useNestedTabQueryKey`, `useStepQueryKey`, `useTableQueryConfig`, `useHeaderConfig`, `applyTheme` (+ config types incl. `I18nConfig`)                       |
| `./i18n`                              | `src/entries/i18n.ts`                 | UI-localization: `useT` (library strings), `useTranslations` (app strings), `useLanguage` (active language + switcher), `createTranslator`/`createAppTranslator`, and the message types (`Messages`/`Translator`/`AppMessages`/…)                      |
| `./icons`                             | `src/entries/icons.ts`                | `Icon`, `IconName`, `ICON_NAMES`, `icons`                                                                                                                                                                                                              |
| `./helpers`                           | `src/entries/helpers.ts`              | RBAC (`setAccessKeys`/`getAccessKeys`/`hasAccess`) + translation helpers (`buildTranslations`/`nestTranslations`/`flattenTranslations`/`toFormData`/`buildTranslationName`) + the `Table` query builder + parser (`buildTableQuery`/`parseTableQuery`) |
| `./css/reset.css`, `./css/styles.css` | —                                     | the two stylesheets                                                                                                                                                                                                                                    |

Rules when adding/moving public API: keep internal-only symbols **out** of the entry files (e.g.
`useFormContext`, `usePageTitle`, `useBreadcrumbs`, nav-tree internals); a new top-level group gets a
new `src/entries/<group>.ts` + an `exports` block. Every component folder's `index.ts` adds
`export { <Name>, <Name> as default }` so `sava-test/components/<Name>` resolves as both.

### Output & build

- **JS:** Vite library mode, **multi-entry** (`src/index.ts`, the five `src/entries/*`, and one per
  component folder via a glob). Each emits ESM `.js` + CJS `.cjs`. Components build into their own
  directory (`dist/components/<Name>/index.js`) — **never a flat `dist/components/<Name>.js`** — so the
  runtime file can't shadow the `index.d.ts` types during the barrel's `export *` under
  `moduleResolution: bundler`. `output.exports: 'named'` (components ship named **and** default).
  `react`/`react-dom`/`clsx`/`zod`/`@tanstack/react-router` are **external**.
- **Types:** `tsc -p tsconfig.build.json` emits the `.d.ts` tree mirroring `src/`. `scripts/post-build.mjs`
  then duplicates every `*.d.ts` → `*.d.cts` so the CJS (`require`) condition resolves CJS-flavored
  types under `node16`/`nodenext`. Each `exports` entry splits `import`/`require`, each with its own
  `types`.
- **CSS:** `cssCodeSplit: false` → one CSS asset; `post-build.mjs` prepends `theme.css + general.css`
  into `dist/index.css` and copies `reset.css`. `sideEffects: ["**/*.css"]` keeps tree-shaking safe.
- **Validation:** run `npm run lint:pkg` (`publint`) before publishing — it must say "All good!".
- **Published files:** only `dist`. **Consumers** import from the subpaths (or root) and the
  stylesheets once at app entry (`sava-test/css/reset.css`, then `sava-test/css/styles.css`).
  Subpath types need consumer `moduleResolution: "bundler"`/`"node16"`; the root import works on
  classic `"node"` too (top-level `main`/`module`/`types` are kept as a fallback).

### TypeScript configs

- `tsconfig.json` — editor/dev config, `noEmit`, includes **`src` + `playground`** (so the demo is
  type-checked and ambient `*.css` decls resolve there).
- `tsconfig.build.json` — emit-only, **`src`** alone (playground never ships in the public types).
- `src/css-modules.d.ts` declares both `*.module.css` (typed class map) and bare `*.css`
  (side-effect imports).

---

## 11. Testing

- **Stack:** Vitest + React Testing Library + `@testing-library/jest-dom` + jsdom. All dev-only —
  nothing ships in the package.
- **Run:** `npm test` (one-shot) or `npm run test:watch`.
- **Config:** `vitest.config.ts` — jsdom env, `globals: true`, setup in `vitest.setup.ts` (jest-dom
  matchers + RTL `cleanup`), and CSS Modules `classNameStrategy: 'non-scoped'` so `styles.contained`
  resolves to `"contained"` and class assertions stay readable.
- **Location:** co-located `*.test.ts(x)` next to the source file. Test globs are excluded from
  `tsconfig.build.json`, so they never emit into `dist`.
- **What to test** (high value, low brittleness):
  - Pure logic — `applyTheme` (hex→rgb, 3-digit expansion, YIQ contrast, `CONTRAST_OVERRIDE`),
    `ConfigProvider` (dark-merge order, localStorage persistence, `useTheme` throwing outside a provider).
  - Behavior & a11y contracts — rendering, `loading`/`disabled`/`nonClickable` states, icon-swap,
    `aria-*` / `role`, ref forwarding, the `--tz-btn-rgb` inline var, variant/size class names.
- **What NOT to test:** computed colors / visual styling (jsdom doesn't apply CSS files), and HTML
  snapshots (brittle against the constant visual iteration this library goes through).
- **Gotchas:**
  - In-control loaders are `aria-hidden` (the control's `aria-busy` carries the a11y signal), so
    query them with `getByRole('status', { hidden: true })`.
  - `jsdom` is pinned to `25` — newer jsdom pulls an ESM-only transitive dep that Node `<20.19`
    can't `require()`. Bump it only together with the Node version.

## 12. Checklist — adding a new component

1. `src/components/<Name>/` with `<Name>.tsx`, `<Name>.module.css`, `index.ts`, and a
   `CLAUDE.md` (the component's full spec — same shape as the other folder docs; §7 is the index
   of them, so add a one-line entry there pointing to the new file).
2. Follow the anatomy in §6: `forwardRef`, props `extends Omit<…HTMLAttributes, 'color'>`,
   inline defaults, `clsx`, CSS-var inline style, `{...props}` last.
3. Reuse the standard prop vocabulary (§6) and the `sm/md/lg` size scale. For tintable controls,
   use the `--tz-btn-rgb` / `--tz-btn-on` pattern and the 4 standard variants.
4. Style only with `--tz-*` tokens; transitions use `var(--tz-duration)`.
5. Add English JSDoc to the component and every prop. Add accessibility attributes.
6. Export via the component `index.ts` — `export { <Name>, <Name> as default } from './<Name>'`
   (the `as default` keeps `sava-test/components/<Name>` working) — and add `export * from './<Name>'`
   to `src/components/index.ts`. No `src/entries/` change needed (it re-exports the whole barrel).
7. Add a section to `playground/main.tsx` exercising variants × colors × sizes × states. **If the
   component binds to a `<Form>` by `name`** (a form control like `TextField`/`Checkbox`/`Switch`/
   `RadioGroup`), also add a bound field for it to the playground **Form** section (`sections/Form/`)
   so the validation page exercises every form-capable control.
8. Add a co-located `<Name>.test.tsx` covering behavior + a11y contracts (see §11).
9. `npm run typecheck`, `npm test`, **and** `npm run lint:pkg` must pass. Verify visually in the
   playground (light **and** dark mode).
