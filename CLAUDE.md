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
  rule.) Today the only **bundled** runtime dep is `clsx`. Two **optional peer dependencies** are
  `external` (never bundled, used via the consumer's own instance): **`zod`** powers the form layer
  (`useForm`), and **`@tanstack/react-router`** (`>=1`) powers the admin shell (`RootLayout` /
  `Sidebar` / `FirstRouteRedirect`). Prefer React Context + hooks for internal state; reach for a
  dependency when it clearly earns its place.

---

## 2. Repository layout

```
src/
  components/             # every component (incl. the admin shell) — each its own folder
    <Name>/
      <Name>.tsx          # component (forwardRef + props interface)
      <Name>.module.css   # scoped styles (CSS Modules)
      index.ts            # barrel: re-export component + its types + `as default`
    RootLayout/           # admin shell (sidebar + header + content)
    Sidebar/              # auto-generated nav (Sidebar + FirstRouteRedirect + buildNavTree + nav hooks)
    Breadcrumbs/          # auto-generated breadcrumb trail (home → module → group → page)
    PageLayout/           # surface-card container a page's body sits in
    index.ts              # re-exports every component (UI + shell)
  theme/
    applyTheme.ts         # TechzyTheme type, hex→rgb, contrast logic, applyTheme()
    ThemeProvider.tsx     # ThemeProvider, useTheme, ThemeConfig, dark-mode merge
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
  icons/
    icons.ts              # generated inline-SVG registry (committed source of truth)
    names.ts              # generated IconName union + ICON_NAMES / ICON_COUNT (~1195 names)
  entries/                # curated public surfaces, one file per subpath export
    components.ts hooks.ts theme.ts icons.ts helpers.ts
  styles/
    reset.css             # global reset (consumer imports once)
    theme.css             # all --tz-* design tokens (consumer imports once)
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

Each brand color is stored as a **comma-separated RGB triplet** (not hex) so we can derive alpha
shades with `rgba()`:

```css
--tz-color-primary-rgb: 19, 64, 78; /* the triplet */
--tz-color-primary: rgb(var(--tz-color-primary-rgb)); /* solid convenience */
--tz-color-primary-shade100: rgba(var(--tz-color-primary-rgb), 0.06);
/* ...shade200..shade800 */
--tz-color-primary-contrast: #ffffff; /* readable text color on a solid fill */
```

**Brand palette (10 colors)** — light-mode defaults:

| token       | hex       | role                         |
| ----------- | --------- | ---------------------------- |
| `primary`   | `#13404e` | primary brand / default text |
| `secondary` | `#f4f9f8` | page background / surface    |
| `tertiary`  | `#5c7687` | muted accent                 |
| `dark`      | `#056472` | dark brand shade             |
| `medium`    | `#039aa1` | mid brand shade              |
| `light`     | `#adc3c9` | light brand shade            |
| `success`   | `#00a854` | semantic — success           |
| `error`     | `#f04134` | semantic — error/danger      |
| `info`      | `#039aa1` | semantic — info              |
| `warning`   | `#ffbf00` | semantic — warning           |

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

### 3.4 Radius & spacing (shared 4→48 scale)

`--tz-radius-*` and `--tz-space-*` use the **same** numeric steps:
`xxs 4 · xs 8 · sm 16 · md 24 · lg 32 · xl 40 · xxl 48` (px).
Spacing is one scale for margin, padding, and gap.

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

| prop           | type                                        | default       | notes                                                                                                                               |
| -------------- | ------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `variant`      | `'contained'\|'filled'\|'outlined'\|'text'` | `'contained'` | for tintable controls                                                                                                               |
| `color`        | `TechzyColor`                               | `'primary'`   | brand token; drives `--tz-btn-rgb`                                                                                                  |
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
(no icons) shows the spinner on the right. The text stays visible.

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

### Checkbox

A labeled checkbox. The native `<input type="checkbox">` is **visually hidden** (sr-only) but stays
focusable + announced; a styled `.box` shows the state, and the tick is a **CSS checkmark** (rotated
corner — no icon dependency). `label` · `color` (checked fill, default `primary`) · `size` (box +
label) · `error` + `helperText` · `required` · `disabled` · `checked`/`defaultChecked` ·
`onChange(checked)` (emits a `boolean`). Uses the `--tz-btn-rgb`/`--tz-btn-on` pattern: checked →
`background: rgb(var(--tz-btn-rgb))` with a contrast-colored tick; `:focus-visible` ring; `error`
reddens the box border. Like the other fields, a **`name`** prop binds it to a surrounding `<Form>` —
its form value is a **`boolean`** (validate with e.g. `z.boolean().refine((v) => v, 'Required')` for a
must-accept box). Own CSS module (`Checkbox.module.css`); helper renders via `Typography`.

### ThemeToggle

Wraps `IconButton` (default `variant="outlined"`). Shows `Icon name="Sun"` in light mode, `"Moon"`
in dark; flips `mode` via `useTheme().toggleMode` on click. `role="switch"`, `aria-checked`,
`aria-label="Toggle color theme"`. Props = `Omit<IconButtonProps, 'children'>`, so `variant`,
`color`, `size` pass through.

### Badge

A **wrapper** that pins a small count/dot to a child's corner — wrap a `Button`/`IconButton` (or any
node): `<Badge content={2}><IconButton…/></Badge>`. `content` (`number | string`) renders a count;
a `number` is capped to `${max}+` (`max` default `99`) and a numeric `0` is hidden unless `showZero`.
`dot` renders a plain indicator instead (decorative → `aria-hidden`); `content` wins over `dot`.
`color` (default `primary`) tints via the **`--tz-btn-rgb` / `--tz-btn-on`** pattern; `placement`
(`top-right` default · `top-left` · `bottom-right` · `bottom-left`) picks the corner. The badge has a
`box-shadow` ring in `--tz-color-background` so it reads as cut-out over the control. Own CSS module.

### Tooltip

A **wrapper** that shows a floating label on hover/focus of a single child element:
`<Tooltip content="Save"><IconButton…/></Tooltip>`. `content: ReactNode` (empty → renders just the
child); `placement` (`top` default · `bottom` · `left` · `right`) with a matching arrow. Opens on
`mouseenter`/`focus`, closes on `mouseleave`/`blur`/`Escape`; the child is cloned to get
`aria-describedby` while open, and the label is `role="tooltip"`. Fill is `--tz-color-primary` /
`-primary-contrast` (flips with the theme), `--tz-z-tooltip`, `--tz-shadow-md`, opacity/visibility
fade over `--tz-duration`. Takes a single `ReactElement` child (cloned for a11y). Own CSS module.

### Avatar / AvatarGroup

**Avatar** shows, in priority order: an image (`src` — falls back automatically on load error), an
`icon` (`IconName` or node), explicit `children` (e.g. initials `"D.S."`), initials derived from
`name` (`"David Savaneli"` → `"DS"`), else a default `User` icon. `size` (`sm` 32 · `md` 40 · `lg` 48),
`shape` (`circle` default · `square`), `color` (default `primary`, via `--tz-btn-rgb` / `--tz-btn-on`).
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
label `--tz-color-tertiary` / `font-size-sm` / medium. `role="separator"` (+ `aria-orientation` when
vertical); a label is ignored for vertical. Own CSS module.

### Hooks

`useDisclosure(initial = false)` → `{ isOpen, open, close, toggle }`. Model new hooks on this:
small, typed return interface, `useCallback`-stable handlers.

### Form — `useForm` (Zod-powered)

A small form helper (`src/form/`) — the in-library alternative to bundling Formik in every app.
`useForm({ schema, defaultValues, onSubmit?, mode? })` where `schema` is a **Zod** object schema
(field names = its top-level keys) and `defaultValues` is the controlled source of truth. `zod` is an
**optional peer dep** — only needed when you use `useForm`; values/types are inferred from the schema
via `z.infer`.

Returns `{ values, errors, touched, isValid, isSubmitted, isSubmitting, field, setValue, setValues, reset, handleSubmit }`
(the `FormApi` type). `handleSubmit` validates the whole form and calls `onSubmit` with the
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
by **`@tanstack/react-router`** (optional peer, `>=1`, `external` in the build). `RootLayout({ logo?, header?, children })` renders a left sidebar (`logo` +
`<Sidebar/>`), a top header, and a content container; set it as the **root route's** component and
pass `<Outlet/>` as `children`. The **header** holds only the right-side controls driven by the
`header` config — `header?: { theme?: boolean /* default true */; onLogout?: () => void }` (a
`ThemeToggle`, on by default, plus a logout `IconButton` that appears when `onLogout` is given). The
content area stacks **`Breadcrumbs` → the page title (the active route's `staticData.name`, via the
internal `usePageTitle()`, as an `h2`) → `children`** — pages wrap their own body in **`PageLayout`**.
**`Sidebar`** auto-builds a 3-level menu (module → group → page) by
walking `useRouter().looseRoutesById` and reading each route's `fullPath` + `staticData` — no manual
menu config. **`FirstRouteRedirect`** (for the `/` route) forwards to the first menu item. **`PageLayout`**
is a plain surface-card container (`border` + `radius` + `padding`, token-only) for a page's content;
it extends `HTMLAttributes<HTMLDivElement>` and ships named **and** default from
`sava-test/components/PageLayout`.

Routes self-register via TanStack `staticData`, which the library augments (typed for consumers):
`{ name?: string; icon?: IconName; order?: number; hidden?: boolean; roles?: string[] }` — a route
with **no `name`** never appears; `hidden` keeps it routed but off the menu; `order` sorts (asc, then
alphabetical); `roles` gates it by access (see RBAC below).
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

**Breadcrumbs.** `RootLayout` auto-renders `<Breadcrumbs/>` at the top of the content area, so apps
get a trail for free. It's built from the active match chain via `useBreadcrumbs()` — one crumb per
matched route that declares a `staticData.name` (module → group → page). It always opens with a home
icon linking to the first allowed menu page (same target as `FirstRouteRedirect`). Intermediate crumbs
link only when they map to a real navigable menu page (reusing the access-filtered nav tree, so
forbidden/non-page ancestors render as plain text); the current page is always plain text
(`aria-current="page"`). Renders nothing when the route has no named matches. The `Breadcrumbs`
component is also exported from `sava-test/components` if an app wants the trail elsewhere (the
`useBreadcrumbs` hook stays internal). **`separator?: IconName | ReactNode`** (default `"/"`): a known
`IconName` (e.g. `"ArrowRight4"`) renders as an `<Icon>`, any other string as text, or pass a node.
Every crumb shares one color (`--tz-color-tertiary`); links darken to `--tz-color-text` and underline
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
// app: src/routes/__root.tsx — logo in the sidebar; header shows the page title + theme toggle + logout
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

- Icons are an Iconsax-derived set, ~1195 entries. The committed source of truth is
  `src/icons/icons.ts` (inline SVG strings) + `src/icons/names.ts` (the `IconName` union). Raw
  `.svg` files are **not** kept in the repo.
- To change the set: drop the raw Iconsax dump into `icons-raw/` (gitignored), run
  `npm run build:icons`, commit the regenerated `icons.ts` + `names.ts`, then clear `icons-raw/`.
- The generator strips `width`/`height` (size comes from `<Icon>`), drops no-op clipPaths, and
  normalizes every color to `currentColor`. Names are PascalCase; numeric suffixes resolve clashes.

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

| subpath                               | source entry                          | what's in it                                  |
| ------------------------------------- | ------------------------------------- | --------------------------------------------- |
| `.` (root)                            | `src/index.ts`                        | everything (back-compat / classic resolution) |
| `./components`                        | `src/entries/components.ts`           | every component + shell + `Form`              |
| `./components/*`                      | each `src/components/<Name>/index.ts` | one component (named **and** `default`)       |
| `./hooks`                             | `src/entries/hooks.ts`                | `useDisclosure`, `useForm`, `useAccessKeys`   |
| `./theme`                             | `src/entries/theme.ts`                | `ThemeProvider`, `useTheme`, `applyTheme`     |
| `./icons`                             | `src/entries/icons.ts`                | `Icon`, `IconName`, `ICON_NAMES`, `icons`     |
| `./helpers`                           | `src/entries/helpers.ts`              | `setAccessKeys`, `getAccessKeys`, `hasAccess` |
| `./css/reset.css`, `./css/styles.css` | —                                     | the two stylesheets                           |

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
    `ThemeProvider` (dark-merge order, localStorage persistence, `useTheme` throwing outside a provider).
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
7. Add a section to `playground/main.tsx` exercising variants × colors × sizes × states.
8. Add a co-located `<Name>.test.tsx` covering behavior + a11y contracts (see §11).
9. `npm run typecheck`, `npm test`, **and** `npm run lint:pkg` must pass. Verify visually in the
   playground (light **and** dark mode).
