# sava-test (`@techzy/ui`) — Usage Guide for Consuming Apps

> Copy this file into the **root of the consuming admin-panel project** as `CLAUDE.md` so the
> assistant knows how to use the library. This is the _consumer_ guide (how to USE the package) —
> it intentionally omits the library's own build/maintenance internals.

The package is a reusable React component library (currently published as **`sava-test`**; the real
name is `@techzy/ui`). Stack on the consumer side: React 18+ and TypeScript.

> **How to use this doc:** it's the conceptual map. For exact prop names, types and defaults, rely on
> the package's **shipped TypeScript types** (autocomplete + JSDoc on every prop) — they're
> authoritative and always match the installed version. This file is a snapshot: after upgrading
> (`npm i sava-test@latest`), re-copy it from the library so it doesn't drift. If the package was
> installed under a different name than `sava-test`, import from that name instead.

### Import paths

Imports are grouped by **subpath** (the root `'sava-test'` still re-exports everything, if you prefer
one import):

| subpath                                               | what's in it                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `sava-test/components`                                | every UI component — `Button`, `TextField`, …, `Form`, `RootLayout`, `Sidebar`, `Breadcrumbs`, `FirstRouteRedirect` |
| `sava-test/components/<Name>`                         | a single component, e.g. `import Button from 'sava-test/components/Button'` (default **or** named)                  |
| `sava-test/hooks`                                     | `useForm`, `useDisclosure`, `useLockBodyScroll`, `useAccessKeys`                                                    |
| `sava-test/theme`                                     | `ThemeProvider`, `useTheme`, `applyTheme` + theme types                                                             |
| `sava-test/icons`                                     | `Icon`, `IconName`, `ICON_NAMES`, the raw `icons` registry                                                          |
| `sava-test/helpers`                                   | `setAccessKeys`, `getAccessKeys`, `hasAccess` (RBAC)                                                                |
| `sava-test/css/reset.css`, `sava-test/css/styles.css` | the two stylesheets                                                                                                 |

> Subpath imports need TypeScript `moduleResolution: "bundler"` (or `"node16"`/`"nodenext"`) — the
> default in Vite/Next/CRA5 setups. On an older `"node"` resolution, import everything from the root
> `'sava-test'` instead (works everywhere). Both ESM and CommonJS builds ship, so the bundler/runtime
> doesn't matter.

---

## 1. Install

```bash
npm i sava-test
# peer deps (the app provides these):
#   react >=18, react-dom >=18
# zod is an OPTIONAL peer — only needed if you use the form layer (useForm / <Form>):
npm i zod
# dayjs is an OPTIONAL peer — only needed if you use the date components (DatePicker, …):
npm i dayjs
```

## 2. One-time setup (app entry, e.g. main.tsx)

Import the stylesheets **once**, then wrap the app in `ThemeProvider`:

```tsx
import 'sava-test/css/reset.css' // global reset
import 'sava-test/css/styles.css' // design tokens + base styles
import { ThemeProvider } from 'sava-test/theme'

// The library ships a complete Techzy theme (light + dark). Override any subset — or omit `config`
// entirely to use the defaults.
const theme = {
  mode: 'light' as const,
  colors: {
    light: { primary: '#13404e', secondary: '#f4f9f8' }, // override any subset; the rest use defaults
    dark: { secondary: '#04202b' }, // partial dark overrides; the lib fills the rest
  },
}

createRoot(el).render(
  // …or simply <ThemeProvider><App /></ThemeProvider> for the built-in theme
  <ThemeProvider config={theme}>
    <App />
  </ThemeProvider>,
)
```

## 3. Theming

- **10 brand colors** (`ThemeColor`): `primary secondary background dark medium light success error info warning`.
- `background` is the **page canvas** (body, shell, sidebar, header, `PageLayout`); the elevated
  surfaces on top of it (cards, inputs, dropdowns) use `secondary`. Defaults to white in light mode
  and a deep dark in dark mode; override it per mode like any color.
- **Built-in defaults live in the library** (`DEFAULT_LIGHT_COLORS` + `DEFAULT_DARK_COLORS`), so the
  theme works with **no config**. `ThemeConfig` is all-optional:
  `{ colors?: { light?: Partial<ThemePalette>; dark?: Partial<ThemePalette> }; mode?: 'light' | 'dark' }`
  — pass only the colors you want to change.
- Merge order: light = `defaults → your light`; dark = `merged light → library dark defaults → your dark`.
- `useTheme()` → `{ mode, setMode, toggleMode }` (must be inside `ThemeProvider`).
- `<ThemeToggle />` / `<FullscreenToggle />` — ready-made light/dark and browser-fullscreen switch buttons.
- **Always pass a color by token name** via the `color` prop (`color="error"`); never hardcode hex.
- Sizes everywhere are `sm | md | lg` (default `md`).

## 4. Components (all from `'sava-test/components'`)

**Button** — `variant` (`contained` default · `filled` · `outlined` · `text`) · `color` · `size` ·
`loading` (spinner replaces `startIcon`, else trails the label on the right) · `disabled` ·
`fullWidth` · `rounded` · `startIcon` · `endIcon`.

**IconButton** — square icon button. Same `variant`/`color`/`size`, plus `loading`, `rounded`,
`disabled`, `nonClickable` (non-interactive but normal look). **Requires `aria-label`.** Child = an `<Icon />`.

**Icon** — `name: IconName` (required, ~1195 Iconsax names, PascalCase) · `color?` · `size` (16/20/24px).
Inherits text color unless `color` is set.

**Loader** — circular spinner. `size` (16/20/24) · `color?`. Inherits text color.

**Typography** — `variant` (`h1 h2 h3 h4 subtitle body bodySmall caption uppercase`, default `body`) ·
`as?` (override the tag) · `color?: ThemeColor | 'text' | 'muted'` · `align` · `truncate`. Headings are bold.

**TextField** — labeled text input. `label` · `size` · `error` + `helperText` (red state) · `required` ·
`fullWidth` (**default true**) · `disabled` · `adornment` + `adornmentPosition` (`left`/`right`) — a
**string** renders as a muted prefix/suffix (e.g. `"https://"`), a **node** as an icon
(`onAdornmentClick` makes it a clickable button) · `regex` (allow-filter, e.g. `/^\d*$/`) · `mask`
(`9` digit · `a` letter · `*` alphanumeric · others literal, e.g. `"(999) 999-9999"`). `type="password"`
auto-adds a show/hide toggle. Controlled (`value`+`onChange`) or uncontrolled (`defaultValue`).

**MultilineTextField** — the `<textarea>` sibling of `TextField` with a **dynamic, auto-growing
height**. Same `label` · `size` · `error` + `helperText` · `required` · `fullWidth` (**default true**) ·
`disabled` · `value`/`defaultValue` · `onChange` + `<Form>` binding by `name` (string value). Grows from
`minRows` (**default 3**) up to `maxRows` (**default 6**; `Infinity` for unbounded), then scrolls. No
adornment/mask/password (those are input-only). `<MultilineTextField label="Bio" minRows={3} maxRows={8} name="bio" />`.

**TagsField** — a tags/token input. Type + **Enter** / the **+ button** / the `separator` key adds a tag;
a chip's delete button (or **Backspace** on the empty input) removes one. `label` · `size` · `error` +
`helperText` · `required` · `fullWidth` (**default true**) · `disabled` · `color` (chip tint, default `primary`) ·
`separator` (**default `,`** — also splits pasted text & joins a string value) · `allowDuplicates` ·
`placeholder`. **`value`/`defaultValue` accept a `string[]` or a `separator`-joined `string`** (e.g.
`"react;typescript"`) and `onChange` **mirrors that shape**; binds to `<Form>` by `name` (validate with
`z.array(z.string()).min(1)` or `z.string()`). `<TagsField label="Skills" separator=";" name="skills" />`.

**NumberField** — numeric input with `+`/`−` steppers. `min` (**default 0**) · `max` · `step` (default 1) ·
`value`/`defaultValue` (`number | null`) · `onChange(number|null)` · `hideStepper` · `thousandSeparator`
(live grouping, e.g. `"."` → `32.345.345`). `fullWidth` defaults true.

**ColorPicker** — a color field with a popover picker (saturation/value square + hue slider + **alpha
(opacity) slider** + color input + quick-pick `swatches`), with **`rgb()`/`rgba()`** support.
`label` · `size` · `error` + `helperText` · `required` · `disabled` · `value`/`defaultValue` ·
`onChange(color)` · `swatches` · `placeholder`. The input accepts hex (`#rgb`/`#rrggbb`/`#rrggbbaa`) or
`rgb()`/`rgba()`; the **value is `#rrggbb` when opaque, `rgba(r, g, b, a)` when translucent**. Binds to
`<Form>` by `name` (validate with `z.string().regex(/^#[0-9a-f]{6}$/i, '…')`, or a looser pattern if
you allow `rgba()`). `<ColorPicker label="Brand color" name="brandColor" />`.

**Select** — a single-select dropdown. Data-driven `options: { value, label, disabled?, icon? }[]`.
`label` · `size` · `error` + `helperText` · `required` · `fullWidth` (**default true**) · `disabled` ·
`value`/`defaultValue` · `onChange(value)` · `placeholder` (default `"Select…"`) · `searchable` (filter
box) · `clearable` (× to reset, **on by default**) · `searchPlaceholder` · `noOptionsText` (string, or `(query) => node` to
vary the empty message — e.g. "Type to search" vs "No results"). **Server-side search:** pass
`onSearchChange(query)` (fires per keystroke, **turns off local filtering** — you own `options`) +
`loading` (shows a spinner) + `loadingText`. Full keyboard + ARIA (`listbox`/`option`, type-ahead);
popover behaves like `Dropdown` (portal, flip, scroll-lock, matches trigger width). Binds to `<Form>` by
`name` (value = the option's `value`; validate with `z.string().min(1, '…')`).
`<Select label="Country" name="country" searchable options={countries} />`.

**MultiSelect** — the multi-value sibling of `Select` (**value is a `string[]`**). Same `options` shape +
`label` · `size` · `error` + `helperText` · `required` · `fullWidth` · `disabled` · `searchable` ·
`clearable` (clears all, **on by default**) · `placeholder` · `color` (chip tint, default `primary`). Selecting **toggles** an option and keeps
the menu open; chosen options show as deletable chips in the trigger; **Backspace** pops the last.
`value`/`defaultValue: string[]` · `onChange(values)`. Also supports server-side search via
`onSearchChange` + `loading` (like Select). Binds to `<Form>` by `name` (validate with
`z.array(z.string()).min(1, '…')`). `<MultiSelect label="Skills" name="skills" searchable options={skills} />`.

**DatePicker** — a date field with a **typed masked input + calendar popover** (needs the `dayjs` peer).
`label` · `size` · `error` + `helperText` · `required` · `fullWidth` · `disabled` · `value`/`defaultValue`
· `onChange` · `format` (default `'DD/MM/YYYY'`, drives the mask) · `valueFormat` · `placeholder` · `min` · `max` ·
`disabledDate` (`(iso) => boolean`) · `weekStartsOn` (0–6, default `1`) · `clearable` (**on by default**).
Calendar math is **UTC** (no timezone drift); full keyboard nav, **circular day cells**, separate
**month** + **year** pickers (the year list scrolls), and a focus-trapped popover. **Value contract —
`valueFormat`** (dayjs tokens, default the ISO datetime `'YYYY-MM-DDTHH:mm:ss'`): incoming values are
parsed **leniently** (so a backend datetime like `'2026-06-10T09:35:49.6134342'` is accepted) and
`onChange` emits in exactly `valueFormat` at the **start of the UTC day** (pass `'YYYY-MM-DD'` for a
plain date). A .NET `DateTime` field just works out of the box (the default already emits
`'2026-06-10T00:00:00'`); pass `valueFormat="YYYY-MM-DD"` when you only want a date.
Binds to `<Form>` by `name` (validate with `z.string().min(1, '…')`).
`<DatePicker label="Birth date" name="birthDate" max="2010-01-01" />`.

**DateTimePicker** — the **date + time sibling** of `DatePicker` (needs the `dayjs` peer). Same field API
(`label` · `size` · `error` + `helperText` · `required` · `fullWidth` · `disabled` · `min`/`max` ·
`disabledDate` · `weekStartsOn` · `clearable` · `<Form>` binding by `name`) and the same `valueFormat`
contract (default UTC ISO datetime `'YYYY-MM-DDTHH:mm:ss[Z]'` — the `Z` marks UTC — or no-`Z` when `utc={false}`; lenient input) — but the time is
meaningful, so `onChange` emits the **chosen instant** (not start-of-day). **"Store UTC, show local":** the
value is always **UTC**, but the field **displays & edits in the viewer's local timezone** (a backend
`'2026-06-10T09:35:00'` shows as `13:35` in UTC+4; editing emits UTC). Pass **`utc={false}`** to disable
this — no conversion, the field shows and emits the exact wall-clock you pick. The popover splits date and
time into **two tabs** — a **Date** tab (calendar) and a **Time** tab (scrollable hours/minutes/seconds
columns) — and opens on the Date tab. Time props: `hour12` (1–12 + AM/PM vs 24-hour) ·
`minuteStep` (default `1`) · `showSeconds` (**default `true`** — pass `false` to hide seconds). Display
`format` defaults to `'DD/MM/YYYY HH:mm:ss'` (→ `hh:mm:ss A` for `hour12`). Picking a
day keeps the time and vice-versa; the popover stays open until you click away, press Escape, or hit Done.
`<DateTimePicker label="Starts at" name="startsAt" minuteStep={15} />`.

**TimePicker** — the **time-only sibling** (needs the `dayjs` peer): a typed masked time input + a popover
of scrollable time columns (hours/minutes/seconds; no calendar; `Clock` icon). Same field API + the time
props `hour12` · `minuteStep` · `showSeconds` (**default `true`** — pass `false` to hide seconds) ·
`clearable` · `<Form>` binding by `name`. **Value contract —
`valueFormat`** (default the UTC time-of-day `'HH:mm:ss[Z]'`, or `'HH:mm:ss'` when `utc={false}`): incoming values are parsed leniently (a backend
time like `'09:35:49.6134342'` is accepted) and `onChange` emits the chosen time in that format — only
the time-of-day matters. Like `DateTimePicker` it's **"store UTC, show local"** (value UTC, displayed/edited
in the viewer's local timezone) with the same **`utc={false}`** opt-out. Display `format` defaults to `'HH:mm:ss'` (→ `hh:mm:ss A`
for `hour12`). `<TimePicker label="Start time" name="startTime" minuteStep={5} />`. _(`DateRangePicker` /
`DateTimeRangePicker` coming next.)_

**Checkbox** — `label` · `color` (checked fill) · `size` · `checked`/`defaultChecked` ·
`onChange(boolean)` · `error` (reddens the box only, no helper text) · `required` · `disabled`.

**Radio / RadioGroup** — single-select radios. Use **`RadioGroup`**: `value`/`defaultValue` (`string`)
· `onChange(value)` · `name` · `options` (`{ value, label?, disabled? }[]`) **or** `<Radio>` children ·
`orientation` (`vertical` / `horizontal`) · `label` · `error` (reddens rings, no message) · `required` ·
`size` · `color` · `disabled`. Binds to `<Form>` by `name` (value = `string`). `<Radio value label color size />`
also works standalone.
`<RadioGroup name="plan" options={[{ value: 'pro', label: 'Pro' }]} />`.

**Switch** — a toggle (on/off), the sibling of `Checkbox`. `label` · `color` (on fill) · `size` ·
`checked`/`defaultChecked` · `onChange(boolean)` · `error` (reddens the track, no text) · `required` ·
`disabled`. Binds to `<Form>` by `name` (value = `boolean`).

**ThemeToggle** — wraps `IconButton`; flips the theme mode. Pass-through `variant`/`color`/`size`.

**FullscreenToggle** — wraps `IconButton`; toggles the browser **Fullscreen API** (maximize / exit)
and flips its icon 180° to match. Auto-hides where the API is unavailable (e.g. iPhone). Same
pass-through props as `ThemeToggle`.

**Badge** — wraps a child (e.g. a `Button`/`IconButton`) and pins a count or dot to its corner:
`<Badge content={2}><IconButton …/></Badge>`. `content` (`number | string`) → a count (numbers cap to
`${max}+`, `max` default 99; a `0` hides unless `showZero`); `dot` → a plain indicator. `color`
(default `medium`), `placement` (`top-right` default · `top-left` · `bottom-right` · `bottom-left`).

**Card** — a surface card. `title` (clamps to two lines, then ellipsis) · `subtitle` (muted line under
the title) · `icon` (`IconName`/node, shown in a filled icon box) · `color` (tints the icon box,
default `medium`) · `actions` (header, right) ·
`footer` (bottom actions, right) · `footerStart` (bottom actions, left) · `children` (body) ·
`collapsible` (chevron folds the body+footer smoothly;
header actions hide while collapsed) · `collapsed`/`defaultCollapsed`/`onCollapsedChange`. A subtle
divider separates the header from the body while expanded.
`<Card icon="Setting2" title="Settings" color="success" collapsible footer={<Button>Save</Button>}>…</Card>`.

**Tooltip** — wraps a single element and shows a floating label on hover/focus:
`<Tooltip content="Save"><IconButton …/></Tooltip>`. `content: ReactNode`, `placement`
(`top` default · `bottom` · `left` · `right`). Closes on `Escape`; a11y-wired via `aria-describedby`.

**Avatar** — `src` (image, auto-fallback on error) · `icon` (`IconName`/node) · `children` (e.g.
`"D.S."`) · `name` (auto-initials `"David Savaneli"` → `"DS"`, also the accessible name) · `size`
(`sm`/`md`/`lg`) · `shape` (`circle`/`square`) · `color`. **AvatarGroup** — overlaps `Avatar`s and
collapses overflow past `max` into `+N`: `<AvatarGroup max={3}>…</AvatarGroup>`. `size`/`color` apply
to the whole group.

**Divider** — a separator line. `<Divider />` (plain) · `<Divider orientation="vertical" />` · or pass
a title for a labeled divider with `align` (`left` · `center` default · `right`):
`<Divider align="left">Section</Divider>`.

**Chip** — a compact tag. `variant` (`contained` · `filled` default · `outlined` · `text`) · `color`
(default `primary`) · `size` · `clickable` (interactive; off by default) · `disabled` · `startIcon` **or** `avatar` ·
`onDelete` (adds a delete ✕). `<Chip avatar={<Avatar name="David Savaneli" />} onDelete={remove}>David</Chip>`.

**List / ListItem** — a reusable row + its container. **`ListItem`**: `icon` (`IconName`/node) · label
(`children`) · `description` (muted second line) · `trailing` (right slot) · `selected` · `clickable`
(hover + keyboard) · `disabled` · `size` (`sm`/`md`/`lg`) · `color` (selected tint) · `as` (`'a'`/
`'button'`/router `Link`; anchor `href`/`target`/`rel` typed). **`List`**: a vertical stack with `gap`
(default `2px`) / `padding` / `role` (default `list`; set `"menu"` for a dropdown) / `size` (a default
for all its items). Standalone, in a dropdown panel, or in the sidebar.
`<List role="menu"><ListItem icon="Setting2" clickable selected>Settings</ListItem></List>`.

**Dropdown** — a floating menu anchored to a `trigger`, with `ListItem`s as children. `placement`
(`bottom-start` default · `bottom-end` · `top-start` · `top-end`) — auto-**flips** and stays on-screen,
and re-positions on scroll/resize (a tall menu caps its height + scrolls). Opens on click; closes on
outside click, `Escape`, or selecting an item (`closeOnSelect`, default true); locks page scroll while
open. `size` (`sm`/`md`/`lg`) sets the panel min-width (150 / 190 / 220) + item density;
**`minWidth={false}`** drops that min-width so the menu hugs its content. Also: `open` /
`defaultOpen` / `onOpenChange` · `matchTriggerWidth` (select-like) · `disabled` · `offset`.
`<Dropdown trigger={<Button>Menu</Button>}><ListItem icon="User" clickable>Profile</ListItem></Dropdown>`.

**Tabs** — a data-driven tab strip (+ optional panels). `items: { value, label?, ariaLabel?, icon?,
disabled?, error?, dot?, badge?, content? }[]` · `value`/`defaultValue` + `onChange(value)`. **`queryKey`**
syncs the active tab to the URL query (`?<queryKey>=…`, your param name) via the native History API, so a
**refresh restores the tab** (works standalone or inside any router; omit for state-only). By default tab
changes **replace** the URL (Back doesn't step through tabs); pass **`pushHistory`** to make Back navigate
tabs. Per-tab `icon` / `disabled` / `error` (red tint) / `badge` (a trailing count pill, caps at `99+`) /
`dot` (a corner dot) / `ariaLabel` (for icon-only tabs). `variant` (`underline` default · `pill`) · `size`
· `color` · `orientation` (`horizontal` · `vertical`) · `fullWidth` · `autoFocus` (focus the active tab on
mount — handy inside a popover). The strip **scrolls horizontally**
(scrollbar hidden) when the tabs overflow, keeping the active tab in view. Full keyboard nav (Arrows /
Home / End) + `role="tablist"`/`tab`/`tabpanel` a11y (name the tablist with `aria-label`); items with
`content` render the active panel.
`<Tabs queryKey="tab" items={[{ value: 'general', label: 'General', icon: 'Setting2' }, …]} />`.

**Row / Col / Flex** — flexbox layout via props (no inline `style`). `gap` · `align` · `justify` ·
`wrap` · `padding` · `grow` · `inline`. `gap`/`padding` accept a token key (`"md"`), a px number, or any
CSS string. `Row` = centered horizontal, `Col` = vertical, `Flex` = the general one (`direction`).
`<Row gap="md" justify="between"><Button>Save</Button></Row>`.

**Grid** — CSS-grid layout: `cols` (fixed count) or `minItemWidth` (responsive — auto-fits columns and
wraps to one when narrow), plus `gap`/`align`/`padding`. Great for forms side-by-side:
`<Grid minItemWidth={220} gap={16}><TextField …/><TextField …/></Grid>`.

**Hooks** — `useDisclosure(initial?)` → `{ isOpen, open, close, toggle }` · `useLockBodyScroll(locked)`
(freeze page scroll while `locked` — for menus/modals/drawers).

## 5. Forms (Zod-powered) — the easy way

```tsx
import { z } from 'zod'
import { Form, TextField, NumberField, Checkbox, Button } from 'sava-test/components'
import { useForm } from 'sava-test/hooks'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
  quantity: z.number().min(1, 'At least 1').nullable(),
  acceptTerms: z.boolean().refine((v) => v, 'You must accept'),
})

function SignIn() {
  const form = useForm({
    schema,
    defaultValues: { email: '', password: '', quantity: null, acceptTerms: false },
    onSubmit: (values, { reset }) => {
      // values is the parsed, validated object
      save(values)
      reset() // optional: clear the form on success
    },
    // mode?: 'blurThenLive' (default) | 'change' | 'submit'
  })

  return (
    <Form form={form}>
      <TextField name="email" label="Email" />
      <TextField name="password" type="password" label="Password" />
      <NumberField name="quantity" label="Quantity" min={0} max={10} />
      <Checkbox name="acceptTerms" label="I accept the terms" />
      <Button type="submit" loading={form.isSubmitting}>
        Sign In
      </Button>
    </Form>
  )
}
```

- Wrap fields in **`<Form form={form}>`** and give each a **`name`** matching a schema key — value,
  `onChange`, `onBlur`, `error` and `helperText` are wired automatically. (Or spread
  `{...form.field('email')}` onto a field manually.)
- `handleSubmit` validates the whole form and calls `onSubmit(parsedValues, { reset, setValue, setValues })`
  only when valid. `useForm` also returns `values`, `errors`, `isValid`, `isSubmitted`, `isSubmitting`, `reset`.
- **Scroll-to-error:** on a failed submit the form smooth-scrolls to and focuses the **topmost** invalid
  field automatically (the first red one on the page). Opt out with `useForm({ …, scrollToError: false })`.
- Errors show after blur (then live), per `mode`. Field form-values are real types: number for
  `NumberField`, boolean for `Checkbox`. For a nullable/optional number, type the schema field with
  `.nullable()` and annotate any `required` refine as `(v): boolean => v !== null` (TS infers a
  type-predicate otherwise and breaks the `null` default).

## 6. Admin shell + auto-generated sidebar (TanStack Router)

For apps on **TanStack Router** (file-based routing), the library ships the whole shell. Install the
peer: `npm i @tanstack/react-router` (>=1).

> **Migration — the `RootLayout` API changed (breaking).** The old `brand` / `headerStart` /
> `headerEnd` props are gone. Update call sites:
>
> - `brand={…}` → **`logo={…}`** (any node atop the sidebar)
> - `headerStart={…}` → **removed** — the header title now auto-derives from the active route's
>   `staticData.name`
> - `headerEnd={<ThemeToggle />}` (and a manual logout button) → **`header={{ theme: true, onLogout }}`**
>   — the theme toggle is built in (`theme`, default `true`) and the logout button appears when you
>   pass `onLogout`.

- **`RootLayout`** — `logo?`, `header?`, `children`. Set it as the **root route's** component and pass
  `<Outlet/>`. Renders sidebar + header + content. `logo` is any node shown atop the sidebar (an
  `<img>`, an `<Icon>`, …). The **header** holds only right-side controls via
  `header?: { theme?: boolean; fullscreen?: boolean; onLogout?: () => void; user?: { name?; email?; avatar? } }`
  — `theme` and `fullscreen` (both default `true`) show the `ThemeToggle` and `FullscreenToggle`;
  `onLogout` adds an account avatar whose menu has a **Sign
  out** item (calls `onLogout`); `user` adds a name+email header in that menu (avatar = a user icon, or `user.avatar` image). The content area auto-stacks
  **`Breadcrumbs` → the page title (the active route's `staticData.name`, as an `h2`) → your page**.
- **`PageLayout`** — the container your page body sits in (border + radius + padding); uses the page `background`, so cards/inputs inside read as elevated.
  Wrap each route's content: `<PageLayout>…</PageLayout>`. Extends `HTMLAttributes<HTMLDivElement>`,
  exported named **and** default from `sava-test/components` (and `sava-test/components/PageLayout`).
- **`Sidebar`** — auto-builds the menu from the routes' `staticData` (rendered inside `RootLayout`;
  you don't place it yourself).
- **`Breadcrumbs`** — auto-rendered above the page title. Starts with a home icon (links to the first
  allowed page) + a crumb per matched route with a `staticData.name`; the current page is plain text.
  `separator?: IconName | ReactNode` (default `"ArrowRight4"`) — an `IconName` renders as an icon, any
  other string as text. Also exported from `sava-test/components` if you want to place it yourself.
- **`FirstRouteRedirect`** — use as the `/` route's component; forwards to the first menu item.
- Each route self-registers via **`staticData`** (typed once you import from the package):
  `{ name?: string; icon?: IconName; order?: number; hidden?: boolean; roles?: string[] }`. No `name`
  → not in the menu. Segments infer structure: `/dashboard` → top link; `/components/forms/button` →
  module → group → page; an index route at a group path makes the group its own page. Module/group
  label+icon come from that folder's `route.tsx` `staticData`.
- **Dynamic / detail routes** (e.g. `/news/$newsId`) just work: leave them without a `name` (or set
  `hidden`) and they render normally but never appear in the sidebar; the page title + breadcrumb fall
  back to the nearest named ancestor (render your own heading in the page for a dynamic title).

### Role-based access (RBAC)

Gate pages by the user's `accessKeys` (e.g. from your backend `getUser` →
`response.accessKeys: string[]`). A page lists allowed keys in `staticData.roles`; **OR** semantics —
the user needs **any one** match. A page with no `roles` is public.

- **`setAccessKeys(keys)`** — feed the user's keys in once after login / app init; pass `[]` on logout.
  The menu **and** the `/` redirect immediately reflect the new roles (the sidebar re-renders live).
- **`hasAccess(roles?)`** — `true` if `roles` is omitted/empty or the user has any one. Works
  **outside React** (call it in a route `beforeLoad` guard for direct-URL protection).
- **`useAccessKeys()`** — reactive read of the current keys (re-renders on change); rarely needed
  directly. `getAccessKeys()` is the non-reactive read.

Forbidden pages just disappear from the menu (and empty groups/modules with them), and
`FirstRouteRedirect` lands on the first **allowed** page. If you never call `setAccessKeys`, every
`roles`-less page shows as normal.

```tsx
// after login / on app init:
import { setAccessKeys, hasAccess } from 'sava-test/helpers'
const { accessKeys } = (await getUser()).response
setAccessKeys(accessKeys) //   on logout: setAccessKeys([])

// a page declares who may see it:
export const Route = createFileRoute('/dashboard/')({
  staticData: {
    name: 'Dashboard',
    icon: 'Category',
    order: 0,
    roles: ['Analyst', 'SystemUserManager'],
  },
  // defense-in-depth for direct URLs (runs outside React → uses hasAccess, not the hook):
  beforeLoad: () => {
    if (!hasAccess(['Analyst', 'SystemUserManager'])) throw redirect({ to: '/' })
  },
  component: DashboardPage,
})
```

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { RootLayout, Icon } from 'sava-test/components'

function Shell() {
  const navigate = useNavigate()
  return (
    <RootLayout
      logo={<Icon name="Box" color="primary" size="lg" />}
      header={{
        theme: true, // show the ThemeToggle (default true)
        onLogout: () => {
          auth.logout()
          navigate({ to: '/login' })
        },
      }}
    >
      <Outlet />
    </RootLayout>
  )
}

export const Route = createRootRoute({ component: Shell })

// src/routes/index.tsx  →  the "/" route forwards to the first menu item
import { createFileRoute } from '@tanstack/react-router'
import { FirstRouteRedirect } from 'sava-test/components'
export const Route = createFileRoute('/')({ component: FirstRouteRedirect })

// any page registers itself in the menu and wraps its body in PageLayout:
import { PageLayout } from 'sava-test/components'
export const Route = createFileRoute('/dashboard/')({
  staticData: { name: 'Dashboard', icon: 'Category', order: 0 },
  // breadcrumbs + the "Dashboard" title render above automatically — the page only renders its body
  component: () => <PageLayout>…dashboard content…</PageLayout>,
})
// group chrome lives in the group's route.tsx:
//   createFileRoute('/components/forms')({ staticData: { name: 'Forms', icon: 'DocumentText', order: 0 } })
```

### Dynamic / CRUD pages (list → new → detail → edit)

Just add files — the list carries `staticData.name` (so it's in the menu); `new` / `$id` / `edit`
carry **no `name`**, so they route + render but stay off the sidebar. With file-based routing
`Link`/`navigate`/`useParams` are fully typed — no casts.

```
src/routes/users/
  index.tsx            →  /users               (list)   ← staticData.name "Users" → in the sidebar
  new.tsx              →  /users/new           (add)    ← no name → off the sidebar
  $userId/
    index.tsx          →  /users/$userId       (detail) ← no name → off the sidebar
    edit.tsx           →  /users/$userId/edit  (edit)   ← no name → off the sidebar
```

```tsx
// users/index.tsx — the only one with a name
export const Route = createFileRoute('/users/')({
  staticData: { name: 'Users', icon: 'People', order: 2 },
  component: () => (
    <PageLayout>
      …list with <Link to="/users/$userId" params={{ userId }} />…
    </PageLayout>
  ),
})

// users/$userId/index.tsx — dynamic detail; no `name`
export const Route = createFileRoute('/users/$userId/')({ component: UserDetail })
function UserDetail() {
  const { userId } = Route.useParams() // typed, no cast
  return <PageLayout>…</PageLayout>
}

// users/new.tsx + users/$userId/edit.tsx — one form, add vs. edit by presence of the param.
// breadcrumb + page title on these dynamic pages fall back to the nearest named ancestor ("Users").
```

> Gotcha: never name a leaf route file `loader.tsx` (reserved by the TanStack Router plugin) — use a
> `loader/index.tsx` folder instead.

## 7. Conventions for the app

- **Title Case** all visible UI text.
- Use the components' **`color` / `size` props and design tokens** — don't hardcode colors or sizes.
- `TextField` / `NumberField` are **full-width by default**; pass `fullWidth={false}` for natural width.
- Keep app/business state in the app; the library only provides UI + the `useForm` helper.
