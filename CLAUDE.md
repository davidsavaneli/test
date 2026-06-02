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
- **Dependency policy — keep it light.** Runtime deps are only `clsx`. No state-management or
  styling libraries. Local state uses React Context + hooks (never zustand/redux); app-level
  state lives in the consuming apps, not here.

---

## 2. Repository layout

```
src/
  components/
    <Name>/
      <Name>.tsx          # component (forwardRef + props interface)
      <Name>.module.css   # scoped styles (CSS Modules)
      index.ts            # barrel: re-export component + its types
    index.ts              # re-exports every component
  theme/
    applyTheme.ts         # TechzyTheme type, hex→rgb, contrast logic, applyTheme()
    ThemeProvider.tsx     # ThemeProvider, useTheme, ThemeConfig, dark-mode merge
    index.ts
  hooks/
    useDisclosure.ts      # example hook (open/close/toggle)
    index.ts
  icons/
    icons.ts              # generated inline-SVG registry (committed source of truth)
    names.ts              # generated IconName union (~1195 names)
  styles/
    reset.css             # global reset (consumer imports once)
    theme.css             # all --tz-* design tokens (consumer imports once)
    general.css           # base body styles (consumer imports once)
  css-modules.d.ts        # ambient decls for *.module.css and *.css
  index.ts                # public entry: export * from components / hooks / theme
playground/main.tsx       # local demo of every component (run via `npm run playground`)
scripts/build-icons.mjs   # regenerates icons.ts + names.ts from a raw Iconsax dump
```

---

## 3. Design tokens (`--tz-*`)

All tokens live in `src/styles/theme.css` under `:root`. **Always use a token; never hardcode a
literal** color, size, radius, spacing, shadow, z-index, or duration in a component's CSS.

### 3.1 Color model — RGB triplets

Each brand color is stored as a **comma-separated RGB triplet** (not hex) so we can derive alpha
shades with `rgba()`:

```css
--tz-color-primary-rgb: 19, 64, 78;          /* the triplet */
--tz-color-primary: rgb(var(--tz-color-primary-rgb));   /* solid convenience */
--tz-color-primary-shade100: rgba(var(--tz-color-primary-rgb), 0.06);
/* ...shade200..shade800 */
--tz-color-primary-contrast: #ffffff;         /* readable text color on a solid fill */
```

**Brand palette (10 colors)** — light-mode defaults:

| token       | hex       | role                                  |
| ----------- | --------- | ------------------------------------- |
| `primary`   | `#13404e` | primary brand / default text          |
| `secondary` | `#f4f9f8` | page background / surface             |
| `tertiary`  | `#5c7687` | muted accent                          |
| `dark`      | `#056472` | dark brand shade                      |
| `medium`    | `#039aa1` | mid brand shade                       |
| `light`     | `#adc3c9` | light brand shade                     |
| `success`   | `#00a854` | semantic — success                    |
| `error`     | `#f04134` | semantic — error/danger               |
| `info`      | `#039aa1` | semantic — info                       |
| `warning`   | `#ffbf00` | semantic — warning                    |

> The hex values above are the library's built-in defaults. Consuming apps override them through
> `ThemeProvider` (see §5). Components must reference colors by **token name**, never by hex.

**Shade scale** (alpha applied to the color's triplet) — same steps for every color:

| token       | alpha | token       | alpha |
| ----------- | ----- | ----------- | ----- |
| `-shade100` | 0.06  | `-shade500` | 0.5   |
| `-shade200` | 0.10  | `-shade600` | 0.7   |
| `-shade300` | 0.14  | `-shade700` | 0.8   |
| `-shade400` | 0.30  | `-shade800` | 0.9   |

**Contrast tokens** (`--tz-color-<name>-contrast`): the text color that stays legible on top of
that color used as a solid fill. Used by `contained` controls. Defaults are mostly `#ffffff`;
`secondary-contrast` is `rgb(var(--tz-color-primary-rgb))`. These are **recomputed per mode** by
`applyTheme()` — see §4.

### 3.2 Semantic colors

Derived from brand tokens so they flip automatically when the palette is swapped per mode:

```css
--tz-color-text: rgb(var(--tz-color-primary-rgb));
--tz-color-background: rgb(var(--tz-color-secondary-rgb));
--tz-color-surface: rgb(var(--tz-color-secondary-rgb));
--tz-color-border: rgba(var(--tz-color-primary-rgb), 0.12);
```

### 3.3 Typography tokens

```css
--tz-font-family: "Inter", system-ui, -apple-system, ... sans-serif;
--tz-font-weight-regular: 400;   /* DEFAULT for body and most components */
--tz-font-weight-medium: 500;
--tz-font-weight-bold: 600;      /* only h1–h4 headings */
```

Font-size scale (used by Typography variants and control sizes):

| token              | px  | token              | px  |
| ------------------ | --- | ------------------ | --- |
| `--tz-font-size-xxs` | 8  | `--tz-font-size-lg`  | 16 |
| `--tz-font-size-xs`  | 10 | `--tz-font-size-xl`  | 20 |
| `--tz-font-size-sm`  | 12 | `--tz-font-size-xxl` | 26 |
| `--tz-font-size-md`  | 14 |                      |    |

### 3.4 Radius & spacing (shared 4→48 scale)

`--tz-radius-*` and `--tz-space-*` use the **same** numeric steps:
`xxs 4 · xs 8 · sm 16 · md 24 · lg 32 · xl 40 · xxl 48` (px).
Spacing is one scale for margin, padding, and gap.

### 3.5 Control heights

Inputs, selects, buttons — the `sm/md/lg` sizing baseline:

```css
--tz-control-height-sm: 30px;
--tz-control-height-md: 36px;   /* default */
--tz-control-height-lg: 42px;
```

### 3.6 Shadow, z-index, motion

- `--tz-shadow-xs … -xl` — elevation for cards, dropdowns, modals, popovers.
- `--tz-z-dropdown 1000 · -sticky 1100 · -overlay 1200 · -modal 1300 · -popover 1400 · -toast 1500 · -tooltip 1600`.
- `--tz-duration: 300ms` — **the single motion duration**. All transitions use
  `var(--tz-duration)` with no custom easing (browser default). Do not introduce extra
  duration/easing tokens.

---

## 4. Color application (`applyTheme`)

`src/theme/applyTheme.ts` writes per-color CSS variables onto an element (default
`document.documentElement`) from a `TechzyTheme` (a `{ name: hex }` map of the 10 brand colors):

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
.contained { background: rgb(var(--tz-btn-rgb)); border-color: rgb(var(--tz-btn-rgb)); color: var(--tz-btn-on, #fff); }
.contained:hover:not(:disabled) { filter: brightness(0.92); }
.filled    { background: rgba(var(--tz-btn-rgb), 0.12); color: rgb(var(--tz-btn-rgb)); }
.filled:hover:not(:disabled)   { background: rgba(var(--tz-btn-rgb), 0.2); }
.outlined  { background: transparent; border-color: rgba(var(--tz-btn-rgb), 0.5); color: rgb(var(--tz-btn-rgb)); }
.outlined:hover:not(:disabled) { background: rgba(var(--tz-btn-rgb), 0.08); border-color: rgb(var(--tz-btn-rgb)); }
.text      { background: transparent; color: rgb(var(--tz-btn-rgb)); }
.text:hover:not(:disabled)     { background: rgba(var(--tz-btn-rgb), 0.08); }
```

Any future tintable control (Chip, Badge, Tab, …) should reuse this exact pattern.

---

## 5. Theming (`ThemeProvider` / `useTheme`)

```tsx
<ThemeProvider config={{ mode: 'light', colors: { light: {...}, dark: {...} } }}>
  <App />
</ThemeProvider>
```

- **`ThemeConfig`**: `{ colors: { light: TechzyTheme; dark?: Partial<TechzyTheme> }; mode?: 'light' | 'dark' }`.
- **Dark merge order**: `{ ...light, ...DEFAULT_DARK_COLORS, ...dark }` — app's light palette as
  base, then the library's built-in dark defaults (`primary #e6e8eb`, `secondary #181c21`,
  `tertiary #969ca3`), then the app's own dark overrides win.
- On mode change (in `useLayoutEffect`): calls `applyTheme(palette)`, sets `data-tz-theme` attr,
  sets CSS `color-scheme`, and persists to `localStorage['tz-theme-mode']`.
- **`useTheme()`** returns `{ mode, setMode, toggleMode }`. Throws if used outside a provider.
- Initial mode = stored value if present, else `config.mode`, else `'light'`.

---

## 6. Component anatomy (the required pattern)

Every component follows this shape. Deviating breaks consistency — don't.

```tsx
import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { clsx } from 'clsx'
import type { TechzyColor } from '../../theme'
import styles from './Widget.module.css'

export type WidgetVariant = 'contained' | 'filled' | 'outlined' | 'text'
export type WidgetSize = 'sm' | 'md' | 'lg'

export interface WidgetProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  /** JSDoc on EVERY prop — short, English, describes behavior + default. */
  variant?: WidgetVariant
  /** Brand palette token that tints the control. Defaults to `primary`. */
  color?: TechzyColor
  size?: WidgetSize
}

export const Widget = forwardRef<HTMLButtonElement, WidgetProps>(function Widget(
  { variant = 'contained', color = 'primary', size = 'md', className, style, children, ...props },
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
   a brand `TechzyColor` token, not a CSS color string.
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

| prop          | type                                  | default       | notes                                            |
| ------------- | ------------------------------------- | ------------- | ------------------------------------------------ |
| `variant`     | `'contained'\|'filled'\|'outlined'\|'text'` | `'contained'` | for tintable controls                            |
| `color`       | `TechzyColor`                         | `'primary'`   | brand token; drives `--tz-btn-rgb`               |
| `size`        | `'sm'\|'md'\|'lg'`                     | `'md'`        | maps to control-height / font / icon size        |
| `loading`     | `boolean`                             | `false`       | shows `Loader`, sets native `disabled` + `aria-busy` |
| `disabled`    | `boolean`                             | `false`       | `opacity: 0.5` + `cursor: not-allowed`           |
| `rounded`     | `boolean`                             | `false`       | pill (`999px`) / circle                          |
| `fullWidth`   | `boolean`                             | `false`       | `width: 100%`                                    |
| `nonClickable`| `boolean`                             | `false`       | non-interactive but **normal** look (not dimmed) — `pointer-events: none` + `tabIndex={-1}` + `aria-disabled`, no native `disabled` |

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
the **start** icon (or the end icon when only `endIcon` is set) and the text stays visible.

### IconButton

Square (width = height = `--tz-control-height-*`). Same `variant`/`color`/`size` system as Button,
plus `loading`, `rounded` (→ circle), `disabled`, and `nonClickable`. Pass an `<Icon />` as the
child; while `loading` it's swapped for the `Loader`. **Requires `aria-label`** (no visible text).

### Icon

`name: IconName` (required) · `color?: TechzyColor` · `size` (`sm` 16 / `md` 20 / `lg` 24px).
Renders an inline SVG from the generated registry; `fill: currentColor` so it follows text color
unless a `color` token is set. `aria-hidden`, `focusable={false}`.

### Loader

`size` (matches Icon: 16/20/24px) · `color?: TechzyColor`. Circular CSS spinner; border uses
`currentColor` so it inherits text color. `role="status"`, `aria-label="Loading"`. Animation
`tz-loader-spin 0.6s linear infinite`.

### Typography

`variant` (`h1 h2 h3 h4 subtitle body bodySmall caption uppercase`, default `body`) ·
`as?: ElementType` (override the tag, keep the styling) · `color?: TechzyColor | 'text'` (omit to
inherit) · `align` · `truncate`. Default element per variant (`h1→h1 … body→p … caption/uppercase→
span`). Headings `h1–h4` are bold; everything else is `--tz-font-weight-regular`. No default
margins.

### ThemeToggle

Wraps `IconButton` (default `variant="outlined"`). Shows `Icon name="Sun"` in light mode, `"Moon"`
in dark; flips `mode` via `useTheme().toggleMode` on click. `role="switch"`, `aria-checked`,
`aria-label="Toggle color theme"`. Props = `Omit<IconButtonProps, 'children'>`, so `variant`,
`color`, `size` pass through.

### Hooks

`useDisclosure(initial = false)` → `{ isOpen, open, close, toggle }`. Model new hooks on this:
small, typed return interface, `useCallback`-stable handlers.

---

## 8. Conventions (hard rules)

- **Title Case** all visible UI text and demo labels (`Save`, `Full Width`, not `save`).
- **Default font weight is `regular` (400).** Only `h1`–`h4` use `bold` (600). Don't bold body text.
- **Tokens over literals.** Every color/size/radius/space/shadow/z/duration in CSS must be a
  `--tz-*` token. Hardcoded values are only allowed inside `theme.css` (the token definitions
  themselves) and the contrast constants in `applyTheme.ts`.
- **English JSDoc** on every exported component and every public prop. Keep it short and describe
  behavior + default.
- **Accessibility is part of the component**, not an afterthought: `aria-busy` while loading,
  `aria-label` for icon-only controls, `role`/`aria-checked` for toggles, `aria-hidden` for
  decorative icons, `role="status"` for the loader.
- **Stay dependency-light** (see §1). New runtime deps need a strong justification.

---

## 9. Icons pipeline

- Icons are an Iconsax-derived set, ~1195 entries. The committed source of truth is
  `src/icons/icons.ts` (inline SVG strings) + `src/icons/names.ts` (the `IconName` union). Raw
  `.svg` files are **not** kept in the repo.
- To change the set: drop the raw Iconsax dump into `icons-raw/` (gitignored), run
  `npm run build:icons`, commit the regenerated `icons.ts` + `names.ts`, then clear `icons-raw/`.
- The generator strips `width`/`height` (size comes from `<Icon>`), drops no-op clipPaths, and
  normalizes every color to `currentColor`. Names are PascalCase; numeric suffixes resolve clashes.

---

## 10. Build, scripts & publishing

| script               | does                                                            |
| -------------------- | --------------------------------------------------------------- |
| `npm run playground` | `vite` dev server for `playground/main.tsx`                     |
| `npm run dev`        | `vite build --watch` (library watch build)                      |
| `npm run build`      | lib build + types + CSS assembly (see below)                    |
| `npm run build:icons`| regenerate the icon registry                                    |
| `npm run typecheck`  | `tsc --noEmit`                                                   |

- **Output:** Vite library mode, entry `src/index.ts`. Emits ESM `dist/index.js` and CJS
  `dist/index.cjs`. `react`, `react-dom`, and `clsx` are **externalized** (peer deps).
- **Types:** `tsconfig.build.json` (src only) emits `dist/index.d.ts`.
- **CSS:** `cssCodeSplit: false` → one `dist/index.css`. The build concatenates
  `theme.css + general.css + index.css` into `dist/index.css`, and copies `reset.css` separately.
  `sideEffects: ["**/*.css"]` keeps tree-shaking safe.
- **Published files:** only `dist`.
- **Consumers** import the components from the package root and the stylesheets once at app entry
  (`reset.css`, then theme/general — bundled into `dist/index.css` on publish).

### TypeScript configs

- `tsconfig.json` — editor/dev config, `noEmit`, includes **`src` + `playground`** (so the demo is
  type-checked and ambient `*.css` decls resolve there).
- `tsconfig.build.json` — emit-only, **`src`** alone (playground never ships in the public types).
- `src/css-modules.d.ts` declares both `*.module.css` (typed class map) and bare `*.css`
  (side-effect imports).

---

## 11. Checklist — adding a new component

1. `src/components/<Name>/` with `<Name>.tsx`, `<Name>.module.css`, `index.ts`.
2. Follow the anatomy in §6: `forwardRef`, props `extends Omit<…HTMLAttributes, 'color'>`,
   inline defaults, `clsx`, CSS-var inline style, `{...props}` last.
3. Reuse the standard prop vocabulary (§6) and the `sm/md/lg` size scale. For tintable controls,
   use the `--tz-btn-rgb` / `--tz-btn-on` pattern and the 4 standard variants.
4. Style only with `--tz-*` tokens; transitions use `var(--tz-duration)`.
5. Add English JSDoc to the component and every prop. Add accessibility attributes.
6. Export via the component `index.ts` and add `export * from './<Name>'` to
   `src/components/index.ts`.
7. Add a section to `playground/main.tsx` exercising variants × colors × sizes × states.
8. `npm run typecheck` must pass. Verify visually in the playground (light **and** dark mode).
