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
    components.ts hooks.ts theme.ts icons.ts helpers.ts
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

Each brand color resolves to a **comma-separated RGB triplet** (not hex) so we can derive alpha shades
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

**Brand palette (11 colors)** — light-mode defaults:

| token        | hex       | role                                                              |
| ------------ | --------- | ----------------------------------------------------------------- |
| `primary`    | `#13404e` | primary brand / default text                                      |
| `secondary`  | `#ffffff` | surface (cards, inputs, dropdowns)                                |
| `background` | `#ffffff` | page canvas — separate from surface                               |
| `surface`    | `#f5f7fa` | the shell canvas — `RootLayout`'s soft floating-layout background |
| `dark`       | `#033b44` | dark brand shade                                                  |
| `medium`     | `#056472` | mid brand shade                                                   |
| `light`      | `#039aa1` | light brand shade                                                 |
| `success`    | `#00a854` | semantic — success                                                |
| `error`      | `#f04134` | semantic — error/danger                                           |
| `info`       | `#039aa1` | semantic — info                                                   |
| `warning`    | `#ffbf00` | semantic — warning                                                |

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
(dark text on the white canvas). These are **recomputed per mode** by `applyTheme()` — see §4.

### 3.2 Semantic colors

Just two thin aliases derived from brand tokens, so they flip automatically when the palette is
swapped per mode. `--tz-color-surface` is the **shell canvas**: `RootLayout` uses a **floating layout**
where the soft `--tz-color-surface` sits behind everything, and the **sidebar card** (a rounded
`--tz-color-secondary` panel with a border + `--tz-shadow-xs`) plus the page's `PageLayout` (flat
`--tz-color-background`) float on it — both white in light mode — so the workspace reads as elevated
above the canvas (see the Layout §). Cards, inputs and dropdowns also use `--tz-color-secondary`. So
the surface stack is **surface (canvas) → background / secondary (the floating cards)**:

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
`document.documentElement`) from a `ThemePalette` (a `{ name: hex }` map of the 10 brand colors):

For each color it sets:

- `--tz-color-<name>-rgb` — the hex converted to an `r, g, b` triplet.
- `--tz-color-<name>-contrast` — a readable text color for solid fills, via:
  1. **`CONTRAST_OVERRIDE`** map for hand-tuned colors:
     - `secondary` → `rgb(var(--tz-color-primary-rgb))` (near-white fill blends with the page, so
       the label uses the primary color and flips with the mode — no border needed).
     - `light` / `warning` → `#ffffff` (kept white by design).
  2. Otherwise **YIQ luminance**: `(r*299 + g*587 + b*114) / 1000 >= 150 ? '#04202b' : '#ffffff'`.

Because contrast is recomputed from the live triplet, a light `primary` in dark mode automatically
gets a dark label and stays readable.

### The `--tz-btn-rgb` / `--tz-btn-on` pattern

`Button` and `IconButton` set **two inline CSS vars** from the `color` prop, then the CSS derives
all 4 variants × 10 colors with `rgb()`/`rgba()` alpha math — no per-color CSS classes:

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
  light palette = the single source of truth for every brand color's default value) and
  `DEFAULT_DARK_COLORS` (the deltas that differ in dark: `primary #e6e8eb`, `secondary` & `background
#1F1F1E`, `surface #2a2a28`, plus a brighter `dark`/`medium`/`light` teal ramp). `theme.css` holds **no** color values — only the structure (solids, shades,
  contrast fallbacks) that references the `-rgb` triplets `applyTheme` writes onto `<html>`.
- **`Config`** (the `<ConfigProvider config={…}>` type): `{ theme?: ThemeConfig; locales?: LocaleConfig[]; keys?: KeysConfig; table?: TableConfig; header?: HeaderConfig }`
  — theme settings grouped under **`theme`** (`{ colors?: { light?: Partial<ThemePalette>; dark?: Partial<ThemePalette> }; mode?: 'light' | 'dark' }`),
  the configurable key/param **names** grouped under **`keys`**, the `<Table>` server-request query mapping
  under **`table`** (`{ query?: TableQueryConfig }` — see below), the **`RootLayout` header** app-wide
  under **`header`** (`HeaderConfig` — the shell top-bar `theme`/`fullscreen`/`search`/`breadcrumbs`/
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
- On mode change (in `useLayoutEffect`, before paint): calls `applyTheme(palette)`, sets
  `data-tz-theme` attr, sets CSS `color-scheme`, and persists to `localStorage['tz-theme-mode']`.
- **`useTheme()`** returns `{ mode, setMode, toggleMode }`. Throws if used outside a provider.
- Initial mode = stored value if present, else `config.mode`, else `'light'`.
- **No-JS note:** because the triplet values are injected by `applyTheme` (not declared in `theme.css`),
  colors require `ConfigProvider` to have mounted. It runs in `useLayoutEffect` (before first paint), so
  there's no flash in a normal CSR app; importing the CSS alone (no provider) yields no brand colors.

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
  /** Brand palette token that tints the control. Defaults to `medium`. */
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
| `color`        | `ThemeColor`                                | `'medium'`    | brand token; drives `--tz-btn-rgb`. Text/`Typography` default stays `primary` (via `--tz-color-text`).                              |
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

All components are exported from the package root. Sizes are always `sm | md | lg`.

### Button

`variant` (`contained` default) · `color` · `size` · `loading` · `fullWidth` · `rounded` ·
`disabled` · `startIcon` · `endIcon`. Heights from `--tz-control-height-*`; horizontal padding
`--tz-space-sm`; font size `sm 12 / md 14 / lg 16`. `border: 1px solid transparent` on the base so
height is identical across variants. Label wrapped in `.label`; while `loading` the loader replaces
the `startIcon` if present, otherwise it **trails the label at the end (right)** — so a plain button
(no icons) shows the spinner on the right. The text stays visible. `startIcon`/`endIcon` are
**auto-sized to the button's `size`** (the icon child is cloned to match, unless it sets its own
`size`).

### IconButton

Square (width = height = `--tz-control-height-*`). Same `variant`/`color`/`size` system as Button,
plus `loading`, `rounded` (→ circle), `disabled`, and `nonClickable`. Pass an `<Icon />` as the
child; it's **auto-sized to the button's `size`** (cloned to match unless it sets its own `size`), and
while `loading` it's swapped for the `Loader`. **Requires `aria-label`** (no visible text).

### Icon

`name: IconName` (required) · `color?: ThemeColor` · `size` (`sm` 16 / `md` 18 / `lg` 22px).
Renders an inline SVG from the generated registry; `fill: currentColor` so it follows text color
unless a `color` token is set. `aria-hidden`, `focusable={false}`.

### Loader

`size` (matches Icon: 16/20/24px) · `color?: ThemeColor`. Circular CSS spinner; border uses
`currentColor` so it inherits text color. `role="status"`, `aria-label="Loading"`. Animation
`tz-loader-spin 0.6s linear infinite`.

### Typography

`variant` (`h1 h2 h3 h4 subtitle body bodySmall caption uppercase`, default `body`) ·
`as?: ElementType` (override the tag, keep the styling) · `color?: ThemeColor | 'text' | 'muted'`
(`muted` = `--tz-color-primary-shade600`, the soft secondary-text color; omit to inherit) · `align` ·
`truncate`. Default element per variant (`h1→h1 … body→p … caption/uppercase→
span`). Headings `h1–h4` are bold; everything else is `--tz-font-weight-regular`. No default
margins.

### TextField

A labeled text input. `label` · `size` · `error` + `helperText` (red border/ring + helper in the
error color) · `required` (asterisk) · `fullWidth` (**default `true`**) · `disabled` · `adornment` + `adornmentPosition`
(`left` default / `right`) · `onAdornmentClick` (makes an **icon** adornment a clickable `IconButton`;
needs `adornmentLabel` for its `aria-label`, default `"Field action"`; ignored for string adornments).
The `adornment` is type-driven: a **string/number** renders as a muted text prefix/suffix
(e.g. `"https://"`, `"$"`, `"kg"`) that reads into the input; any other **node** renders as an icon
inside an `IconButton` (`variant="text"`) — clickable when `onAdornmentClick` is set, otherwise
`nonClickable` + `aria-hidden` (decorative). The icon box fills the control's inner height as a flush
square (CSS overrides the `IconButton` size via `align-self: stretch` + `aspect-ratio: 1`), so the
icon's inset is identical on top, bottom and its outer side; the `<input>` drops its padding on whichever
side the adornment occupies. Passing **`type="password"`** auto-adds a show/hide reveal toggle
(`Eye`/`EyeSlash`) in the right adornment slot — it flips the input between `password`/`text` and
overrides the `adornment` props for that field (no separate `isPassword` prop; the standard `type`
drives it). Input-level constraints:
`regex` (allowed-input filter — a change whose value fails the pattern is rejected, e.g. `/^\d*$/`)
and `mask` (`9` digit · `a` letter · `*` alphanumeric · other chars literal, e.g. `"(999) 999-9999"`).
Works controlled (`value`+`onChange`) or uncontrolled (`defaultValue`); with a `mask`, `onChange`
emits the **masked** value. Structure: `.control` owns the border/background and shows the focus
ring via `:focus-within`; the bare `<input>` is transparent. The label and helper text render
through `Typography` (consistent type scale; helper color flips to `error`), while the label stays
a native `<label htmlFor>` for the input association (Typography's types don't expose `htmlFor`).
a11y: label `htmlFor`, `aria-invalid` while `error`, `aria-describedby` → helper. TextField is purely
presentational on its own, but inside a `<Form>` a **`name`** prop auto-binds it to the form
(value/onChange/onBlur/error/helperText) via context — explicit props still win. The validation engine
is `useForm` (see the Form section).

### MultilineTextField

The **textarea sibling of `TextField`** — same chrome and behavior, but a `<textarea>` with a
**dynamic height**. It shares TextField's label/helper/error/`required`/`fullWidth`/`disabled`/`size`
(`sm/md/lg` → font size; height is dynamic, not fixed) and `<Form>` binding by **`name`** (form value
is a `string`, like TextField). The textarea **auto-grows** with its content from **`minRows`** (default
`3`, the starting + smallest height) up to **`maxRows`** (default `6`; pass `Infinity` for unbounded) —
past it the field caps and scrolls (the auto-grow logic flips `overflow-y` to `auto`). It does **not**
carry the input-only extras (adornment /
password reveal / `mask` / `regex`). Resize is JS-driven (`resize: none`): on every value change a
`useLayoutEffect` collapses the height to `auto`, then sets it to `scrollHeight` clamped to `maxRows`
(line-height/padding read from `getComputedStyle`); it also re-runs on window resize (re-wrap). The
forwarded ref + an internal ref are merged so the field can measure itself. Controlled (`value` +
`onChange`) or uncontrolled (`defaultValue`). Own CSS module (mirrors `TextField.module.css`, minus the
adornment rules; the `.control` has no fixed height and `align-items` defaults so the textarea fills).

### RichTextEditor

A **WYSIWYG rich text editor** built on **Lexical** (an **optional peer** — `lexical` + the `@lexical/*`
React packages, all `external`/never bundled, like `zod`/`dayjs`). **Value is an HTML string** — controlled
(`value` + `onChange(html)`) or uncontrolled (`defaultValue`); inside a `<Form>` a **`name`** prop binds the
HTML value (read raw `form.values[name]`, written via `setValue`; touched/error from `field()`, like
`Select`/`NumberField`) — and the **`name` is mirrored onto the editable `contenteditable` node** (via a
ref+effect) so the form's **scroll-to-error** can find **and focus** the editor (it queries `[name="…"]`;
the RTE has no native input, so without this the field would be invisible to scroll-to-error). Shares the
field-family chrome (`label` · `size` · `error` + `helperText` ·
`required` · `disabled` · `placeholder`) + a token-bordered `.control` with a `:focus-within` ring.
**Toolbar is built from the library's own primitives** (not a borrowed editor UI), left-to-right:
`IconButton`s for undo/redo, a **font-size `Dropdown`** (10–20px; the editor's default for the current
`size` — sm 12 / md 14 / lg 16 — shows active when the selection has no explicit size; via
`$patchStyleText` → inline `font-size`), a **block-type `Dropdown`** (Paragraph / Heading 1–3),
**bold/italic/underline** (the format toggles soft-`filled` while active), standalone toggle buttons for
**Bullet list** / **Numbered list** (the custom `ListBullet`/`ListNumber` icons) and **Quote**,
**text-alignment** (left / center / right, via `FORMAT_ELEMENT_COMMAND` → exported as inline
`text-align` style), a **text-color** control (a brush button whose corner triangle shows the current
color; opens the shared **`ColorPickerPanel`** in a `FloatingPanel`, applied to the selection via
`$patchStyleText` → inline `color` style, read back via `$getSelectionStyleValueForProperty`), a
**link** toggle, an **image** `Dropdown` (Upload / By URL), and a **video** button. The **link** /
**image-by-URL** / **video** actions collect their URL through a shared **`Modal`** (a `TextField` +
Cancel/Confirm — the footer Submit drives the body `<form>` across the modal's portal; the link dialog
prefills the current link's URL), **not `window.prompt`**; the Lexical command runs on the editor's
retained selection when the modal confirms. The toolbar controls are compact (smaller box + icon than the standard sizes —
box 22/26/30px, icon 12/14/16px by editor `size`). Content
is styled entirely with `--tz-*` tokens via a Lexical `theme` mapping node types → CSS-module classes
(headings/quote/lists/check-list/link/inline formats/media). **Markdown shortcuts** while typing (`# `,
`- `, `> `, `1. `, `* *`, …) via the default transformers **minus** the fenced-code-block one (it needs
`CodeNode`, out of v1 scope). **Media:** **images** insert by URL **or** upload — upload embeds the file as
a base64 `data:` URL by default (no backend), or, if **`onImageUpload(file) => Promise<string>`** is
given, uploads through it and inserts the returned URL; **video** is **URL-embed only** (a `VideoNode`
that normalizes YouTube/Vimeo links to a responsive `<iframe>` embed and renders direct media files as
`<video controls>` — no upload). Custom `ImageNode` / `VideoNode` (`DecoratorNode`s) serialize to clean
`<img>` / `<iframe>`/`<video>` and parse back on paste/load. **HTML value hygiene:** the exported HTML is
**class-stripped** (`cleanExportedHtml`) so the value is portable markup (`<h2>` not
`<h2 class="_h2_ab12">`); re-import keys off tag names, so it round-trips. A **blank editor emits `''`**
(not Lexical's `<p><br></p>`) via `$isEditorEmpty`, so a cleared field reads as empty and a `required`
rule fires. Two important Lexical gotchas
baked in: the change listener serializes via **`editor.read`** (not `editorState.read`) so the active
editor is bound for `$generateHtmlFromNodes` (else it throws "no active editor"), and the controlled
value↔editor sync guards a feedback loop via a `lastHtml` ref (re-sync only when the incoming value isn't
our own last emit). a11y: the editable region is a `role="textbox"` `ContentEditable` with the
`aria-label`; the toolbar is `role="toolbar"`. **Note:** interactive editing (typing, toolbar commands)
relies on trusted browser events, so it's verified in a real browser, not jsdom/automated harnesses (the
tests cover render/structure/a11y/options + the pure `toVideoEmbedSrc` URL normalization). Own CSS module.
_Code blocks and tables are out of v1 scope; video upload is the natural next iteration._

### FileUploader

A **file field that collects files for the consumer to upload on save — it never uploads itself** (the
product rule). **Value model — `FileUploaderItem = { file?: File; source?: string; sortIndex: number }`:**
a freshly **picked** file carries its binary in `file` (`source: ''`); an **already-uploaded** one (a
backend response — edit mode) carries only its `source` URL and **no `file`**. `sortIndex` is kept in
sync with the visual order on every change. An optional **`altText`** holds alt text edited per card through
the `allowAltText` edit-button → modal — **per-locale** by default (`Record<localeCode, string>`), or a
single **`string`** with `localizedAltText={false}` (see below). **`FileUploaderValue`** is one item (or
`null`) in single mode, an **array** when `multiple`. Built on
four **optional peers** (all `external`/never bundled, like
`lexical`): **`react-dropzone`** (click-to-browse + OS drag-drop), **`@dnd-kit`** (`core` / `sortable` /
`utilities` — drag + keyboard reorder), **`@formkit/auto-animate`** (card add / remove / shift), and
**`react-image-crop`** (the per-item crop editor — its CSS is **bundled into the lib's stylesheet**, so no
extra consumer import; the JS stays external).

Shares **TextField's field chrome** — it imports `TextField.module.css` for the label / required /
helper / error styling (the `Slider`/`NumberField` precedent) — so `label` · `required` · `error` +
`helperText` · `fullWidth` (**default `true`**) behave like the rest of the field family. A soft
**dropzone** bar (compact, horizontal, dashed `medium` border, `DocumentUpload` icon, the
`"Choose a file or drag & drop it here"` prompt) sits above a **responsive grid of image cards** — each
**≥200px wide and stretching to fill the row** (`repeat(auto-fit, minmax(min(100%, 200px), 1fr))`, so a row
reaches the right edge and wraps once another 200px won't fit), a fixed **200px tall**. The dropzone shows while `multiple` (or, in single mode, until a file is
picked — `showDropzone = multiple || items.length === 0`); a static `hint` inside it spells out the
constraints (`"Up to 5 files · Max 5 MB each"`). Each card shows a **preview** — an image renders as an
`<img>`, a **video** as a first-frame **`<video>`** thumbnail (no controls) with a centered **`PlayCircle`
badge** so it reads as a video (`isVideoItem` — File by MIME, source by extension / `data:video`), and any
non-media / failed load falls back to a centered `Document` icon — with **two scrim overlays**: a **top**
one holding the **name** (middle-truncated as `name….ext` so the extension always stays visible) + a
**meta** line (`formatBytes(size)` for a File, `"Uploaded"` for a source, or the error note) on the left and
the **remove** (`Close`) button pinned **top-right**; and a **bottom** one holding the action buttons —
**crop** (`Crop`), **alt text** (`Text`), **download** (`DocumentDownload`) on the left, and a **view**
(`Eye`) button pinned **bottom-right**. The crop + alt-text buttons are gated by `allowAltText` (on by
default — pass `allowAltText={false}` to hide both) **and shown only for image items** (`isImageItem` — a
video / PDF / doc has nothing to crop or describe; those keep just download + preview + remove); the **view**
button (`allowPreview`, default on) shows for **image + video** items and opens a **fullscreen lightbox**
(the internal **`FileUploaderPreview`**, built on the shared **`Overlay`** like `Modal` — a `<body>`-portaled
dark backdrop with the image / a `<video controls>` centered; scroll-locked, fades in, closes on
backdrop-click / Escape / the × button, with a darker `dim={0.85}` scrim since media reads over black). The
scrims + white text are **literal black/white** (the image behind doesn't flip with the theme — the same
justified exception the `Modal` backdrop makes).

Props: **`multiple`** (`false` — value becomes an array) · **`allowDrop`** (`true` — OS drag-drop; `false`
= click-to-browse only) · **`allowReorder`** (`true` — drag + keyboard reorder, only meaningful with
`multiple`) · **`allowDownload`** (`true` — the per-card download button) · **`allowPreview`** (`true` —
the per-card **view** (Eye) button → fullscreen lightbox; image + video items only) · **`allowAltText`** (`true` —
a per-card **edit** button → modal for the item's `altText`; pass `false` to hide it; see the alt-text note below) ·
**`altTextLocales`** (the locales for that editor — defaults to `useLocales()`; override like
`<TranslatedFields locales>`) · **`localizedAltText`** (`true` — set `false` for a single-`string` `altText`,
one plain input, no locales) · **`allowDuplicates`** (`false` — by default a re-picked file matching an
existing item is skipped; see the dedup note below) · **`disabled`** (`false` — dims to `0.6` and inerts
everything: the dropzone is `react-dropzone`-disabled, and edit / remove / download / reorder drop out) ·
**`accept`** (react-dropzone's `{ MIME: ext[] }` map —
restricts the picker + rejects non-matching picks/drops, e.g. `{ 'image/*': [] }`) · **`maxFiles`** (cap,
`multiple` only — extra picks are dropped) · **`maxFileSize`** (bytes `number`, or a string like `"5MB"` /
`"500KB"` — **passed to react-dropzone as `maxSize`**, so an over-limit pick is **rejected** (not added);
a file supplied via `value`/`defaultValue` that exceeds it is still rendered but flagged in an error state,
red ring + `"Exceeds … limit"`) · **`itemInsertLocation`** (`'start'` / `'end'`, default `'end'` — where a
new pick lands). **Two feedback channels for a failed pick.** A **hard rejection — wrong type (`accept`)
or over `maxFileSize`** — never enters the value and fires a **`toast.error`** (so a `<Toaster>` — mounted
by `RootLayout` by default — must be present to see it; imported from `../Toast/toastStore`). The **soft
notices** — hit the `maxFiles` cap, or a skipped duplicate — stay in the inline helper slot **below the
cards** and **auto-dismiss** after 4s (the file is valid, just not added). **Duplicate picks are
de-duplicated by default** (in `multiple` mode): a pick matching an already-present item by content — a
File keyed by **name + size + last-modified** (`fileKey`), a source by its URL (`itemKey`) — is skipped
(intra-batch dupes too), since the same OS file re-picked is a **new `File` object** a reference/`WeakMap`
check would miss; pass **`allowDuplicates`** to let identical files stack (single mode always replaces, so
it can't stack).

**Edit modals — crop + alt text (`allowAltText`).** Each card has **two** buttons opening **separate**
modals (one internal **`FileUploaderEditDialog`** with a `mode` prop): the **crop** button (`Edit2`) → a
crop modal (`size="lg"`); the **alt-text** button (`Text`) → an alt-text modal (`size="sm"`). **Crop** (via
**`react-image-crop`**): the image with a draggable selection rectangle ("Drag to select the area to keep"),
the selection's **native pixel size shown live** (`W × H px`) — or the image's **original size** before a
selection is drawn. The crop is kept in **native coords** (converted on every drag) so Save doesn't depend
on the displayed size. The crop image is capped to `max-height: calc(100dvh - 360px)` (on the `ReactCrop`
root, since react-image-crop drives the `<img>` via `max-height: inherit`) so a tall image fits the screen. On **Save** the crop is exported by
a **canvas at the image's native resolution** — `drawImage` copies the selected region **1:1**
(`imageSmoothingEnabled = false`, no resample → **no quality loss, no resize**) and `toBlob(mimeType, 1)`
(the original MIME; **PNG ⇒ lossless**) yields a new `File` that **replaces the item's `file`** (`source`
cleared — a cropped source item becomes a fresh pick that uploads on save). A tainted (cross-origin,
no-CORS) canvas makes `toBlob` throw → caught, shown as a dialog error (File-object-URL picks +
same-origin/`data:` sources always work). Both the crop **and** alt-text buttons appear only for **image**
items (`isImageItem` — File by MIME, source by extension / `data:image`); a video / PDF / doc shows neither.
**Alt text**
(the other modal): **per-locale by default** (`localizedAltText` defaults `true`) — **one `TextField` per
content locale, stacked** (labelled by locale; no tabs), locales resolving **`altTextLocales` prop →
`useLocales()`** (a single untabbed field if none), and the value is a `Record<localeCode, string>`. With
**`localizedAltText={false}`** it's a **single plain `TextField`** (no locales) and the value is a
**`string`**. A working **draft** is seeded from the item's `altText` on open; **Save** trims (localized:
prunes empty locales, an all-empty result clears `altText` to `undefined`; non-localized: empty → `undefined`)
and commits via the normal `commit` path (so `altText` rides through `reindex` / controlled value / the
`<Form>`); the edited item is tracked by its **stable id** (not its index), so an external value change
while the modal is open can't retarget the save; **Cancel**/dismiss discards. Because the model gains an
`altText` key, a `<Form>` schema must include it to keep it through parse (zod strips unknown keys) — e.g.
`altText: z.record(z.string()).optional()` (localized), `altText: z.string().optional()` (non-localized), or
a `z.union([...])` to accept either.

**Reorder** is whole-card drag (no grip — the tile _is_ the handle) via `@dnd-kit` (`PointerSensor`
distance 5 + `KeyboardSensor`: Space to pick up, Arrows to move); auto-animate is **paused during a drag**
(dnd-kit owns the drag visuals) and rAF-re-enabled after. A **genuinely new** card drops in via a CSS
`.entering` animation **JS-gated** by an `enteredIds` set, so a reorder (which re-inserts the moved node)
never restarts the entrance on shifted cards; auto-animate handles remove (lift + fade) + remain (slide to
fill). Stable per-item ids (a `WeakMap<File>` for picks, `s:<url>` for sources) keep a card's identity +
focus across reorders. Object URLs for File previews are revoked when the File leaves the value / on
unmount.

Controlled (`value` + `onChange` — fires the item/array on every add / remove / reorder) or uncontrolled
(`defaultValue`). Binds to a surrounding `<Form>` by **`name`**, reading the **raw** `form.values[name]`
(not `field().value`, which would coerce the object/array) and writing via `setValue` — validate the array
with e.g. `z.array(fileItemSchema).min(1, 'Add at least one image')`, where `fileItemSchema` refines that
`file || source` is present; error/touched come from `field()` and the root carries `name` +
`tabIndex={-1}` so the form's **scroll-to-error** can focus it. a11y: root `aria-invalid` +
`aria-describedby` → the helper (`role="status"` `aria-live="polite"`); the remove / edit / download buttons
are `aria-label`led; the fallback icon is `aria-hidden`; touched fires on blur outside the whole widget —
but **not** when focus only leaves because the alt-text `Modal` or the **native file picker** opened over it
(opening the picker would otherwise flash a `required` error before a pick); the picker instead marks touched
on **cancel** (react-dropzone's `onFileDialogCancel` — opened and chose nothing), via `onFileDialogOpen` +
a one-shot suppress flag.
**Note:** the OS-drag drop + dnd-kit drag + the **crop drag** (`react-image-crop`'s pointer drag) + the
canvas crop export rely on trusted browser events / canvas (verified in a real browser, not jsdom), but the
**click-to-browse picker path works in jsdom** (`react-dropzone`'s input change; auto-animate is a no-op
there since it gates on `ResizeObserver`; `react-image-crop` renders fine — it only reads
`getBoundingClientRect`), so the tests cover the pure helpers (`toBytes` / `formatBytes` / `splitName` /
`labelOf` / `fileKey` / `itemKey`), render / structure / a11y, the **dedup behavior** (re-picking the same
file is skipped + notice; `allowDuplicates` stacks), the **rejection toasts** (an oversized / wrong-type
pick is rejected + `toast.error`, asserted via a spy), the **edit modals** (`allowAltText` → separate crop /
alt-text modals; the crop modal's stage renders + per-locale / single `altText` saved/pruned), the
**media kind** (image → `<img>`, video → `<video>` + Eye, PDF/doc → no crop/alt/preview) + the **preview
lightbox** (Eye → a `role="dialog"` overlay with the media, Escape-closes), and the `<Form>` binding. Own CSS
module (plus internal `FileUploaderEditDialog.module.css` + `FileUploaderPreview.module.css`). _A
progress/upload mode and an inline (row) layout are natural next iterations._

### TagsField

A tags / token input sharing TextField's chrome (label/helper/error/`required`/`fullWidth`/`disabled`/
`size`/`<Form>` binding by **`name`** for validation). Existing tags render as **`Chip`s** (with delete
buttons) wrapping inside the `.control`, followed by an inline `<input>` and a flush-right **add**
`IconButton`. **Committing a tag:** press **Enter**, click the add button, or type the **`separator`**
key (single-char separators only); **removing:** a chip's delete button, or **Backspace** on the empty
input pops the last; a typed-but-uncommitted value is also committed on **blur**. The **`separator`**
(default `,`) splits **pasted** text too — pasting `"react;typescript"` with `separator=";"` adds both.
**Dual value shape:** `value`/`defaultValue` accept **either a `string[]` or a `separator`-joined
`string`**, and `onChange` **mirrors the input's shape** (emits a `string` when the value is a string,
else a `string[]`) — so it binds to a `<Form>` whose schema is `z.array(z.string())` **or** `z.string()`.
Duplicates are ignored unless `allowDuplicates`; `color` (default `primary`) tints the chips (chip
`size` tracks the field `size` 1:1). The input carries `name` so the form's **scroll-to-error** focuses it. The add
button uses `onMouseDown`-preventDefault (clicking it doesn't blur → no double-add), disables when the
input is empty, and is the same flush-square icon treatment as a TextField adornment (`align-self:
stretch` + `height: auto` so it conforms to the control instead of imposing its native height). A
single-row control matches the field family's `--tz-control-height-*` (and grows as tags wrap); the
left inset matches TextField (`--tz-space-sm`) while empty (so the placeholder lines up) and tightens
to `--tz-space-xs` once at least one chip is present. Own CSS module (mirrors `TextField.module.css`;
the `.control` wraps and grows with the tags). Controlled (`value` + `onChange`) or uncontrolled
(`defaultValue`).

### NumberField

A numeric input with `+`/`−` stepper buttons. Shares **TextField's field chrome** — it imports
`TextField.module.css` for the label/control/helper/size/error styling (single source of truth) and
adds its own stepper. `label` · `size` · `error` + `helperText` · `required` · `fullWidth`
(**default `true`**) · `disabled` · `value`/`defaultValue` (`number | null`, `null` = empty) · `onChange(value)` (emits a
`number` or `null`) · `min` (**default `0`** — pass a negative `min` to allow negatives) · `max` ·
`step` (default `1`) · `hideStepper` · `thousandSeparator` (**live** grouped display, e.g. `"."` →
`32.345.345`, regrouped on every keystroke with the caret preserved — the value stays a plain
`number`; best for integers, `"."` precludes decimals). The `+`/`−` buttons add/subtract `step`,
clamp to `min`/`max`,
and disable at the matching bound; the value also clamps on blur. Internally it keeps a display-string
state so in-progress input (`-`, `1.`) survives while `onChange`/the form still receive the parsed
number. Like TextField, a **`name`** prop auto-binds it to a surrounding `<Form>` — but the form value
is a real **`number`** (validate with `z.number()`), read/written via `values`/`setValue` while
touched/error come from `field()`. The steppers are **`filled`** `IconButton`s sized via the shared
`.control .iconButton` rule (flush square, stretched to the control height, `scale(0.84)`), with
`onMouseDown`-preventDefault so clicking them doesn't pull the focus ring (the `−` button gets a tiny
negative `margin-right` to tighten the gap). NumberField has no CSS of its own; it reuses
`TextField.module.css` entirely.

### OtpField

A **one-time-passcode input** — a row of single-character boxes for verification codes. **`length`**
(default `4`) sets the box count; **`type`** (`'numeric'` default · `'alphabetic'` · `'alphanumeric'`)
restricts the accepted characters (via a per-type regex) **and** the mobile keyboard (`inputMode`
`numeric` vs `text`). **Interaction:** typing a char advances to the next box (boxes **select-on-focus**,
so typing in a filled box replaces), **Backspace** clears + steps back, **Arrows** navigate, **Delete**
clears the box, and **paste / iOS SMS autofill** distribute the whole code across the boxes (a full code
landing in one box — the autofill case — is detected and spread, since a multi-char change can't be a
single keystroke). Autofill is wired via **`autocomplete="one-time-code"`** on the **first** box (the
others `off`). **Value is the concatenated string** — controlled (`value` + `onChange`) or uncontrolled
(`defaultValue`); **`onComplete(value)`** fires once every box is filled. Shares the field-family chrome
(imports `TextField.module.css` for `label` · `error` + `helperText` · `required` · `disabled`) + its
own module for the boxes; **`size`** (`sm`/`md`/`lg` — square box 40/48/56px + char font, one-off
literals) and **`color`** (default `primary`, the shared **`--tz-btn-rgb`** pattern → caret + focus ring

- active box), plus **`placeholder`** (a char in empty boxes) and **`autoFocus`**. Binds to a `<Form>` by
  **`name`** — form value is the code `string` (validate with e.g. `z.string().length(4)` or a
  `type`-matching regex); error/touched come from `field()`, and the **`name` rides the first box only** so
  the form's **scroll-to-error** can focus it (touched fires on blur outside the whole widget). a11y:
  `role="group"` (labelled by `label`, `aria-invalid` while error) with per-box `aria-label`s
  (`"Digit N of M"`). Own CSS module (+ TextField's chrome). _A masked/password mode and a `separator`
  (e.g. a dash between groups) are natural next iterations._

### Slider

A range slider — drag (or arrow-key / Home / End) a thumb along the track to pick a number, **snapping
to `step`**. Built on a **native `<input type="range">`**, so keyboard, dragging, step/min/max, and a11y
(`role="slider"`) come for free; the track / fill / thumb are styled via `--tz-*` tokens and tinted by
`color` (default `medium`, via the **`--tz-btn-rgb`** pattern). The filled portion is a hard-stop
gradient driven by an inline **`--tz-slider-fill`** percent (WebKit `::-webkit-slider-runnable-track`;
Firefox uses native `::-moz-range-progress`). Props: `min` (0) · `max` (100) · `step` (1) · `size`
(`sm`/`md`/`lg` → track + thumb px via `--sl-track`/`--sl-thumb`, one-off literals) · `valueLabel`
(show the current value at the end of the label row — `true` default, or a `(value) => node` formatter,
or `false`) · `marks` (`{ value, label? }[]` labeled ticks under the track) · `fullWidth` (default
`true`) · `error` + `helperText` + `required`. Reuses **`TextField.module.css`** for the label / helper /
required / error chrome (its own module styles only the track / thumb / value / marks). Controlled
(`value` + `onChange`) or uncontrolled (`defaultValue`, defaults to `min`); like the other fields, a
**`name`** binds it to a surrounding `<Form>` — the form value is a real **`number`** (validate with
`z.number().min(…)`), read/written via `values`/`setValue` while touched/error come from `field()`; the
input carries `name` for **scroll-to-error**. Pass **`range`** for a **two-thumb span** — the value
becomes a `[start, end]` tuple (validate with `z.tuple([z.number(), z.number()])`), rendered as two
overlaid transparent-track `<input type="range">`s over a custom rail + fill (the fill spans between the
thumbs; thumbs catch pointer events via `pointer-events: auto` and can't cross each other). Own CSS
module. _Custom labeled tooltips on the thumb during drag are a natural next iteration._

### ColorPicker

A color field with a **beautiful popover picker**, with **opacity (alpha)** and **`rgb()`/`rgba()`**
support. The trigger reuses TextField-style chrome
(`label` · `size` · `error` + `helperText` · `required` · `fullWidth` default `true` · `disabled`):
the color value (or `placeholder`) on the left + a right-aligned color **swatch**; clicking the
**whole control** toggles the popover (no chevron). The popover is **portaled to `<body>` and behaves
exactly like `Dropdown`**: opens below, flips above only when it would overflow, **locks page scroll**
(`useLockBodyScroll`) while open, re-positions on scroll/resize, closes on outside-pointerdown/`Escape`,
and **enters with the same opacity + translate animation** (keyed off `data-open`/`data-side` + a
rAF-driven `visible` flag). It holds a **saturation/value square**, a **hue slider** and an **alpha
(opacity) slider** (all pointer-draggable), a **color input** (accepts `#rgb`/`#rrggbb`/`#rrggbbaa` hex
or `rgb()`/`rgba()`), and a grid of quick-pick **`swatches`** — led by a **"no color"** chip (a
diagonal-stripe swatch that clears the field). The curated default palette is overridable; the selected
swatch shows just a **tick** (no ring, no hover scale). **Value is a CSS color `string`: `#rrggbb` when
fully opaque, `rgba(r, g, b, a)` when translucent**; controlled (`value` + `onChange(color)`) or
uncontrolled (`defaultValue`). Working state is kept as **HSV + alpha** so hue survives dragging at
grey/black (hex would lose it) — re-derived from the value only on external changes. Binds to a
surrounding `<Form>` by **`name`** (form value = the color string; validate with e.g.
`z.string().regex(/^#[0-9a-f]{6}$/i, 'Pick a color')`, or a looser pattern if you allow `rgba()`); the
trigger carries `name` so the form's **scroll-to-error** can focus it. Color math (`hex⇄rgb⇄hsv`,
`normalizeHex`, plus `parseColor`/`formatColor` for hex/rgb/rgba + alpha) lives in `colorUtils.ts`.
Token-styled except the **spectrum gradients** (the SV square + hue rail) and the **alpha
checkerboard** — both use literal colors (an unavoidable exception); the dynamic hue is fed via an
inline `--cp-hue` var, the alpha fill via `--cp-fill` / `--cp-rgb`. Own CSS module. The picking surface
itself (SV square + hue/alpha sliders + input + swatches) is an internal **`ColorPickerPanel`**
(`{ value, onChange, swatches, clearable }`, controlled by one color string) that `ColorPicker` wraps in
its `FloatingPanel` — and the **`RichTextEditor`** text-color control reuses the same panel (import via
`../ColorPicker/ColorPickerPanel`; not in the public surface). `clearable` (default `true`) shows the
leading "no color" swatch; the RTE passes `clearable={false}` and a non-empty default so the first
swatch (the brand color) shows selected when the text has no explicit color.

### Select

A single-select dropdown field. The trigger reuses TextField chrome (`label` · `size` · `error` +
`helperText` · `required` · `fullWidth` default `true` · `disabled`) and is a `role="combobox"` `<div>`
(so it can hold the clear button + chevron) showing the selected option's label/icon (or
`placeholder`, default `"Select…"`) + an `ArrowDown4` chevron that rotates while open. Clicking it opens
a popover that **behaves exactly like `Dropdown`** — portaled to `<body>`, opens below (flips above
only on overflow), **matches the trigger width**, locks page scroll, re-positions on scroll/resize,
closes on outside-pointerdown/`Escape`/select, and enters with the shared opacity + translate animation
(`data-open`/`data-side` + rAF `visible`) — **all via the shared internal `<FloatingPanel>` component**
(see below). The listbox padding
(`--tz-space-xs`) matches Dropdown's panel inset. Options are
data-driven (**`options: { value, label, disabled?, icon? }[]`**) rendered as **`ListItem`s** (with
`role="option"`, `tabIndex={-1}`) inside a `role="listbox"` **`List`**; the chosen option shows a
`selected` tint + a trailing `TickCircle` (drop just the tick with **`showSelectedTick={false}`** — the
tint stays; used by `Table`'s compact rows-per-page picker), disabled options are inert. **Keyboard:** Arrow up/down
(skipping disabled), Home/End, Enter/Space to select, Escape to close, and **type-ahead** (buffer with
a 500ms reset) when not searchable; the focused element carries `aria-activedescendant` →
the highlighted option (a `.active` row gets the same light hover tint as a selected row).
**`searchable`** adds a
sticky filter `<input>` (substring match on `label`) that the list scrolls under, with
`searchPlaceholder` + `noOptionsText` (default `"No options"`; pass a **`(query) => node`** to vary the
empty message by the search text — e.g. a "Type to search" hint vs a "No results" message). For
**server-side search**, pass
**`onSearchChange(query)`** — it fires on each keystroke and **disables the built-in local filter** (the
consumer owns `options` for the current query), and **`loading`** shows a centered `Loader` +
`loadingText` (default `"Loading…"`) in the popover. **`clearable`** (on by default) adds a ×
(`CloseCircle`) in the trigger that resets to `''` (`MultiSelect` clears the whole array). Controlled (`value` + `onChange(value)`) or uncontrolled
(`defaultValue`); binds to a surrounding `<Form>` by **`name`** (value = the option's `value`; validate
with e.g. `z.string().min(1, 'Required')`). The trigger carries `name` so the form's
**scroll-to-error** focuses it, and marks the field touched on blur **only when focus leaves the whole
widget** (not when it moves into the portaled popover). Own CSS module.

### MultiSelect

The **`string[]` sibling of `Select`** (a separate component — kept separate so each has clean,
non-union value types; chosen over a `multiple` prop). Shares all of Select's popover plumbing via the
same **`useFloatingPanel`** hook and the `SelectOption` type. The trigger shows the chosen options as
deletable **`Chip`s** (wrapping + growing like `TagsField`; `color` (default `primary`) tints them, chip
`size` tracks the field) or the `placeholder`; clicking it opens the same listbox. Selecting an option **toggles** it and
**keeps the popover open**; the list is `role="listbox"` **`aria-multiselectable`**, selected options
show a `selected` tint + trailing `TickCircle`. **Keyboard:** Arrow/Home/End, Enter/Space **toggle**
(no close), **Backspace** pops the last chip, Escape closes, type-ahead. `searchable` + `clearable`
(clears all) + `noOptionsText` + **`onSearchChange`/`loading`** (server-side search) — all like Select.
The left inset tightens (`--tz-space-xs`) once chips show
(like `TagsField`). **Value is always a `string[]`**; controlled (`value` + `onChange(values)`) or
uncontrolled (`defaultValue`); binds to a `<Form>` by **`name`** reading the **raw** `form.values[name]`
(not `field().value`, which would String-coerce the array) and writing a real array — validate with
e.g. `z.array(z.string()).min(1, 'Pick at least one')`. Own CSS module (mirrors Select's popover +
TagsField's chip-trigger).

### DatePicker

A date field with a **typed, masked input + a calendar popover** (powered by **`dayjs`**, an optional
peer; `dateUtils.ts` extends the `utc` + `customParseFormat` plugins). Shares TextField chrome
(`label` · `size` · `error` + `helperText` · `required` · `fullWidth` default `true` · `disabled`):
the `<input>` accepts typing in **`format`** (default `'DD/MM/YYYY'`, masked numerically via
`maskFromFormat`) and parses **strictly**; a flush calendar `IconButton` (the TextField-adornment
treatment) toggles a popover, and a × clears (`clearable`, **on by default**). The popover (portaled,
flips, scroll-locked, animated — shared **`useFloatingPanel`**) holds the **`Calendar`** primitive,
which has **three views**: a `role="grid"` **day** view with full keyboard nav (**Arrows** move days,
**Home/End** the week, **PageUp/Down** the month, **Shift+PageUp/Down** the year, **Enter/Space**
select) whose header has **circle prev/next arrows** (`ArrowCircleLeft`/`ArrowCircleRight`) plus the
**month and year labels as separate buttons**, and a **month** + **year** picker view behind each
label (arrow-key roving, `Enter` selects). The **day cells are circles** (`border-radius: 50%`);
selected month/year cells are filled pills. **Picking a year advances to the month view; picking a
month returns to the day view** (the month/year pickers have **no nav arrows** — the year view lists
every year in range, ±100 unless `min`/`max` bound it, and **scrolls internally**). **All calendar math
runs in UTC** (so a date never drifts with the viewer's timezone); "today" is the viewer's local
calendar date anchored to UTC. The popover is a **focus-trapped** `role="dialog"` (`aria-modal`;
Tab/Shift+Tab cycle within it so focus can't strand on the scroll-locked page behind); the month/year
views are plain `role="group"`s of buttons (`aria-current` marks the selection) — only the day view is
a `role="grid"`. **Value contract — `valueFormat`** (dayjs tokens, default the ISO datetime
`'YYYY-MM-DDTHH:mm:ss'`), decoupled from the displayed `format`: **incoming `value`/`defaultValue` are
parsed leniently** (the `valueFormat` first, then any ISO-8601 string — so a richer **backend datetime**
like `'2026-06-10T09:35:49.6134342'` is accepted, dayjs capping the fractional seconds at ms), and
**`onChange` emits in exactly `valueFormat` at the start of the UTC day** (a date picker carries no
time-of-day, so the default emits e.g. `'2026-06-10T00:00:00'`; pass `'YYYY-MM-DD'` for a plain date).
A commit is gated on the **calendar day actually changing**, so focusing/blurring or re-picking the
same day never rewrites an unchanged value's time to midnight. Supports **`min`/`max`** (ISO),
**`disabledDate`** (`(iso) => boolean`), and
**`weekStartsOn`** (0–6, default `1` = Monday). Disabled days stay focusable for keyboard nav but
aren't selectable. Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`); binds to a
`<Form>` by **`name`** (value = the `valueFormat` string; the input carries `name` for
**scroll-to-error**; touched fires on blur outside the widget). Own CSS module (TextField chrome +
calendar). The masked typed input assumes a **numeric** `format` (month-name formats display fine but
type freeform; the `A`/`a` meridiem token is handled — see `DateTimePicker`). _The remaining date
components — `DateRangePicker`, `DateTimeRangePicker` — will follow, reusing `Calendar` + `dateUtils`._

### DateTimePicker

The **date + time sibling of `DatePicker`** — a typed masked input plus a popover that splits date and
time into **two tabs** (built with the library's own **`Tabs`**, `queryKey={null}` so the internal
Date/Time tabs never touch the page URL): a **Date** tab holding
the reused **`Calendar`** and a **Time** tab holding scrollable **time columns** (`TimeColumns`: hour /
minute / optional second, + an AM/PM toggle in 12-hour mode). It reuses DatePicker's field chrome
(`DatePicker.module.css` imported for control/input/clear/sizes/helper + the calendar) and adds its own
module for the tabbed popover layout (a fixed calendar-width popover so it never resizes when switching
to the narrower Time tab) and a **Done** footer button. The popover opens on the **Date** tab and the
`Tabs` is given **`autoFocus`** so the active tab takes focus on open (the `Calendar`'s own `autoFocus`
is **not** used here — a tab switch must not steal focus into the content). Shares the field
API (`label` · `size` · `error` + `helperText` · `required` · `fullWidth` default `true` · `disabled` ·
`min`/`max` · `disabledDate` · `weekStartsOn` · `clearable` · `<Form>` binding by **`name`**) and the
**`valueFormat`** value contract (default UTC ISO datetime `'YYYY-MM-DDTHH:mm:ss[Z]'` — the `Z` marks
the value as UTC — or no-`Z` `'YYYY-MM-DDTHH:mm:ss'` when `utc={false}`; lenient input parse) —
but unlike `DatePicker` the time is **meaningful**, so `onChange` emits the **chosen instant**
(not start-of-day). **Timezone — "store UTC, show local":** the `value`/`onChange` string is always
**UTC**, but the field **displays & edits in the viewer's local timezone** (e.g. a backend
`'2026-06-10T09:35:00'` shows as `13:35` in UTC+4, and editing back emits UTC). This is done by a thin
boundary conversion (`utcToLocalWall` on parse, `localWallToUtc` on emit) — the calendar/time machinery
still runs on a UTC-mode dayjs holding the local wall-clock, so nothing downstream changed. Opt out with
**`utc={false}`** — then there's **no timezone conversion** at all: the field shows and emits the value's
exact wall-clock (what you pick is what's sent). (`DatePicker`
stays UTC/tz-agnostic — a calendar date has no time to localize; for a plain `'2026-06-10'` value use
`valueFormat='YYYY-MM-DD'`.) Time props: **`hour12`** (1–12 + AM/PM vs 24-hour, default `false`; drives the
default `format`), **`minuteStep`** (minutes-column increment, default `1`), **`showSeconds`** (the
seconds column + `:ss`; **default `true`** — pass `false` to drop seconds). The display `format` defaults
to `'DD/MM/YYYY HH:mm:ss'` (→ `hh:mm:ss A` for `hour12`, `:ss` dropped when `showSeconds` is `false`);
the masked typed input supports the meridiem via `maskFromFormat`'s
`A`→`AA`/`a`→`aa` letter slots. **Picking a day keeps the current time and picking a time keeps the day** (each
column pick preserves the other parts), and — unlike DatePicker — selecting a day **does not close** the
popover; it closes on outside-pointerdown / `Escape` / the **Done** button. Typed-input commits are
gated on a change at the input's precision (driven by the `format` — second when it has `:ss`, else minute) so a no-op focus/blur
never zeroes finer time. `min`/`max` bound the calendar at **day** level (time-of-day isn't range-gated
in v1). The time columns are roving `role="listbox"`s (Up/Down/Home/End/Enter, auto-scroll the selected
into view). `TimeColumns` is internal (not exported). Own CSS module (`DateTimePicker.module.css`).

### TimePicker

The **time-only sibling** — `DateTimePicker` minus the calendar. A typed masked time input + a popover
holding just the reused **`TimeColumns`** (hour / minute / optional second + AM/PM in 12-hour mode) and a
**Done** footer. Reuses DatePicker's field chrome (`DatePicker.module.css`: control/input/clear/sizes/
helper/popover) and has a tiny own module (`TimePicker.module.css`: just the footer — the popover hugs
its time columns, no width constraint). The trigger icon is **`Clock`** (vs DatePicker/DateTimePicker's
`Calendar3`). Shares the
field API (`label` · `size` · `error` + `helperText` · `required` · `fullWidth` default `true` ·
`disabled` · `clearable` · `<Form>` binding by **`name`**) and the time props **`hour12`** /
**`minuteStep`** / **`showSeconds`** (default `true`). **Value contract — `valueFormat`** (dayjs tokens,
default the UTC time-of-day `'HH:mm:ss[Z]'`, or `'HH:mm:ss'` when `utc={false}`): incoming values are parsed leniently by **`parseTime`** (the `valueFormat`
first, then a numeric time anchored to a fixed date so `'09:35:49.6134342'` is accepted ms-capped, then
any ISO-8601 datetime whose time is used), and `onChange` emits the chosen time in that format. Like
`DateTimePicker` it follows **"store UTC, show local"** (value UTC, displayed/edited local;
`utcToLocalWall`/`localWallToUtc` at the boundary; the bare-time parse anchors to _today_ so the offset
is current) — and the same **`utc={false}`** opt-out disables the conversion (emit the picked wall-clock
as-is). **Only the time-of-day matters — the date part is
ignored** (all comparisons are time-component only via a `sameTime` helper, so a no-op focus/blur or
re-pick never rewrites finer time). The display `format` defaults to `'HH:mm:ss'` (→ `hh:mm:ss A` for
`hour12`, `:ss` dropped when `showSeconds` is `false`).
Picking keeps the popover open (closes on outside-pointerdown / `Escape` / **Done**); the hours column
**autoFocuses** on open (there's no calendar to take focus). No `min`/`max` in v1. All math is **UTC**.
Controlled or uncontrolled; binds to a `<Form>` by **`name`** (value = the time string).

### Checkbox

A labeled checkbox. The native `<input type="checkbox">` is **visually hidden** (sr-only) but stays
focusable + announced; a styled `.box` shows the state, and the tick is a **CSS checkmark** (rotated
corner — no icon dependency). `label` · `color` (checked fill, default `medium`) · `size` (box +
label) · `error` · `required` · `disabled` · `checked`/`defaultChecked` ·
`onChange(checked)` (emits a `boolean`). Uses the `--tz-btn-rgb`/`--tz-btn-on` pattern: checked →
`background: rgb(var(--tz-btn-rgb))` with a contrast-colored tick; `:focus-visible` ring; `error`
**reddens the box only (no helper text)** + sets `aria-invalid`. Like the other fields, a **`name`**
prop binds it to a surrounding `<Form>` — its form value is a **`boolean`** (validate with e.g.
`z.boolean().refine((v) => v, 'Required')` for a must-accept box); the form's error reddens the box,
but its message isn't rendered. Own CSS module (`Checkbox.module.css`).

### ChoiceCard / ChoiceCardGroup

A group of **selectable cards** — rich checkboxes/radios with an `icon`, `label` and `description`
(role pickers, plan choices, permission sets); one folder, two exports (like `Radio`/`RadioGroup`).
**`ChoiceCardGroup`** is the usual entry: **`exclusive`** picks single-selection (**radio** semantics —
`value` is a `string | null`, the cards are **native radios** so Arrow keys rove between them and
re-clicking the selected card keeps it selected — unlike `ToggleButtonGroup`'s deselect) vs multiple
(**checkbox** semantics — `value` is a `string[]`); **default `false` (multiple)**. Controlled
(`value` + `onChange`, emitting the `exclusive` shape) or uncontrolled (`defaultValue`); cards come
via the data-driven **`options`** (`{ value, label?, description?, icon? (IconName|node), disabled? }[]`)
or as `<ChoiceCard>` children (shared state via context). The cards lay out on a **responsive grid** —
`repeat(auto-fill, minmax(min(100%, <minCardWidth>px), 1fr))`, **`minCardWidth`** default `160` — so
they wrap on narrow screens. Group chrome mirrors `RadioGroup`: `label` (+ `required` asterisk) ·
`size` (`sm`/`md`/`lg` — padding, icon circle 32/40/48px, indicator 16/18/20px; one-off literals) ·
`color` (default `primary`, the shared **`--tz-btn-rgb` / `--tz-btn-on`** pattern) · `disabled` ·
`error` (reddens the card borders + indicator — **no message text**, like `RadioGroup`). **Anatomy of
a card** (`ChoiceCard`): a `<label>` card wrapping a **visually-hidden native input**
(radio in `exclusive` groups, else checkbox — Space toggles, focus ring via `:has(:focus-visible)`),
a **top-right indicator that mirrors the semantics** — in an `exclusive` group a **radio-style hollow
ring + scaled-in inner dot** (the `Radio` look), else a circle that fills with the brand color + a
scaled-in **CSS tick** (the `Checkbox` corner trick, no icon dep) — an **icon circle** (soft neutral `primary-shade100` fill that
**fills solid brand + contrast icon while selected** — the polish flip), and the
`label`/`description`. **`align`** (`'left' | 'center'`, on the group or per card — the card's wins)
picks the alignment of the **same stacked layout** (icon above label above description): `center`
centers it, `left` anchors it to the left edge (an icon-less card's title keeps clear of the
indicator). The **smart default** needs no prop — a card **with** an icon centers, an **icon-less**
card left-aligns. Selected card:
brand border + faint `0.04` wash + a soft **halo ring** (`box-shadow: 0 0 0 2px rgba(btn, .12)`). `ChoiceCard` also works **standalone** as a single fancy
checkbox (`checked` + `onChange(checked)` — e.g. an agree-to-terms card). Binds to a `<Form>` by
**`name`** (on the **group**) — form value `string` when `exclusive` (`z.string().min(1)`), else
`string[]` (`z.array(z.string()).min(1)`); the form's error reddens the cards. a11y:
`role="radiogroup"`/`"group"` + `aria-invalid` on the group; the inputs stay focusable + announced.
`ChoiceCard` ships named **and** default, `ChoiceCardGroup` named. Own CSS module. _An
`orientation`/list (row) card layout and a `badge`/price slot are natural next iterations._

### Radio / RadioGroup

A radio button + its group (one folder, two exports — like `Avatar`/`AvatarGroup`). **`Radio`** — the
native `<input type="radio">` is **visually hidden** (sr-only) but stays focusable + announced; a
styled `.circle` + scaled-in `.dot` shows the state (filled from `--tz-btn-rgb`). `value` (**required**)
· `label` · `color` · `size` (`sm`/`md`/`lg`) · `error` · `disabled`. It's built to live inside a
**`RadioGroup`**, which hands down the shared `name`, the current selection, and
`size`/`color`/`disabled`/`error` via context; it also works standalone (`checked` + `onChange(checked)`).
**`RadioGroup`** enforces single-selection and is the usual entry point: `value`/`defaultValue`
(`string`) · `onChange(value)` · `name` · `options` (data-driven `{ value, label?, disabled? }[]`, an
alternative to passing `<Radio>` children) · `orientation` (`vertical` default · `horizontal`) ·
`label` · `error` (reddens the radio rings — **no message text**, like `Checkbox`) · `required`
(asterisk) · `size` · `color` (default `medium`) · `disabled`. `role="radiogroup"` with `aria-invalid`;
the label renders through `Typography`. Binds to a
surrounding `<Form>` by **`name`** — its form value is a **`string`** (validate with e.g.
`z.string().min(1)`), read/written via `values`/`setValue`. Uses the `--tz-btn-rgb` pattern; own CSS
module. `Radio` ships named **and** default, `RadioGroup` named.

### Switch

A toggle switch — the on/off sibling of `Checkbox`. The native `<input type="checkbox" role="switch">`
is **visually hidden** (sr-only) but focusable + announced; a styled `.track` + sliding `.thumb` show
the state — the track fills from `--tz-btn-rgb` when on and the thumb slides across (token-sized per
`size`). `label` · `color` (on fill, default `medium`) · `size` (`sm`/`md`/`lg` — track/thumb + label)
· `error` · `required` · `disabled` · `checked`/`defaultChecked` · `onChange(checked)` (emits a
`boolean`). `:focus-visible` ring; `error` **reddens the track ring only (no helper text)**, like
`Checkbox`. Binds to a surrounding `<Form>` by **`name`** — its form value is a **`boolean`**. Own CSS
module.

### ToggleButton / ToggleButtonGroup

A two-state button + its group — a **segmented control** (one folder, two exports, like `Radio`/
`RadioGroup`). **`ToggleButton`** is a `<button type="button">` that toggles selected/unselected:
`value` (its identity in a group) · `selected` + `onChange(selected, value)` (standalone) · `color`
(default `primary`) · `size` · `fullWidth` · `disabled`. Selected uses the soft **`filled` tint** of
`color` (the shared **`--tz-btn-rgb`** pattern); unselected is transparent with a token border;
`aria-pressed` carries the state. It reads a surrounding group via context (the group then owns
selection/size/color/disabled), or works standalone. **`ToggleButtonGroup`** is the usual entry point:
**`exclusive`** picks single-selection (`value` is a **`string | null`** — clicking the active button
deselects it, like MUI) vs multiple (`value` is a **`string[]`**); **default `false` (multiple)**.
Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`); supply buttons via the data-driven
**`options`** (`{ value, label?, icon? (IconName|node), disabled?, ariaLabel? }[]`) or as
`<ToggleButton>` children. `orientation` (`horizontal` default · `vertical`), `size`, `color`,
`disabled`, `fullWidth` (buttons share the width equally). The group is a flex container that
**collapses adjacent borders** (negative margin + outer-corner-only rounding) so the strip reads as one
joined control, raising the hovered/selected/focused button's `z-index` so its border shows. a11y:
`role="group"` on the container, `aria-pressed` per button (pass `ariaLabel` for icon-only buttons).
Both styles live in one `ToggleButton.module.css` (the group imports it so the joined-corner selectors
resolve). `ToggleButton` ships named **and** default, `ToggleButtonGroup` named. _A `<Form>` binding by
`name` (exclusive → `string` like `RadioGroup`, multiple → `string[]` like `MultiSelect`) is the
natural next iteration._

### SpeedDial / SpeedDialAction

A floating action button (FAB) that reveals related actions on hover / click — the lib's quick-action
surface (one folder, two exports). **`SpeedDial`** requires an **`ariaLabel`** (the FAB is icon-only) and
takes **`icon`** (default `Add` — a `+`) + an optional **`openIcon`**; with no `openIcon` the FAB icon
**rotates 45°** when open (`+` → `×`), else the two glyphs swap. **`direction`** (`up` default · `down` ·
`left` · `right`) fans the actions out; `color` (default `primary`) tints the FAB (a `contained`
`rounded` `IconButton`), `size` (`sm`/`md`/`lg`) sizes the FAB while actions render **one step smaller**.
**Opens on hover** (`openOnHover`, default `true`) **and click**; closes on **outside-pointerdown**,
**Escape** (refocusing the FAB), or selecting an action (`closeOnActionClick`, default `true`).
**`tooltipOpen`** shows every action's label **persistently** while the dial is open (no hover) — a
static label pill beside each (like MUI); per-action `<SpeedDialAction tooltipOpen>` overrides it.
Controlled (`open` + `onOpenChange`) or uncontrolled (`defaultOpen`). Supply actions via the data-driven
**`actions`** (`{ icon, label?, onClick?, disabled?, key? }[]`) or as **`<SpeedDialAction>`** children.
**`SpeedDialAction`** is a small `contained` `secondary` (surface) `rounded` `IconButton` with a
**`Tooltip`** `label` (also its `aria-label`); placement derives from the dial `direction` (left for
vertical, top for horizontal). Because the surface (`secondary`) matches the page background, the action
gets a hairline **`--tz-color-border`** (like `Card`/inputs) so the circle reads — `button.action`
outranks `IconButton`'s contained border. The actions sit in an **absolutely-positioned container** (a DOM child,
so it never shifts the FAB and hover treats it as inside) that animates open (opacity + per-action
`scale`); a padding **hover bridge** keeps FAB→action moves from closing it. a11y: the FAB carries
`aria-haspopup`/`aria-expanded`/`aria-controls`; actions are `aria-label`led buttons, tabbable only while
open (the container is `visibility: hidden` when closed). The ref points at the root — **position it
yourself** (e.g. `fixed` bottom-right) via `style`/`className`. `SpeedDial` ships named **and** default,
`SpeedDialAction` named. _Arrow-key roving between actions + an optional backdrop are natural next
iterations._

### ThemeToggle

Wraps `IconButton` (default `variant="outlined"`). Shows `Icon name="Sun"` in light mode, `"Moon"`
in dark; flips `mode` via `useTheme().toggleMode` on click. `role="switch"`, `aria-checked`,
`aria-label="Toggle color theme"`. Props = `Omit<IconButtonProps, 'children'>`, so `variant`,
`color`, `size` pass through.

### FullscreenToggle

Wraps `IconButton` (default `variant="outlined"`), mirroring `ThemeToggle`. Toggles the browser
**Fullscreen API** on click — `document.documentElement.requestFullscreen()` to maximize,
`document.exitFullscreen()` to restore — and flips its `Maximize3` icon 180° while fullscreen (so it
reads as "minimize"), keeping state in sync via the `fullscreenchange` event. **Renders nothing where
the Fullscreen API is unavailable** (e.g. iOS Safari on iPhone), so it auto-hides on devices that
can't go fullscreen. Both calls are `?.`-guarded (no-op where the
API is unavailable) and `.catch`-swallowed (a blocked request is ignored). `role="switch"`,
`aria-checked`, `aria-label="Toggle fullscreen"`. Props = `Omit<IconButtonProps, 'children'>`.

### Badge

A **wrapper** that pins a small count/dot to a child's corner — wrap a `Button`/`IconButton` (or any
node): `<Badge content={2}><IconButton…/></Badge>`. `content` (`number | string`) renders a count;
a `number` is capped to `${max}+` (`max` default `99`) and a numeric `0` is hidden unless `showZero`.
`dot` renders a plain indicator instead (decorative → `aria-hidden`); `content` wins over `dot`.
`color` (default `medium`) tints via the **`--tz-btn-rgb` / `--tz-btn-on`** pattern; `placement`
(`top-right` default · `top-left` · `bottom-right` · `bottom-left`) picks the corner. The badge has a
`box-shadow` ring in `--tz-color-background` so it reads as cut-out over the control. Own CSS module.

### Alert

A message banner — the inline feedback surface (info / success / warning / error). `variant`
(`contained` · `filled` **default** · `outlined` · `text`) and **`color`** (default `info`) tint it via
the shared **`--tz-btn-rgb` / `--tz-btn-on`** pattern: `filled` is a soft `0.1` wash with dark text + a
colored icon, `contained` is the solid fill with contrast (white) text + icon, `outlined` is the
`secondary` surface + a `0.5` color border, `text` is bare. A **semantic leading `icon` is auto-picked
per color** (`success → TickCircle`, `error → CloseCircle`, `warning → Warning`, `info → InfoCircle`;
other colors → `InfoCircle`) — override with **`icon`** (an `IconName` or node) or drop it with
**`icon={false}`**. The icon is the brand color on the light variants and inherits the contrast text on
`contained`. A trailing **`action`** slot (a `Button`, e.g. `UNDO`) sits before an optional **`onClose`**
× **`IconButton`** (`variant="text"`, `closeLabel` default `"Close"`) that the alert CSS shrinks below
the `sm` preset to a compact 24px box and re-tints — its × inherits the alert text color (dark on light
variants, contrast on `contained`) over a faint color wash (a literal white-alpha on `contained`, where a
brand tint wouldn't read; `.alert .close` outranks IconButton's own size/variant rules). `children` is the
message. `role="alert"`. The 24px close box / 14px × are one-off literal sizes. Own CSS module. _A `title`
line + auto-dismiss timer are natural next iterations._

### Toast / Toaster

Transient notifications via an **imperative API + a mount-once viewport** — modeled on `react-toastify`
but built in-house (no dependency), reusing **`Alert`** for every toast's visual. **`toast`** is a
module-singleton API (the same store-with-subscription pattern as `helpers/access.ts`), so it's callable
**from anywhere** — event handlers, async code, even outside React: **`toast(msg, opts)`** (neutral/info)
plus **`toast.success` / `.error` / `.warning` / `.info`** (each sets the `Alert` color + its semantic
icon), and **`toast.dismiss(id?)`** (one, or all). Each call returns an **id**; pass **`opts.id`** to
update an existing toast (or target a later dismiss). **`ToastOptions`**: `duration` (ms; **`Infinity`** =
sticky; overrides the Toaster default), `variant` (`Alert` variant, default `contained`), `icon`
(`IconName`/node/`false`), `action` (a trailing node, e.g. an `UNDO` button). **`<Toaster>`** is mounted
**once** near the app root — and **`RootLayout` mounts it for you by default** (configure via its
`toaster` prop, or `toaster={false}` to opt out), so most apps never mount it manually. It
`createPortal`s to `<body>` at **`--tz-z-toast`**, subscribes to the store
via **`useSyncExternalStore`**, and stacks each toast as an animated `Alert`. Props: **`position`**
(`bottom-right` default · the 6 corners/edges — sets the fixed anchor + slide direction; newest sits
nearest the anchored corner via `flex-direction`) and **`duration`** (default `4000`). Each toast
**auto-dismisses** after its duration (**paused on hover**, tracking the remaining time), enters/exits with
the shared opacity + translate animation (`data-open` + rAF `visible`), and closes via its `Alert`'s × or
the timer; closing flips the store record's `open` to `false` (drives the exit), then it's removed after
the animation. The viewport is `pointer-events: none` (clicks fall through the empty area; each toast
re-enables them) and `aria-live="polite"` with toasts as `role="status"`. Each toast gets a
`--tz-shadow-lg` to float. The `toast` API + `Toaster` ship from `sava-test/components/Toast` (and the
root); the store internals (`subscribeToasts`/`getToasts`/`closeToast`/`removeToast`/`ToastRecord`) stay
private. `ToastItem` is internal. Own CSS module. _A `toast.promise(...)` helper + a max-visible cap are
natural next iterations._

### Tooltip

A **wrapper** that shows a floating label on hover/focus of a single child element:
`<Tooltip content="Save"><IconButton…/></Tooltip>`. `content: ReactNode` (empty → renders just the
child); `placement` (`top` default · `bottom` · `left` · `right`) with a matching arrow. Opens on
`mouseenter`/`focus`, closes on `mouseleave`/`blur`/`Escape`; the child is cloned to get
`aria-describedby` while open, and the label is `role="tooltip"`. **`color`** (brand token, default
`primary`) sets the fill via the shared **`--tz-btn-rgb` / `--tz-btn-on`** pattern (the label uses the
color's contrast, the arrow inherits the fill), flipping with the theme; `--tz-z-tooltip`,
`--tz-shadow-md`, opacity/visibility fade over `--tz-duration`. Takes a single `ReactElement` child
(cloned for a11y). Own CSS module.

### Avatar / AvatarGroup

**Avatar** shows, in priority order: an image (`src` — falls back automatically on load error), an
`icon` (`IconName` or node), explicit `children` (e.g. initials `"D.S."`), initials derived from
`name` (`"David Savaneli"` → `"DS"`), else a default `User` icon. `size` (`sm` 32 · `md` 40 · `lg` 48),
`shape` (`circle` default · `square`), `color` (default `medium`, via `--tz-btn-rgb` / `--tz-btn-on`).
a11y: an image renders `<img alt>` (alt ← `alt`/`name`); a non-image avatar with a name gets
`role="img"` + `aria-label`. **AvatarGroup** overlaps `Avatar` children (negative margin + a
`--tz-color-background` ring) and collapses the overflow past `max` into a trailing `+N` avatar;
`size`/`color` normalize all of them (children are cloned to the group `size`). Both live in
`src/components/Avatar/` (one folder, two exports); `Avatar` ships named **and** default. Own CSS module.

### Divider

A separator. Plain: `<Divider />` (full-width 1px line) or `<Divider orientation="vertical" />` (an
upright rule that stretches inside a flex row). With `children` it becomes a labeled divider
(`line — title — line`) positioned by `align` (`left` · `center` default · `right`), built with flex +
`::before`/`::after` lines (the short side uses `--tz-space-md`). Line color `--tz-color-border`,
label `--tz-color-primary-shade600` / `font-size-sm` / medium. `role="separator"` (+ `aria-orientation` when
vertical); a label is ignored for vertical. Own CSS module.

### Card

A surface container with an optional header (`icon` + `title` + `subtitle` + `actions`), a body
(`children`), and a
`footer` for actions (solid top divider, right-aligned; `footerStart` pins content to the **left** of
the same row, so the row reads left-vs-right via `space-between`). A subtle **dashed** bottom divider
sets the header apart from the body while expanded. `collapsible` adds an `ArrowUp3` chevron `IconButton` that folds the body
**and** footer via a smooth `grid-template-rows: 1fr → 0fr` transition; while collapsed the header
**actions hide** (only the chevron stays) and the header divider fades out. Controlled (`collapsed` +
`onCollapsedChange`) or uncontrolled (`defaultCollapsed`). The fold wrapper (`.collapsibleInner`, a grid
item) carries **`min-width: 0`** as well as `min-height: 0` — so a wide, non-wrapping child (e.g. a `Table`
with its own horizontal scroll) shrinks and scrolls **inside the card** instead of forcing the card (and
the whole page) wider than the viewport. `icon` (an `IconName` or a node) renders in
a leading **filled, non-clickable `IconButton`** box (decorative → `aria-hidden`), tinted by `color`
(brand token, default `medium`). `subtitle` is a muted description line under the `title`; both `title`
and `subtitle` clamp to **two lines** then ellipsis (`-webkit-line-clamp`).
Surface + border + `--tz-radius-md` + `--tz-shadow-xs`. **`flat`** drops the shadow and swaps the
`secondary` surface for the page `--tz-color-background` (blends with the shell, no elevation) — used by
`PageLayout`, which is a flat Card. Header omitted entirely when there's no title/icon/actions/collapsible.
Own CSS module.

### EmptyState

The empty-state placeholder — drop it wherever a page / table / list / gallery has nothing to show (no
records yet, no search matches). A centered column: a muted glyph in a **soft neutral circle**
(`--tz-color-primary-shade200` fill + `-shade600` icon — deliberately neutral, not tinted by a semantic
color) + a **`title`** (default `"No Results Found"`) + an optional muted **`description`** + an **`action`** slot
(e.g. an "Add Item" / "Clear Filters" button). **`icon`** is an `IconName` (default `FolderOpen`), any node (pass
a tinted `<Icon>`/illustration), or **`false`** to hide it. **`size`** (`sm`/`md`/`lg`) scales the circle
(48 / 64 / 80px — one-off literals), the icon, the title font, and the vertical padding so it fills the
empty area; `children` renders extra content below the action. **`pattern`** is the polished
"hero" look — a **faded grid backdrop** (token `--tz-color-border` lines on a 40px cell, radial-masked
so it fades out toward the edges, never a hard box) + an **elevated icon puck** (a `secondary →
primary-shade100` gradient + `--tz-shadow-md`) — and is **on by default**; pass `pattern={false}` for the
flat, compact placeholder (e.g. a small inline / table empty state). Reuse it for empty data **and** empty filters/search, not just "no
records". `title` uses medium weight; the description caps its line length (`max-width: 42ch`) for
readability. Token-only (the grid cell + radial mask are decorative one-offs). Own CSS module. _A
compact inline (row) variant is a natural next iteration._

### Timeline / TimelineItem

A **vertical timeline** — events on a rail (order tracking, activity feeds, audit logs); one folder,
two exports (like `Accordion`/`AccordionItem`). Data-driven via **`items`**
(`TimelineEntry[]` = `{ label?, time?, content?, icon? (IconName|node), color? }[]`) or as
**`<TimelineItem>`** children (whose **`children`** is the body; `size`/`color` inherit via context).
**Anatomy of an entry:** a **node** on the rail — an entry **with** an `icon` gets a **soft tinted
circle** (`rgba(color, .12)` fill + the brand-colored icon), one **without** gets a small filled
**dot** (the compact activity-log look; same footprint, so the rail stays centered) — then a `label`
(medium weight), a muted **`time`** caption (the date line), and the **`content`** body (any node). A
lone label sits **level with the circle** (the min-height + centering trick from `ChoiceCard`); taller
bodies grow past it. Per-item **`color`** tints just that node (e.g. `success` for a delivered step —
semantic feeds read at a glance); the timeline's `color` (default `primary`) is the base. The **rail**
is a 1px `--tz-color-border` hairline between node centers that **hides itself after the last entry**
(`:last-child`). `size` (`sm`/`md`/`lg` — node 24/32/40px, dot 8/10/12px, one-off literals like
`Stepper`'s) scales nodes + type together. Display-only (no state, no `<Form>` binding). a11y: a
semantic `<ol>`/`<li>` list (name it with `aria-label`); nodes + rail are `aria-hidden`. The tint rides
a per-item inline **`--tl-rgb`** var (the `--tz-btn-rgb` idiom). `Timeline` ships named **and**
default, `TimelineItem` named. Own CSS module. _An `opposite`/two-column layout, a horizontal
orientation, and a collapsible "show more" tail are natural next iterations._

### CodeBlock

A syntax-highlighted code block with **VS Code colors** — built on **`shiki`** (an **optional peer**,
`>=1`, `external`/never bundled like `zod`/`dayjs`): the actual VS Code highlighting engine (TextMate
grammars) with its **`dark-plus`** theme. The block is **always dark**, in both app light/dark modes
(code reads best on a dark surface, and the deep background anchors it) — it does **not** flip with the
theme. Highlighting is **async + lazy**: the component `import('shiki')`s on first render (consumers who
never render a `CodeBlock` never load it) and shows the **plain code as a fallback** (on the same dark
surface) until it lands — or forever, if `shiki` isn't installed or the `language` is unknown (nothing
breaks). Props: **`code`** (required) · **`language`** (any shiki id — `'tsx'` default, `'json'`,
`'bash'`, …) · **`title`** (a filename header bar; the copy button moves into it) · **`copyable`**
(default `true` — a floating top-right `IconButton` that copies `code`, flips `Copy → CopySuccess`
for 1.6s, and carries a **`Tooltip`** whose text flips **`Copy code` → `Copied!`** on click — the
tooltip is already open from the hover/focus, so the label just updates; `placement="left"` keeps it
inside the block's `overflow: hidden`; the button is forced light via `--tz-btn-rgb: 255,255,255` over
the dark surface) ·
**`showLineNumbers`** (a muted CSS-counter gutter on shiki's `.line` spans) · **`maxHeight`** (px —
the code scrolls inside) · **`wrap`** (soft-wrap instead of horizontal scroll). The **whole block**
uses VS Code's **own dark colors** (`#1E1E1E` body / `#252526` header — a deliberate literal-color
exception, like the Modal scrim; the highlighted tokens are shiki's); only the outer border/radius is
`--tz-*`, and the mono font stack is a one-off literal (no mono token). The shiki output is injected
via `dangerouslySetInnerHTML` (trusted — shiki escapes the source). Tests mock `shiki` (deterministic;
the real engine is verified in a browser) and cover the fallback → highlight swap, the options passed,
the failure fallback, copy, title/wrap/line-number/maxHeight, and ref forwarding. Own CSS module. _A
light-theme opt-in, a `diff`/line-highlight mode and a `CodeBlock`-in-`Tabs` multi-file view are
natural next iterations._

### Accordion / AccordionItem

A set of collapsible panels (settings sections, FAQs, grouped forms) — one folder, two exports (like
`Radio`/`RadioGroup`). **`Accordion`** is the group: **`exclusive`** picks single-open (`value` is a
`string | null` — opening one closes the others) vs multi-open (`value` is a `string[]`); **default
`false` (multiple)**. Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`) — `onChange`
emits the `exclusive` shape (`string | null` vs `string[]`), the same value pattern as
`ToggleButtonGroup`. Supply panels via the data-driven **`items`** (`{ value, label, icon?, content,
disabled? }[]`) or as **`<AccordionItem>`** children; the group shares the open state, `size`
(`sm`/`md`/`lg`), and `disabled` via context. **`AccordionItem`** renders a header `<button>` (`label`

- optional `icon` + a clean chevron `ArrowDown4` that rotates 180° when open — muted closed, full text
  color when open) over a body that **folds with
  the shared `grid-template-rows: 0fr → 1fr` animation** (the same CSS-only technique as `Card`'s
  `collapsible` + the Sidebar nav fold — no JS height measurement). The panels are **separated cards**
  (each a bordered, rounded `secondary` surface with a gap between them, not a joined box); the **open
  panel lifts** with a darker hairline + `--tz-shadow-xs`, and **closed** headers get a subtle
  `--tz-color-primary-shade100` hover (an open panel's header stays clean over its body). The body text
  sizes with the accordion `size` (`--ac-font`). a11y: each header is a `<button>` with `aria-expanded` + `aria-controls` → its body
  `role="region"` (`aria-labelledby` back to the header). `AccordionItem` requires an `<Accordion>` ancestor
  (throws otherwise). `Accordion` ships named **and** default, `AccordionItem` named. Own CSS module. _A
  `<Form>` binding isn't relevant; keyboard arrow-roving between headers is a natural next iteration._

### Flex / Row / Col / Grid

Flexbox layout primitives — set layout via props instead of inline `style`. **`Flex`** is the engine
(`direction` `row`/`column` · `gap` · `align` `start/center/end/stretch/baseline` · `justify`
`start/center/end/between/around/evenly` · `wrap` · `padding` · `inline` · `grow`). **`Row`** = `Flex`
`direction="row"` + `align="center"`; **`Col`** = `Flex` `direction="column"`. `gap`/`padding` take a
**`Spacing`**: a `--tz-space-*` scale key (`"md"`), a raw px `number`, or any CSS string (e.g.
`"24px 8px"`) — scale keys resolve to tokens, numbers to px. Styled via **inline style** (the values
are fully dynamic — a deliberate exception to the CSS-Modules rule for this layout primitive); consumer
`style` merges last. All three `forwardRef` to the `<div>` and live in `src/components/Flex/`.
**`Grid`** (same folder) is the CSS-grid sibling: `cols` (fixed count → `repeat(n, minmax(0,1fr))`, or a
raw template string) or **`minItemWidth`** (responsive `repeat(auto-fit, minmax(<w>, 1fr))` — wraps to
one column when narrow; `fill` switches it to `auto-fill` so a few items keep their min width instead
of stretching to fill the row — e.g. a search-filtered gallery), plus `gap`/`align`/`padding`/`inline`.

### Chip

A compact pill tag/token. `variant` (`contained` · `filled` **default** · `outlined` · `text`),
`color` (default `primary`), `size` (`sm`/`md`/`lg`) — tinted via the shared `--tz-btn-rgb` /
`--tz-btn-on` pattern across the four variants. **Static by default**; `clickable` makes it interactive
(`role="button"`, pointer + hover, Enter/Space → click), `disabled` dims + inerts it. A leading
`startIcon` **or** `avatar` (the avatar is sized to the chip and flush-left via a scoped
`.<size> .avatar > *` rule), and a trailing delete button when `onDelete` is given (its click
`stopPropagation`s so it never fires the chip's `onClick`; `deleteIcon`/`deleteLabel` customize it,
default `CloseCircle` / `"Remove"`; **`deleteTabIndex`** takes the delete button out of the tab order
(pass `-1` when the chip lives inside a composite widget that owns focus, e.g. `MultiSelect`)). Root is
a `<div>` (not a `<button>`) so the delete `<button>` doesn't nest. Default variant is `filled` (a deliberate, chip-appropriate deviation from the
`contained` default in §6's vocab). Own CSS module.

### List / ListItem

**`ListItem`** is a flexible, reusable row: a leading `icon` (`IconName` → `<Icon>`, or any node such
as an `Avatar`), a label (`children`) with an optional muted `description`, and a `trailing` slot
(icon, `Badge`, shortcut text, chevron). `selected` highlights it (tinted via the `--tz-btn-rgb`
pattern from `color`, default `primary`) and sets `aria-current`; `clickable` makes it interactive — hover

- cursor, and when rendered as a **plain** element it also gets `role="button"` + `tabIndex` +
  Enter/Space → click (a native `a`/`button` or a router `Link` keeps its own semantics). `disabled` dims
- inerts it. `size` is `sm/md/lg` (min-height a touch under the control height; the label **wraps**
  onto multiple lines — `overflow-wrap: break-word` — while the description truncates to one line).
  Render as a link/button/component via **`as`** (anchor `href`/`target`/`rel`/`download` are typed).
  The hover/selected tint is **container-overridable**: `--tz-list-accent-rgb` (a triplet — falls back
  to the color-prop's `--tz-btn-rgb`) + `--tz-list-hover-alpha` / `--tz-list-selected-alpha` (default
  `0.06`), so a themed container (the dark `RootLayout` sidebar) turns it into a frosted white pill
  without touching the defaults.
  **`List`** is a thin semantic container — a vertical stack (inline-styled like `Flex`/`Grid`) with
  `gap` (default `2px`) / `padding` and `role="list"` (override `role` to `"menu"` for a dropdown). Its
  `size` provides a default for every contained `ListItem` (via context; an explicit item `size` wins).
  Designed to compose inside a dropdown menu, the sidebar, or a standalone styled list. Own CSS module;
  `List` ships named **and** default, `ListItem` named.

### Dropdown

A floating menu anchored to a `trigger` (a `Button`/`IconButton`/anything), composing `ListItem`s as
`children` inside a `role="menu"` `List`. The panel is **portaled to `document.body`** and positioned
by an inline (JS) algorithm with **collision handling**: it opens at `placement` (`bottom-start`
default · `bottom-end` · `top-start` · `top-end`), **flips** to the opposite vertical side when it
would overflow, clamps within the viewport (8px edge padding), caps its height + scrolls when too
tall, and **re-positions on `scroll`/`resize`** (plus a `ResizeObserver` on the panel & trigger). The
panel is `--tz-radius-sm`, `--tz-space-xs` padding, with spaced dividers; `size` (`sm`/`md`/`lg`, default
`md`) sets its **min-width** (150 / 190 / 220px) and the items' density (passed through to the inner
`List size`, which `ListItem`s inherit). **`minWidth`** (default `true`) toggles that size-based
min-width — pass `false` to let the menu size to its content (the items' density still tracks `size`).
While open it **locks page scroll** via `useLockBodyScroll`.
Opens on trigger click; closes on outside `pointerdown`, `Escape` (returns focus to the trigger), or
selecting an item (`closeOnSelect`, default `true`). The trigger is cloned to wire
`onClick` + `aria-haspopup="menu"`/`aria-expanded`/`aria-controls` and a merged `ref` (reads
`props.ref`, React 19). Keyboard: `ArrowDown`/`ArrowUp` rove between focusable items; the first item
is focused on open. Controlled (`open` + `onOpenChange`) or uncontrolled (`defaultOpen`);
`matchTriggerWidth` makes the menu ≥ the trigger width (select-like); `offset` (px, default `6`) is the
trigger gap; `disabled` blocks opening. Enter transition keyed off `data-open`/`data-side` (opacity +
a token-sized translate). Uses `react-dom` `createPortal` (peer dep). Own CSS module.

### Popover

An **anchored popover for arbitrary content** — the generic floating surface (filter panels, forms,
detail cards) that `Dropdown` is **not** (Dropdown is a `role="menu"` of items). Built on the shared
**`FloatingPanel`**: portaled to `<body>`, opens **below the `trigger`** (flips above on overflow),
**locks page scroll**, dismisses on **outside-pointerdown** / **Escape** (refocusing the trigger), and
enters with the shared opacity + translate animation. The **`trigger`** element is cloned to wire
`onClick` (toggle) + `aria-haspopup="dialog"`/`aria-expanded`/`aria-controls` and a merged `ref` (so a
`Badge`-wrapped `IconButton` works as the trigger). **`children`** is any content. **`align`** picks the
horizontal anchor: `start` (default — left edges align, grows right) or `end` (right edges align, grows
**left** — for a trigger near the right edge; vertical side still auto-flips). **`trapFocus`** cycles Tab
within (for form/filter popovers — also sets `aria-modal`); **`matchTriggerWidth`** sizes the panel ≥ the
trigger (select-like); **`width`** sets a fixed panel width; **`ariaLabel`** names the `role="dialog"` panel. Controlled (`open` + `onOpenChange`) or uncontrolled (`defaultOpen`); `disabled`
blocks opening. The panel is `--tz-radius-sm` / `--tz-shadow-md` (from `FloatingPanel`) with
`overflow: hidden` so full-width dividers/footers meet the rounded corners — compose a header (tinted
icon box + title) + a `Divider` + body + footer (e.g. Clear / Close / Filter `Button`s) inside, mirroring
`Card`/`Modal`. Own CSS module. _Placement variants (top/left/right) + an arrow are natural next iterations._

### Modal

A centered, backdrop-dimmed overlay dialog — the library's interruptive-task surface (confirmations,
quick forms, detail views). Controlled by **`open`** + **`onClose`** (no uncontrolled mode — a modal is
always app-driven). **`size`** is `sm` 360 / `md` 620 / `lg` 900 px (max-width caps; the box stays
responsive up to the cap) or **`fullScreen`** (fills the viewport, no radius/border). **`scrollBehavior`**
picks how over-tall content scrolls: **`outside`** (default — the whole dialog grows and the **overlay**
scrolls; the overlay flips to `flex-direction: column` so the dialog's `margin-block: auto` centers it
when it fits and top-aligns + scrolls when it doesn't) or **`inside`** (the body scrolls while the header

- footer stay pinned); `fullScreen` is unaffected by either. **`placement`** turns the dialog into a
  **full-height side drawer** (sheet): `center` (default) is the standard centered modal, while **`left`**
  / **`right`** pin it flush to that edge, fill the viewport height, and **slide in** from the edge
  (`translateX(±100%)` → `0`, overriding the centered translate/scale enter). A drawer takes its width
  from `size` (the `sm`/`md`/`lg` cap), drops its radius/border, and **always scrolls its body inside**
  (header + footer pinned — `placement` forces `scrollBehavior: inside`, so the `outside` rules never
  apply). **The header mirrors `Card`:** an optional leading
  **`icon`** (an `IconName` or node) in a **filled, non-clickable `IconButton` box** tinted by **`color`**
  (brand token, default `medium`), a **`title`** (md/bold, clamps to 2 lines) that labels the dialog via
  `aria-labelledby`, and a **`description`** (xs/muted subtitle, clamps to 2 lines); a **dashed** divider
  (like Card) sets the header apart when a body/footer follows. **`children`** is the body and **`footer`** holds right-aligned
  actions over a top divider (e.g. Cancel / Confirm). Dismissal is three-way and each toggle-able: a header
  **× close button** (the custom bare-`Close` icon; `showCloseButton`, default `true`), **backdrop click** (`closeOnBackdrop`,
  default `true`), and **Escape** (`closeOnEscape`, default `true`); `ariaLabel` names the dialog when
  there's no `title`. The close button is a **`filled` `IconButton`** (neutral `primary` tint, so it
  doesn't clash with an `error`/`warning` modal `color`). The header is omitted entirely when there's no
  title/description/icon/close button.
  **Behavior:** the portal, **page-scroll lock**, **scrim + fade-in**, **Escape swallow** and **backdrop
  dismiss** all come from the shared internal **`Overlay`** (see its section) — Modal passes it its
  `.overlay` class + `data-size`/`data-placement`/`data-scroll` attrs (its scroll/drawer layout selectors
  and the box's enter transform key off `.overlay[data-open]` on that shared scrim) and its own `onKeyDown`
  for the **Tab focus-trap** (which Overlay calls after its Escape handling). Modal itself keeps the
  dialog-specific bits: it **traps Tab focus** inside (Shift+Tab cycles; wraps at both ends) and **restores
  focus to the previously-focused element on close** (guarded by `isConnected` so an unmounted trigger
  doesn't strand focus), moves focus on open to **the first body field → else the first footer action (so
  confirm dialogs land on Cancel, not the ×) → else any control → else the dialog** (all with
  `preventScroll` so an `outside`-scroll modal doesn't jump to a below-fold control), and **enters with the
  shared opacity + translate animation** (keyed off the Overlay's `data-open` — same idiom as
  `Dropdown`/`FloatingPanel`, enter-only/unmount on close; `fullScreen` fades only). `role="dialog"` +
  `aria-modal` + `aria-describedby` (when `description`); `--tz-z-modal`, `--tz-shadow-xl`, `--tz-radius-md`.
  The **backdrop scrim is a literal `rgba(0,0,0,0.45)`** (an unavoidable exception — a brand-token tint
  would invert in dark mode; Overlay's default `dim`), Escape is always swallowed at the overlay (so it
  can't reach React-tree ancestors), and the **backdrop dismiss is gated on the pointer-down AND the click
  both landing on the overlay** (so a text-selection drag ending on the scrim doesn't close it). **A footer
  Submit button can drive a `<Form>` in the body via the `form` attribute**
  (`<Button type="submit" form="…">` + `<Form id="…">`) — it works **across the portal** since both live in
  the same document, and the form's **scroll-to-error** focuses the first invalid field inside the body.
  The forwarded ref points at the dialog element. Own CSS
  module. _Header `actions` (beside the close button) + an imperative/promise-based API are natural next
  iterations._

### RemoveDialog

A ready-made **delete confirmation** — a thin convenience wrapper over `Modal` for the ubiquitous
"Are you sure you want to delete?" prompt, so apps don't re-assemble it each time. It hardcodes the
destructive flavor: a centered `Trash` glyph in a soft **`error`**-shade circle above the prompt, and a
**`filled`** `error` **Delete** button (the soft tint) beside a `text` **Cancel** (built on `Modal size="sm"`, so it inherits the portal,
scroll-lock, focus-trap, and backdrop/Escape dismissal). Controlled by **`open`** + **`onClose`**;
**`onConfirm`** is the destructive action and **may be async** — while its promise is pending the Delete
button shows a loader and the dialog **locks** (close button hidden, backdrop/Escape disabled, Cancel
disabled), then it **auto-closes on success** (stays open on rejection so the user can retry — surface
the error yourself). Text is overridable: **`title`** (default `"Remove"`), **`message`** (default
`"Are you sure you want to delete?"`), **`confirmLabel`** (default `"Delete"`), **`cancelLabel`** (default
`"Cancel"`); an external **`loading`** is OR'd with the internal async state. Deliberately delete-only
(not a generic ConfirmDialog) for a minimal API; the forwarded ref points at the dialog element. Own CSS
module (just the centered icon-circle + prompt; the rest is `Modal` chrome). The 42px icon circle / 22px
glyph are one-off literal sizes (no token maps to the box — the same exception `Pagination` / the RTE
toolbar make).

### Tabs

A data-driven tab strip (+ optional panels). **`items`**: `{ value, label?, ariaLabel?, icon? (IconName|node),
disabled?, error?, dot?, badge?, content? }[]`. Controlled (`value` + `onChange(value)`) or uncontrolled
(`defaultValue`); the active value defaults to the URL query (when synced) then the first enabled tab.
**URL query sync — the headline feature, ON BY DEFAULT:** the active tab reads from / writes to the URL
query via the **native History API** (`URLSearchParams` + `history.replace`/`pushState`; no router
dependency, works standalone or inside TanStack Router), so a **refresh restores the tab**. The param
name resolves **`queryKey` prop → `<ConfigProvider config={{ keys: { tabQueryKey } }}>` →
`DEFAULT_TABS_QUERY_KEY` (`'tab'`)** (e.g. `?tab=general`); set **`queryKey`** to override per-strip, and
pass **`queryKey={null}`** to opt out (pure state, URL untouched). **Nested tabs auto-avoid collisions:**
a `Tabs` rendered inside another tab's panel detects its nesting depth (via an internal
`TabsDepthContext`) and defaults to **`keys.nestedTabQueryKey` (`'nestedTab'`)** instead, so the outer and
inner strips sync to different params (`?tab=…&nestedTab=…`) with zero consumer effort. **Multiple
**unrelated** strips on one page still need distinct keys** (3+ nesting levels too); the library's own
internal tab strips — `DateTimePicker`'s Date/Time tabs and `TranslatedFields`' locale tabs — pass
`queryKey={null}` so they never touch the page URL. The URL is
canonicalized on mount (replace). **Back-button behavior:** by **default tab changes `replaceState`** (no
history entry — Back leaves the page, doesn't step through tabs); pass **`pushHistory`** to `pushState`
instead (Back walks tabs). A `popstate` listener restores the tab from the query on Back/Forward. Per-tab: `icon`,
`disabled` (skipped by keyboard), `error`, and two Badge-style indicators — a **`badge`** count as a
small **inline pill trailing the label** (tinted via `--tz-btn-rgb`; caps at `99+`, so it never overlaps
the text) and a **`dot`** (a fixed **6px** circle pinned to the label's **top-right corner**, absolute,
anchored to the inner content). Two flavors of dot: a plain **`dot: true`** is the **tab color**
(`--tz-btn-rgb`, e.g. an unread/notification marker), while **`error: true`** shows a **red**
(`--tz-color-error`) dot — the validation/"needs-fixing" signal (e.g. an invalid `TranslatedFields`
locale) — and **does not tint the rest of the tab** (no red label; the active underline/pill stays the
brand color). `error` renders its red dot even without an explicit `dot`. When the tabs don't fit, the strip **scrolls horizontally** (`overflow-x:auto`,
scrollbar hidden; tabs keep their natural width) and the active tab is kept in view (`scrollIntoView`).
For an **icon-only** tab pass `ariaLabel` (falls back to `value`). `variant` (`underline` default · `pill`), `size` (`sm/md/lg`), `color` (brand
token, default `primary`, via the `--tz-btn-rgb` pattern), `orientation` (`horizontal` default ·
`vertical`), `fullWidth`, and **`autoFocus`** (focus the active tab on mount — e.g. when the strip lives
inside a popover that just opened, as `DateTimePicker` does). a11y: `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, roving tabindex with
Arrow/Home/End keyboard nav (automatic activation), `aria-controls`/`aria-labelledby` linking the active
panel, and an **`aria-label`** prop naming the tablist; the resolved active value is always clamped to a
present, enabled tab (no keyboard trap). Items with `content` render an active `role="tabpanel"`. Own CSS module.

### Pagination

A page navigator — previous/next arrows around a numbered range with `…` gaps (the classic
`1 … 4 5 6 … 10`). Built to be **reused across tables / lists / galleries**: drive it with **`count`**
(total pages, **required** — from a row count pass `Math.ceil(total / pageSize)`) + `page` / `onChange`.
Controlled (`page` + `onChange(page)`) or uncontrolled (`defaultPage`, default `1`); pages are **1-based**
and the active page is clamped to `[1, count]`. The visible items come from a **pure, tested
`paginationRange({ count, page, siblingCount, boundaryCount })`** helper (the MUI algorithm — boundary
pages + the current page's siblings + `start`/`end` ellipses; **internal**, not exported, like
`buildNavTree`). **`siblingCount`** (default `1`) sets pages on each side of the current; **`boundaryCount`**
(default `1`) the pages pinned at each edge. **`variant`** is `outlined` (default — every page/arrow is a
bordered box) or `text` (borderless); the **selected** page is always a solid brand fill via the shared
**`--tz-btn-rgb` / `--tz-btn-on`** pattern (`color`, default `medium`). `size` (`sm/md/lg` → compact box
**28/32/36px** — a literal-px exception like the RTE toolbar, no token maps to these — + font/icon on the
shared scale), **`rounded`** (circular page buttons), **`disabled`** (disables every
button). Arrows: prev/next always shown (toggle with **`hidePrevButton`** / **`hideNextButton`**), each
disabled at its bound; **`showFirstButton`** / **`showLastButton`** (default `false`) add jump-to-end
controls (the `Previous` / `Next` ⏮/⏭ skip icons). The icon set has **no plain right arrow**, so the
next/last glyphs reuse the left-facing `ArrowLeft` mirrored with `transform: scaleX(-1)` (`.flip`) for
symmetry. Ellipses render a non-interactive muted `…`. a11y: a `<nav>` with a configurable `aria-label`
(default `"Pagination"`) wrapping a `<ul>`; the current page carries **`aria-current="page"`** and each
button an `aria-label` (`"Go to page N"` / `"Go to previous page"` / …). Own CSS module. _A `<Form>`
binding isn't relevant (it's navigation, not a field); a `count`-from-`total`+`pageSize` convenience prop
is a natural next iteration (URL-sync via `keys.page` / `keys.size` now lives in `Table`)._

### Stepper

A step-progress indicator (checkout / wizard / multi-section form). Data-driven via **`steps`**
(`StepItem[]` = `{ label?, description?, optional?, icon?, completed?, error?, disabled?, content? }`) —
**controlled** (**`activeStep`**, **0-based**) or **uncontrolled** (**`defaultStep`**; falls back to the
URL, else the first enabled step): steps **before** the active read **completed** (filled circle + a
`Check` icon), the one **at** it is **active** (filled + a soft **halo ring** so it stands out from the
completed ones), and those **after** it are **upcoming** (muted outline + the 1-based number). A
controlled `activeStep` renders verbatim even past the last step (the "all completed" pattern). **URL
query sync — opt-in, off by default:** pass **`queryKey`** (`boolean | string` — the bare/`true` form
resolves the param name from `config.keys.stepQueryKey`, else `'step'`; a string is a custom name) and
the active step syncs to that query param, written **1-based** (`?step=2` = index 1) via the native
History API, so a refresh restores it (uncontrolled reads the URL on mount; controlled canonicalizes to
its value); restored values are gated by validity (in-range + not `disabled`), an out-of-range active
(e.g. `steps.length` = all done) leaves the URL alone, `popstate` restores on Back/Forward (firing
**`onStepChange(index)`** — wire it to your state in controlled mode), and synced step changes
**replace** by default (pass **`pushHistory`** to walk steps with Back). **With no `queryKey` the URL is
never touched** (unlike `Tabs` — a stepper is often a display-only progress indicator); two synced
steppers on one page need distinct keys. **Two layouts only:** `horizontal` (default) — equal-width columns with each label
**centered under its circle** and an absolute connector line spanning between circle centers — and
`vertical` — steps stacked along an absolute **rail** line down the circle column. Per-step
**`content`** renders while that step is active: **below the whole strip** (a `.panel`) in horizontal
mode, and **inline under the step** (indented past the circle, beside the rail) in vertical mode — the
wizard's page body. Per-step **`icon`** (an `IconName` or node) overrides the number; **`completed`**
forces the done look regardless of `activeStep`; **`error`** reddens the circle + label (a section that
failed validation); **`disabled`** dims it. When the steps don't fit, the **horizontal strip scrolls
sideways** (`overflow-x: auto`, scrollbar hidden — the `Tabs` idiom; each step has a `110px` min-width
so the strip overflows instead of squeezing) and the active step is **kept in view** by moving the
strip's **own `scrollLeft`** on `activeStep` change (not `scrollIntoView`, which also scrolls every
scrollable ancestor — the page would jump to the stepper on mount) — so it fits a phone as-is, with no
vertical collapse. **`onStepClick(index)`**
makes each step head a `<button>` (a `disabled` step never fires; an **uncontrolled** stepper also
selects the clicked step itself) — omit it for a display-only indicator. `size` (`sm`/`md`/`lg` — circle 24/30/38px, one-off literals like `Pagination`'s box px) and
`color` (brand token, default `primary`, via the shared **`--tz-btn-rgb` / `--tz-btn-on`** pattern, set
once on the root). The forwarded ref points at the **root `<div>`** (it wraps the `<ol>` list + the
horizontal content panel); the `<ol>` carries the `aria-label`, the active step `aria-current="step"`,
connectors are `aria-hidden`. Own CSS module. _A `<Form>` binding isn't relevant; a linear/non-linear
click guard and per-step optional-skip are natural next iterations._

### Table

A data table built on **TanStack Table** (`@tanstack/react-table` `>=8`, **headless** — an optional peer,
`external`/never bundled, like `zod`/`dayjs`). TanStack ships **zero markup/CSS** — it's the state engine
(sort / filter / pagination); the library renders its **own** `<table>` styled entirely with `--tz-*`
tokens and **composes the existing components**: **`TextField`** (search, `SearchNormal` adornment),
**`Select`** (rows-per-page), **`Pagination`** (footer nav), **`EmptyState`** (no rows), **`Loader`**
(loading overlay). **Column API — deliberately simple** (`TableColumn<T>`, hides TanStack): `{ key,
header, cell?, sortable?, width?, maxWidth?, wrap?, align?, pinned? }[]` — `key` is the field accessor +
column id + sort/search key; `cell?: (row, index) => ReactNode` for custom renders (a `Chip`, `Avatar`,
formatted date), else the `key` value stringified. An **empty cell** (a blank value, or a `cell` that
returns `null`/`''`/`false`) shows a muted **"—" placeholder** so it reads as "no value" — a real `0` is
kept (not treated as empty). Cells are **single-line by default** (`white-space:
nowrap` → the table scrolls horizontally instead of squeezing); opt a long-text column in with **`wrap`** —
content flows onto 2+ lines (the row grows, `overflow-wrap: break-word` breaks a long unbroken token) and it
caps at a readable **`280px`** on its own (the cell sits at that width via an inline `width`, so it doesn't
get starved by the unbounded single-line columns), so `wrap` alone is usually enough. **`maxWidth`** overrides that
cap (and also implies `wrap`) for a wider/narrower column. Rows are a **minimum 51px** tall (a
table-cell `height`, so a wrapped/multi-line cell grows past it). **`pinned: 'left' | 'right'`** sticks the
column to that edge
(`position: sticky` + an opaque bg + a **persistent hairline separator** — an **inset** `box-shadow`, not a **`pinned: 'left' | 'right'`** sticks the column to that edge
(`position: sticky` + an opaque bg + a **persistent hairline separator** — an **inset** `box-shadow`, not a
`border`, which renders unreliably on a sticky cell under `border-collapse: collapse` and vanishes while
scrolled — **plus** an outset edge shadow layered on for depth only while content is hidden under it, driven
by a `data-pin-start`/`data-pin-end` scroll flag; the stripe/hover tint is layered over the pinned bg). A
pinned column with **no `width`** defaults to **content-width** (the `width: 1px` min-content trick) so an
actions column fits its buttons instead of absorbing the table's spare width — set `width` to override. So
it stays put while the rest scrolls — e.g. an actions column pinned `'right'` (one column per edge).
**Row actions — the shortcut:** rather than hand-building that pinned column, pass
**`actions: (row, index) => ReactNode`** — return your own action UI (`IconButton`s / a menu / etc.) and the
table renders it right-aligned in a **pinned-right actions column** it appends for you. The cell is
`stopPropagation`-wrapped, so clicks inside never fire the row's `onClick` — your handlers don't deal with
that. (It's just a render slot, so anything goes; use a full `pinned` column in `columns` only if you also
need it sortable/searchable.) **Two data modes, one flag:** **local** (default — pass the full `data`; the
table searches / sorts / paginates client-side via TanStack's row models) or **server**
(**`manualPagination`** — pass only the current page in `data` + the total in `rowCount`; TanStack tracks
state but slices nothing, and you fetch in **`onChange`**). `TableProps` is a **discriminated union on
`manualPagination`**, so the type **requires `rowCount` in server mode** (it can't be derived from a single
fetched page) and treats it as optional/ignored in local mode. **`onChange(state)`** fires on mount + every
change with the full **`TableChangeState`** `{ page (1-based), size, search, sort: { key, direction } |
null, params, query }` — the server-mode fetch driver (search changes are **debounced** by **`debounceMs`**,
default `300`). **`params`** (a `URLSearchParams`) / **`query`** (its string) are the **ready-built
server-request query** so the fetch doesn't hand-map anything — `fetch(`/x?${state.query}`)`. They're built
from the **query mapping** (app-wide `config.table.query` merged with the per-table **`queryMapping`** prop —
see §5's `table.query`): param names + `page`-vs-`offset` (`skip`) + sort format (`sort=-price` vs
`sortBy=price&order=desc`), so e.g. DummyJSON needs only `queryMapping={{ pageParam: 'skip', sizeParam: 'limit', searchParam:
'q', sortParam: 'sortBy', pagination: 'offset', sortFormat: 'separate' }}`. The **endpoint/path/fetch stay yours**
(Table never fetches); the pure builder is exported as **`buildTableQuery`** (`sava-test/helpers`). **Search** (`searchable`) is a debounced global substring filter (`globalFilterFn:
'includesString'`) in local mode, or emitted in `onChange` for server mode. **Sorting** is per-column
(`sortable`) but **not from the header** — it lives in a **toolbar sort menu**: a `Sort`-icon `Dropdown`
next to the search that opens a quiet uppercase **"Sort By" label** over **one row per sortable column** (the
column header as the label). Clicking a row **cycles that column asc → desc → unsorted**; the **active** row
gets the `selected` tint + a trailing direction arrow (`ArrowUp2` asc / `ArrowDown` desc). While a sort is
applied the trigger reads `filled` **and carries a dot `Badge`**, and the header carries no sort control,
only `aria-sort` (a11y) reflecting the current sort. Local sorts client-side, server emits it in `onChange`. **Pagination**
reuses the `Pagination` component (prev/next + numbered pages; the **first/last jump arrows** are opt-in via
**`showFirstButton`** / **`showLastButton`**, off by default); the footer also shows a rows-per-page `Select` (**`pageSizeOptions`**, default
`[10, 20, 50, 100, 200]`; **`showPageSize`**; the Select passes **`showSelectedTick={false}`** for a
compact look) plus an **"All"** choice (**`allowAllRows`**, default `true` — pass `false` to hide it for
large datasets) that puts every row on one page, and a `"1–10 of N"` range. "All" is a **sentinel page
size** (`Number.MAX_SAFE_INTEGER`) — `state.size` carries it verbatim in `onChange` (server consumers treat
it as unbounded; the server query drops the size param unless `allValue` is set), and it is **not written to
the browser URL** (see URL sync below). Changing size / sort resets to page 1; the page clamps if the
row count shrinks beneath it. **Controlled or uncontrolled, per piece** (like the rest of the library):
each of **`page`** / **`pageSize`** / **`search`** / **`sort`** / **`filterValues`** may be passed with its
**`onPageChange`** / **`onPageSizeChange`** / **`onSearchChange`** / **`onSortChange`** / **`onFiltersChange`**
callback to own that state from outside (e.g. reset filters from an external button, or drive the page from
a parent) — omit it to let the table manage that piece internally (seeded from the matching `default*`). Mix
freely; each is resolved as `controlled ?? internal`, and every mutation still fires the aggregate `onChange`
too. (These granular callbacks are the controlled channel; `onChange` stays the full-state fetch driver.) The **page navigator hides entirely when everything fits on one page**
(`pageCount ≤ 1` — e.g. the "All" size or few rows); the rows-per-page select + `"1–N of N"` range stay.
**URL sync — ON by default, and it mirrors the server request exactly:** page + size + search + sort +
filters are written to the query with the **same builder as `state.query`** (`config.table.query` merged
with the `queryMapping` prop), so the address bar matches the request one-to-one (e.g.
`?page=1&size=10&sortBy=rating&orderBy=desc`, and filters like `?category=a&category=b&price_gte=10&price_lte=100`).
Written via the native History API (`replaceState`, like `Tabs`, preserving params the table doesn't own),
read back on mount (via the exported **`parseTableQuery`** + the internal `parseFilterQuery` — a URL value
wins over `defaultSort` / `defaultSearch` / `defaultFilters`) and restored on `popstate`. An empty
search / sort / filter drops out of the URL, and on the **"All"** size the page + size params drop entirely
(a clean URL, since there's no meaningful page — "All" isn't persisted, so a reload falls back to the default
size). Pass **`urlSync={false}`** to opt out. (There's **no separate `keys.*QueryKey` layer** any more — the
URL param names ARE the `table.query` names, so two URL-synced tables on one page need distinct param names
via their `queryMapping`.) The table renders at a single (md) density — no `size` prop. Other props: **`title`** +
**`toolbar`** (extra toolbar content, e.g. a future filters slot), **`getRowId`** (stable row id — the React
key; defaults to the row **index**, fine for static data but reuses DOM by position when rows reorder or a
server page swaps in, so pass a real id like `(row) => row.id` for any interactive/changing table; a
**dev-only `console.warn`** nudges this when `onRowClick`/`actions` is set without `getRowId`),
**`onRowClick`**, **`loading`** (**with rows already shown** — a token-scrim overlay + `Loader`
dims them while refetching; **with no rows** — a centered `Loader` + `"Loading…"` caption fills the body,
mirroring the empty state's presence rather than a lone tiny spinner), **`empty`** (custom empty node — the
default is a full patterned `EmptyState`), **`stickyHeader`**, **`striped`**, **`hoverable`**
(default `true`). **Row reorder** (**`reorderable`**): prepends a **drag-handle** column (a grip `Menu`
icon, content-width) and makes rows drag-sortable via **`@dnd-kit`** (`PointerSensor` 5px + `KeyboardSensor`:
focus the grip → Space → Arrows → Space); a drop fires **`onReorder(rows, meta)`** with the **full `data`
reordered** (the consumer owns `data` and sets it) + a **`meta`** (`TableReorderMeta` = `{ id, from, to }` —
the dragged row's id + its old/new index, e.g. to log or persist the move). **Local mode**, best with no active sort (a sort fights a
manual order), and **requires `getRowId`** for stable dnd ids (the dev warning above also fires for
`reorderable` without it). The dragged row lifts with a subtle highlight; the body wraps in a `DndContext`
only while `reorderable` (a `SortableContext` of the row ids, each row a `SortableRow`). The drag is
**clamped** by two inlined dnd-kit modifiers (no `@dnd-kit/modifiers` dep) — vertical-axis + restrict-to-parent
(`<tbody>`) — so a row dragged past the table's top/bottom edge can't extend beyond it and grow the
`overflow` scroll container (which is vertically scrollable since `overflow-x: auto` forces `overflow-y: auto`).
The drag itself relies on trusted pointer/keyboard events, so it's verified in a real browser, not jsdom
(tests cover the render contract — a handle per row, gated by the prop). **Export** (**`onExportToEmail`**): a toolbar export `Dropdown` (an export-icon trigger next to
sort) opening an uppercase **"Export" label** over a **single baked "Send On Email" item** (label + icon
hardcoded). Set the **`onExportToEmail`** prop (`(state: TableChangeState) => void`) to show the menu; on click
it fires with the current state so you just wire your endpoint — e.g.
`onExportToEmail={(s) => exportCustomers(s.query)}`. There's **no built-in client-side CSV**; the menu hides
when `onExportToEmail` is omitted.
**Filters** (**`filters`**): declarative filter defs (`TableFilter[]` = `{ key, label, type, options?,
placeholder? }`) render a toolbar **Filters** button (a `Filter` icon with a **count `Badge`**) opening a
right **drawer** (`Modal placement="right"`) — a `Modal`, not a popover, so the nested `Select` /
`DatePicker` popovers work inside it (the `FloatingPanel` outside-pointerdown would otherwise close a
popover-based panel). The drawer has a `Filter`-icon header + a footer with **Clear** (`filled`, pinned
left — resets the draft fields) and **Cancel** / **Apply** (right); it edits a **draft** committed only on
Apply (Cancel discards). Core types: **`text`** (contains) · **`number`** (=) · **`numberRange`** (two open-bounded Min/Max
`NumberField`s — either can be empty) · **`numberRangeSlider`** (same value shape, but a two-thumb `Slider`
— bounds via **`min`**/**`max`**/**`step`**; a thumb at an extent maps back to an open (`null`) bound so a
full-range slider is inactive) · **`select`** · **`multiSelect`** (∈) · **`boolean`** (a `RadioGroup` —
Any/Yes/No → off/`true`/`false`; relabel via **`booleanLabels`** `{ any, yes, no }`) · **`date`** (same
day) · **`dateRange`** · **`time`** (same `HH:mm`) · **`timeRange`** · **`dateTime`** (same minute) ·
**`dateTimeRange`** — the temporal types compare ISO substrings at their precision (day / `HH:mm` /
minute), both bounds sliced the same so lexical compare works; `date`/`dateRange` use `DatePicker`, `time`
/`timeRange` `TimePicker`, `dateTime`/`dateTimeRange` `DateTimePicker` (ranges = a From/To pair).
`select`/`multiSelect` take `options` (`SelectOption[]`). **Local mode** filters `data` client-side (the pure **`applyFilters`** — AND across set
filters — pre-filters before TanStack search/sort/paginate); **server mode** emits the active values as
**`state.filters`** in `onChange` **and folds them into `state.query`** (via the pure **`buildFilterQuery`**,
config-driven): each filter uses its **`queryKey` ?? `key`**; a scalar emits `param=value`, a `multiSelect`
emits repeated params or a CSV (**`multiSelectFormat`**), and a range emits `<param><rangeMinSuffix>` /
`<param><rangeMaxSuffix>` (defaults `Min`/`Max`; set `_gte`/`_lte`, `[gte]`/`[lte]`, … per your API). So a
server fetch appends `state.query` as before, filters included. Applying/clearing resets to page 1; initial
values via **`defaultFilters`**; each active filter also mirrors to the URL under its `key` (see URL sync).
The panel is the internal `TableFilters`; the model + matcher + query builders live in `tableFilter.ts`.
_Per-column filters, an operator picker (contains vs equals), controlled filters + async filter options, and
active-filter chips are natural next iterations._ Because the component is
**generic** (`Table<T>`) it uses the standard `forwardRef(...) as <T>(props) => ReactElement` cast (the one
sanctioned deviation from the plain `forwardRef` anatomy — generics don't survive `forwardRef`'s typing).
**Responsive:** cells are `white-space: nowrap` and the surface (`.scroll`) is `overflow-x: auto` with
`min-width: 0` (+ the root's `max-width: 100%`), so when the columns exceed the width the **table scrolls
horizontally inside its container** instead of squeezing/wrapping or widening the page (the flex-parent
overflow guard). a11y: a real `<table>`/`<thead>`/`<tbody>`, `scope="col"` + `aria-sort` on sortable
headers, the search box `aria-label`led, the `Loader` `role="status"`. **Note:** the tests run in jsdom
(TanStack needs no DOM measurement) — they cover render / columns / custom cell, local search (debounced) /
sort / pagination, the pinned-column class, the empty-cell "—" placeholder, server-mode `onChange` (+ the
`queryMapping`-built `query`), the toolbar sort menu, empty + loading, URL sync (mirrors `state.query`:
page/size canonicalize + read + write + opt-out — incl. the clean URL on "All" — and search/sort/filters
read + write), the query builders (`buildTableQuery` / `parseTableQuery` round-trip), the **export** menu (a
the baked `onExportToEmail` item firing with the state), the **filters** (`applyFilters` per type; the Filters panel filtering local data on Apply +
emitting `state.filters` in server mode; the server-query + URL round-trip via
`buildFilterQuery` / `parseFilterQuery`), controlled mode (page / sort / search / filters), and
`onRowClick`. Own CSS module. _Row selection (checkboxes), per-column filters, filter operator pickers,
async filter options, column resize/pinning,
and virtualization are natural next iterations._

### TranslatedFields

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

### Hooks

`useDisclosure(initial = false)` → `{ isOpen, open, close, toggle }`. Model new hooks on this:
small, typed return interface, `useCallback`-stable handlers. **`useLockBodyScroll(locked)`** locks
scrolling on `<html>` + `<body>` while `locked` (e.g. an open `Dropdown`/modal/drawer) using
**`overflow: clip`** (not `hidden`, so it doesn't establish a scroll container and `position: sticky`
elements like the sidebar/header keep working), compensating for the removed scrollbar with
`padding-right` and restoring the prior inline styles on unlock; it's public from `sava-test/hooks`.

**`useMediaQuery(query)`** → `boolean` — subscribes to a CSS media query (e.g.
`useMediaQuery('(max-width: 640px)')`) and re-renders when it flips. Built on `useSyncExternalStore`,
so the first client render already has the correct value (no flash) and it's SSR-safe (returns `false`
on the server / where `matchMedia` is absent). **Use this for any responsive JS branch** instead of
hand-rolling `window.matchMedia` + effects; public from `sava-test/hooks`.

**`useFloatingPanel({ open, triggerRef, onClose })`** (internal hook, `src/hooks/`) → `{ popoverRef,
position, visible, reposition }`: the floating-panel plumbing — a `<body>`-portaled panel that opens
below its trigger (flips above only on overflow), exposes the trigger width, clamps to the viewport,
re-positions on scroll/resize (+ `ResizeObserver`), locks page scroll, and dismisses on
outside-pointerdown / `Escape`. Not in the public hooks surface.

### FloatingPanel (internal)

The single shared popover, wrapping `useFloatingPanel` — **every floating popover in the library**
(`Select` / `MultiSelect`, `DatePicker` / `DateTimePicker` / `TimePicker`, `ColorPicker`, and the public
**`Popover`**) renders it, so the portal + positioned div + `data-open`/`data-side` + enter animation +
(optional) focus-trap aren't written per component. Props: `open` · `triggerRef` · `onClose(refocus)` ·
`align?` (`start` default · `end` right-aligns + grows left, used by `Popover`) ·
`id?` (for the trigger's `aria-controls`, used by `Popover`) · `role?` (`'dialog'`) · `ariaLabel?` ·
`trapFocus?` (traps Tab **and** sets `aria-modal` — for the modal date/time dialogs + form popovers) ·
`matchTriggerWidth?` (select-like, used by Select/MultiSelect) · `width?` (fixed, e.g. ColorPicker's
`232`) · `className` (merged after the shared chrome) · `style` (e.g. ColorPicker's `--cp-hue`). It
**forwards its ref** to the panel element so a consumer can still read it (blur bookkeeping, focus
moves). The base chrome (z-index, border, radius, surface, shadow, `overscroll-behavior`) **and** the
opacity/translate enter animation live once in `FloatingPanel.module.css` `.panel`; each consumer's
own `.popover` class keeps only its layout (padding / `display` / `overflow` / width). **Internal** —
no `index.ts`, so the build glob never exposes it as a `sava-test/components/*` subpath; consumers
import it via `../FloatingPanel/FloatingPanel`. **`Dropdown` is deliberately NOT built on it** — it
keeps its own placement variants + collision-flip + roving-menu keyboard nav + `closeOnSelect` +
cloned-trigger logic.

### Overlay (internal)

The single shared **backdrop** behind every dimmed, page-blocking surface — **`Modal`** (and thus
`RemoveDialog`) and the FileUploader **lightbox** (`FileUploaderPreview`) both render it, so the portal +
fixed scrim + scroll-lock + fade-in + dismissal aren't written per component. It's the backdrop analog of
`FloatingPanel` (which is for anchored, non-dimmed popovers — the two never overlap: `Overlay` dims + blocks
the page, `FloatingPanel` floats beside a trigger). Props: `open` (gates the portal + drives the fade) ·
`onClose?` · `closeOnBackdrop?` (default `true`) · `closeOnEscape?` (default `true`) · `lockScroll?`
(default `true`, via `useLockBodyScroll`) · `dim?` (scrim alpha, default `0.45`; fed to the CSS as an inline
`--tz-overlay-dim` var — the FileUploader lightbox passes `0.85`) · plus any `HTMLAttributes` (`className`,
`role`, `aria-*`, `data-*`). It `createPortal`s a fixed full-viewport scrim to `<body>` (literal black-alpha —
a brand tint would invert in dark mode), **centers its children** (flex), fades in via a rAF `visible` flag →
**`data-open`** on the scrim (consumers read that for their own box's enter transform), and dismisses on
**Escape** (`stopPropagation`-swallowed so a nested overlay's Escape can't reach an outer one — kept as a
React `onKeyDown` on the scrim, not a document listener, precisely to preserve that React-tree swallow) and
**backdrop-click** (gated on the pointer-down AND click both landing on the scrim, so a text-selection drag
ending on it doesn't close). A consumer `onKeyDown` still fires **after** the Escape handling (Modal adds its
Tab focus-trap that way). The base scrim/center/z-index/fade live once in `Overlay.module.css` `.overlay`;
each consumer's own class adds only its layout (Modal's padding + scroll/drawer variants keyed off
`.overlay[data-*]`; the lightbox's inset). **Internal** — no `index.ts`, so the build glob never exposes it
as a `sava-test/components/*` subpath; import it via `../Overlay/Overlay`. The ref points at the scrim div.

### Form — `useForm` (Zod-powered)

A small form helper (`src/form/`) — the in-library alternative to bundling Formik in every app.
`useForm({ schema, defaultValues, onSubmit?, mode?, scrollToError? })` where `schema` is a **Zod**
object schema (field names = its top-level keys) and `defaultValues` is the controlled source of
truth. `zod` is an **optional peer dep** — only needed when you use `useForm`; values/types are
inferred from the schema via `z.infer`.

**Scroll-to-error.** On a failed submit, `handleSubmit` smooth-scrolls to **and focuses the first
invalid field** — the one with the smallest viewport `top` (the topmost red field, regardless of DOM
vs. visual order), matched by its `name` inside the submit event's `currentTarget` form. So it works
with `<Form>` and any `<form onSubmit={form.handleSubmit}>`. Opt out with `scrollToError: false`
(default `true`). Uses `name` attributes (not `aria-invalid`), so it's immune to React's re-render
timing; `scrollIntoView({ behavior: 'smooth', block: 'center' })` + `focus({ preventScroll: true })`.

Returns `{ values, errors, touched, isValid, isSubmitted, submitCount, isSubmitting, field, setValue, setValues, reset, handleSubmit }`
(the `FormApi` type). **`submitCount`** increments on every `handleSubmit` (watch it to react to each
submit attempt — e.g. `TranslatedFields` uses it to jump to an erroring tab). `handleSubmit` validates the whole form and calls `onSubmit` with the
**parsed** values only when valid (awaiting an async `onSubmit` toggles `isSubmitting`). `onSubmit`
gets a second **helpers** arg — `(values, { reset, setValue, setValues })` — so you can clear the
form on success: `onSubmit: (values, { reset }) => { await save(values); reset() }`. (`reset()` is
also on the form object for a standalone "Clear" button.)

**Two ways to bind a field** (prefer the first):

1. **`<Form form={form}>` + a `name` prop** — `<Form>` renders a native `<form noValidate>` wired to
   `handleSubmit` and shares the instance via context; any nested `<TextField name="email" />`
   auto-pulls value/onChange/onBlur/error/helperText. No spread.
2. **Spread `field(name)`** onto a `<TextField />` directly (works without a `<Form>` wrapper).

Explicit props always win over the bound ones. `mode` controls when errors show: `blurThenLive`
(default — after blur/submit, then live on change), `change` (from the first keystroke), or `submit`
(only after a submit attempt). Validation is derived from the live `values` (no stale error state);
errors are stored for every invalid field but only _shown_ per `mode`. Don't pass an explicit
`helperText` to a bound field — the form owns it. Single-level (flat) schemas today; nested paths use
`issue.path[0]`.

```tsx
const schema = z.object({ email: z.string().email(), password: z.string().min(6) })
const form = useForm({ schema, defaultValues: { email: '', password: '' }, onSubmit: save })
<Form form={form}>
  <TextField name="email" label="Email" />
  <TextField name="password" type="password" label="Password" />
  <Button type="submit" loading={form.isSubmitting}>Sign In</Button>
</Form>
```

### Layout — `RootLayout` / `Sidebar` / `FirstRouteRedirect` (TanStack Router)

The admin-panel shell lives under `src/components/` (`RootLayout/`, `Sidebar/`, `Breadcrumbs/`) — it's
shipped as ordinary components, so it imports from `sava-test/components` like everything else. Powered
by **`@tanstack/react-router`** (optional peer, `>=1`, `external` in the build).
`RootLayout({ logo?, sidebarFooter?, header?, toaster?, children })` uses a **floating layout**: the
shell is a grid (`auto 1fr`, `--tz-space-md` padding + gap) on the soft **`--tz-color-surface`** canvas,
with a rounded, elevated **white sidebar card** (`--tz-color-secondary` + border + `--tz-radius-lg` +
`--tz-shadow-xs`) beside the header + content; set it as the **root route's** component and pass
`<Outlet/>` as `children`. The sidebar card is **sticky** (`top: --tz-space-md`, `height: calc(100vh -
2*--tz-space-md)`) and split into three rows (`grid-template-rows: auto minmax(0,1fr) auto`) — the
`logo`/brand row fixed at the top, the nav scrolling (`overflow-y:auto`), and an optional
**`sidebarFooter`** card (any node — e.g. a "Need help?" promo) pinned at the bottom. A header
**toggle** `IconButton` (left, `filled`, `Menu` icon) collapses/hides the sidebar by animating its
`width` to `0` (the shell's first grid column is `auto`, so it follows); the `ThemeToggle` is `filled`
too. Nav icons match the row label (text) color via `--tz-list-icon-color`, and the active **pill** is a
touch stronger than the default `List` tint (bumped `--tz-list-hover-alpha`/`--tz-list-selected-alpha`
on the nav). The **header is borderless on the canvas** (transparent, scrolls with the content — not pinned), with
the sidebar toggle + a built-in **nav search** (`search`, default `true`) on the **left** and the
controls on the right, driven by the
`header` config (`HeaderConfig`) — `{ theme?: boolean /* default true */; fullscreen?: boolean /* default true */; search?: boolean /* default true */; breadcrumbs?: boolean /* default false */; pageTitle?: boolean /* default true */; onLogout?: () => void; user?: { name?; email?; avatar? } }`.
Set it **app-wide** via **`config.header`** (`<ConfigProvider>`) or **per shell** via the `RootLayout`
**`header` prop** — the prop is merged **over** `config.header` (prop wins).
The **`NavSearch`** (an internal `Sidebar` export) searches the sidebar's pages — it flattens the same
`useNavTree` (so it's RBAC-filtered) into `{ label, to, context }` and shows suggestions as a floating
`List` of `ListItem`s below a `TextField` (filter by page name or section; Up/Down + Enter navigate via
`useNavigate`, Escape/outside-pointerdown close). The right-side controls are
a `FullscreenToggle` + `ThemeToggle` (both on by default and `filled`), plus an account `Avatar` — a
focusable button whose `Dropdown` menu
has a single **Sign out** `ListItem` calling `onLogout` — shown when `onLogout` is given; when `user`
is supplied the menu opens with a `User`-icon (or `user.avatar` image) + name + email header above a
divider). The
content area stacks **the page title (the active route's `staticData.name`, via the internal
`usePageTitle()`, as an `h2`) → `children`** — pages wrap their own body in **`PageLayout`**; the
`Breadcrumbs` trail sits above the title **only when `header.breadcrumbs` is on** (default off).
Set **`header.pageTitle: false`** to drop that auto `h2` when pages render their own heading inside
their `PageLayout` header instead (icon + title + actions) — so the title isn't shown twice.
RootLayout also **mounts a `<Toaster>` by default** (so `toast.*()` works app-wide with no extra setup):
the top-level **`toaster`** prop is `true` (defaults), a `ToasterProps` object (`{ position, duration }`),
or `false` to opt out (e.g. you mount your own `<Toaster>` — two viewports would double every toast).
**`Sidebar`** auto-builds a 3-level menu (module → group → page) by
walking `useRouter().looseRoutesById` and reading each route's `fullPath` + `staticData` — no manual
menu config. Rows are composed from **`List` / `ListItem`** (links render via `ListItem as={Link}`,
bridged by a small typed `NavLink` cast since `to` is router-specific); the active row uses
`ListItem selected`, leaves use dot bullets (no icons) at `size="md"`, and an expandable group's leaf
`List` folds with the same smooth `grid-template-rows: 1fr → 0fr` transition as `Card` (chevron
`ArrowDown4`). The module label is a dark, `md`, uppercase heading (no icon). **`FirstRouteRedirect`** (for the `/` route) forwards to the first menu item. **`PageLayout`**
is a **flat `Card`** (`<Card flat>`) for a page's content — so it gains Card's full anatomy (optional
header `icon`/`title`/`subtitle`/`actions`, body, `footer`/`footerStart`, `collapsible`) while staying on
the page `--tz-color-background` with no shadow. The shell is a **floating layout** (the FreshCart look):
the whole app sits on a soft **`--tz-color-surface`** canvas (with a very light brand-glow gradient
from the top-left; the shell has `--tz-space-md` padding + gap), and the **sidebar is a rounded,
elevated white card** (`--tz-color-secondary` + border +
`--tz-radius-lg` + `--tz-shadow-xs`, sticky at `100vh - padding`) with the `logo` at the top, the nav
(a slightly stronger active **pill** via bumped `--tz-list-hover-alpha`/`--tz-list-selected-alpha` on the
nav), and an optional **`sidebarFooter`** card pinned at the bottom (grid rows `auto minmax(0,1fr) auto`).
The **header is borderless on the canvas** (sticky, grey bg), and the page's `PageLayout` cards float as
white panels on the grey. `PageLayout`'s props are `Omit<CardProps, 'flat'>` (always flat) and it ships
named **and** default from `sava-test/components/PageLayout`.

Routes self-register via TanStack `staticData`, which the library augments (typed for consumers):
`{ name?: string; icon?: IconName; order?: number; hidden?: boolean; roles?: string[]; badge?: string; dot?: ThemeColor }`
— a route with **no `name`** never appears; `hidden` keeps it routed but off the menu; `order` sorts
(asc, then alphabetical); `roles` gates it by access (see RBAC below); `badge` shows a small "New"-style
pill on the menu row (a styled span, **not** the `Badge` component — `--tz-color-dark` fill, rendered
in the row's trailing slot before any chevron); `dot` shows a small colored dot on the row tinted by any
brand `ThemeColor` (e.g. `dot: 'error'`, via `var(--tz-color-<color>)`). **Dynamic/param routes** (e.g.
`/users/$userId`) work normally — give them no `name` (or `hidden`) and they route + render via the
`<Outlet/>` but stay off the menu; the page title and breadcrumb then fall back to the nearest named
ancestor (the menu reads only `staticData`, so it never tries to build a `$param` link).
Path segments infer structure: `/dashboard` (1 seg) → top-level link; `/components/theme-toggle`
(2 seg, no children) → clickable group row; `/components/forms/button` (3 seg) → module `components` →
group `forms` → page; an index route at a group path (`/components/forms/`) makes the group a
**"Case B"** page (icon/label navigate + expand, chevron only toggles). Module/group chrome
(label/icon/order) comes from that folder's `route.tsx` `staticData`, else the segment is prettified.

The tree logic is a pure, tested `buildNavTree(routes)` (router-free); `useNavTree` feeds it the live
routes. Styles are **CSS Modules** co-located in each folder (`RootLayout.module.css`,
`Sidebar.module.css`, `Breadcrumbs.module.css`, token-only → light/dark-safe), bundled into
`dist/index.css`. The `declare module '@tanstack/react-router'` augmentation ships in the published
`.d.ts`. **Public exports:** `RootLayout`, `Sidebar`, `Breadcrumbs`, `FirstRouteRedirect` (from
`sava-test/components`) with types `RootLayoutProps`, `RootLayoutHeader`, `IconName`; the RBAC
functions `setAccessKeys`/`getAccessKeys`/`hasAccess` (from `sava-test/helpers`) and `useAccessKeys`
(from `sava-test/hooks`). **Internal (not exported):** `buildNavTree`, `useNavTree`, `firstNavTo`,
`usePageTitle`, `useBreadcrumbs`, and the `NavLeaf`/`NavGroup`/`NavModule`/`NavRoute`/`Breadcrumb`
types — RootLayout/Breadcrumbs use them via direct file imports. Gotcha: never name a leaf route file
`loader.tsx` (reserved by the router plugin) — use a `loader/index.tsx` folder.

**Breadcrumbs.** `RootLayout` renders `<Breadcrumbs/>` at the top of the content area **only when
`header.breadcrumbs` is `true`** (it defaults to **`false`** — hidden). It's built from the active match chain via `useBreadcrumbs()` — one crumb per
matched route that declares a `staticData.name` (module → group → page). It always opens with a home
icon linking to the first allowed menu page (same target as `FirstRouteRedirect`). Intermediate crumbs
link only when they map to a real navigable menu page (reusing the access-filtered nav tree, so
forbidden/non-page ancestors render as plain text); the current page is always plain text
(`aria-current="page"`). Renders nothing when the route has no named matches. The `Breadcrumbs`
component is also exported from `sava-test/components` if an app wants the trail elsewhere (the
`useBreadcrumbs` hook stays internal). **`separator?: IconName | ReactNode`** (default `"ArrowRight4"`):
a known `IconName` renders as an `<Icon>`, any other string as text, or pass a node.
Every crumb shares one color (`--tz-color-primary-shade600`); links darken to `--tz-color-text` and underline
on hover.

**RBAC — role-based menu filtering (`src/helpers/access.ts`).** A page declares allowed `accessKeys`
via `staticData.roles: string[]` (**OR** semantics — the user needs any one; omitted/empty = public).
Access is a **module singleton** with a React subscription, so it's readable both inside React
(`useAccessKeys()` — reactive, re-renders the `Sidebar`) and outside it (`hasAccess(roles)` — for
TanStack `beforeLoad` guards, which run before React). The app calls `setAccessKeys(keys)` after
login/`getUser` (and `setAccessKeys([])` on logout); `getAccessKeys()` is the non-reactive read.
`useNavTree` subscribes via `useAccessKeys()` (a `useMemo` dep) and **filters routes through
`hasAccess(sd.roles)` before `buildNavTree`**, keeping the builder pure — forbidden pages drop out
live, and empty groups/modules vanish on their own (they're only created when a child is added).
`FirstRouteRedirect` needs no change — it lands on the first item of the already-filtered tree, i.e.
the first allowed page. Defaults are inert: pages without `roles`, and apps that never call
`setAccessKeys` (keys stay `[]`), behave exactly as before. For direct-URL defense-in-depth, guard the
route too: `beforeLoad: () => { if (!hasAccess(['Analyst'])) throw redirect({ to: '/' }) }`.

```tsx
// app: src/routes/__root.tsx — logo + optional sidebarFooter in the sidebar card; header = theme toggle + logout
export const Route = createRootRoute({
  component: () => (
    <RootLayout logo={<Icon name="Box" />} header={{ theme: true, onLogout: () => auth.logout() }}>
      <Outlet />
    </RootLayout>
  ),
})
// app: src/routes/index.tsx  →  component: FirstRouteRedirect
// app: a page  →  createFileRoute('/dashboard/')({ staticData: { name: 'Dashboard', icon: 'Category', order: 0 } })

// RBAC: feed the user's roles in once (after login), gate pages with `roles`, guard direct URLs.
import { setAccessKeys, hasAccess } from '@techzy/ui'
setAccessKeys((await getUser()).response.accessKeys) //   [] on logout
// a gated page:
createFileRoute('/dashboard/')({
  staticData: {
    name: 'Dashboard',
    icon: 'Category',
    order: 0,
    roles: ['Analyst', 'SystemUserManager'],
  },
  beforeLoad: () => {
    if (!hasAccess(['Analyst', 'SystemUserManager'])) throw redirect({ to: '/' })
  },
})
```

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
| `./theme`                             | `src/entries/theme.ts`                | `ConfigProvider`, `useTheme`, `useLocales`, `useTranslationsNamespace`, `useTabsQueryKey`, `useNestedTabQueryKey`, `useStepQueryKey`, `useTableQueryConfig`, `useHeaderConfig`, `applyTheme`                                                           |
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

1. `src/components/<Name>/` with `<Name>.tsx`, `<Name>.module.css`, `index.ts`.
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
