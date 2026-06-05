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
| `sava-test/hooks`                                     | `useForm`, `useDisclosure`, `useAccessKeys`                                                                         |
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
```

## 2. One-time setup (app entry, e.g. main.tsx)

Import the stylesheets **once**, then wrap the app in `ThemeProvider`:

```tsx
import 'sava-test/css/reset.css' // global reset
import 'sava-test/css/styles.css' // design tokens + base styles
import { ThemeProvider } from 'sava-test/theme'

const theme = {
  mode: 'light' as const,
  colors: {
    light: {
      primary: '#13404e',
      secondary: '#f4f9f8',
      tertiary: '#5c7687',
      dark: '#056472',
      medium: '#039aa1',
      light: '#adc3c9',
      success: '#00a854',
      error: '#f04134',
      info: '#039aa1',
      warning: '#ffbf00',
    },
    dark: { secondary: '#04202b' }, // partial dark overrides; the lib fills sensible dark defaults
  },
}

createRoot(el).render(
  <ThemeProvider config={theme}>
    <App />
  </ThemeProvider>,
)
```

## 3. Theming

- **10 brand colors** (`TechzyColor`): `primary secondary tertiary dark medium light success error info warning`.
- `ThemeConfig`: `{ colors: { light: TechzyTheme; dark?: Partial<TechzyTheme> }; mode?: 'light' | 'dark' }`.
  Dark mode merges: app's light palette → library dark defaults → your `dark` overrides.
- `useTheme()` → `{ mode, setMode, toggleMode }` (must be inside `ThemeProvider`).
- `<ThemeToggle />` — a ready-made light/dark switch button.
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
`as?` (override the tag) · `color?: TechzyColor | 'text'` · `align` · `truncate`. Headings are bold.

**TextField** — labeled text input. `label` · `size` · `error` + `helperText` (red state) · `required` ·
`fullWidth` (**default true**) · `disabled` · `adornment` + `adornmentPosition` (`left`/`right`) — a
**string** renders as a muted prefix/suffix (e.g. `"https://"`), a **node** as an icon
(`onAdornmentClick` makes it a clickable button) · `regex` (allow-filter, e.g. `/^\d*$/`) · `mask`
(`9` digit · `a` letter · `*` alphanumeric · others literal, e.g. `"(999) 999-9999"`). `type="password"`
auto-adds a show/hide toggle. Controlled (`value`+`onChange`) or uncontrolled (`defaultValue`).

**NumberField** — numeric input with `+`/`−` steppers. `min` (**default 0**) · `max` · `step` (default 1) ·
`value`/`defaultValue` (`number | null`) · `onChange(number|null)` · `hideStepper` · `thousandSeparator`
(live grouping, e.g. `"."` → `32.345.345`). `fullWidth` defaults true.

**Checkbox** — `label` · `color` (checked fill) · `size` · `checked`/`defaultChecked` ·
`onChange(boolean)` · `error` (reddens the box only, no helper text) · `required` · `disabled`.

**ThemeToggle** — wraps `IconButton`; flips the theme mode. Pass-through `variant`/`color`/`size`.

**Badge** — wraps a child (e.g. a `Button`/`IconButton`) and pins a count or dot to its corner:
`<Badge content={2}><IconButton …/></Badge>`. `content` (`number | string`) → a count (numbers cap to
`${max}+`, `max` default 99; a `0` hides unless `showZero`); `dot` → a plain indicator. `color`
(default `dark`), `placement` (`top-right` default · `top-left` · `bottom-right` · `bottom-left`).

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

**Chip** — a compact tag. `variant` (`contained` · `filled` default · `outlined` · `text`) · `color` ·
`size` · `clickable` (interactive; off by default) · `disabled` · `startIcon` **or** `avatar` ·
`onDelete` (adds a delete ✕). `<Chip avatar={<Avatar name="David Savaneli" />} onDelete={remove}>David</Chip>`.

**Hooks** — `useDisclosure(initial?)` → `{ isOpen, open, close, toggle }`.

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
  `header?: { theme?: boolean; onLogout?: () => void }` — `theme` (default `true`) shows the
  `ThemeToggle`; passing `onLogout` adds a logout button. The content area auto-stacks
  **`Breadcrumbs` → the page title (the active route's `staticData.name`, as an `h2`) → your page**.
- **`PageLayout`** — the surface-card container your page body sits in (border + radius + padding).
  Wrap each route's content: `<PageLayout>…</PageLayout>`. Extends `HTMLAttributes<HTMLDivElement>`,
  exported named **and** default from `sava-test/components` (and `sava-test/components/PageLayout`).
- **`Sidebar`** — auto-builds the menu from the routes' `staticData` (rendered inside `RootLayout`;
  you don't place it yourself).
- **`Breadcrumbs`** — auto-rendered above the page title. Starts with a home icon (links to the first
  allowed page) + a crumb per matched route with a `staticData.name`; the current page is plain text.
  `separator?: IconName | ReactNode` (default `"/"`) — an `IconName` like `"ArrowRight4"` renders as an
  icon. Also exported from `sava-test/components` if you want to place it yourself.
- **`FirstRouteRedirect`** — use as the `/` route's component; forwards to the first menu item.
- Each route self-registers via **`staticData`** (typed once you import from the package):
  `{ name?: string; icon?: IconName; order?: number; hidden?: boolean; roles?: string[] }`. No `name`
  → not in the menu. Segments infer structure: `/dashboard` → top link; `/components/forms/button` →
  module → group → page; an index route at a group path makes the group its own page. Module/group
  label+icon come from that folder's `route.tsx` `staticData`.

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

> Gotcha: never name a leaf route file `loader.tsx` (reserved by the TanStack Router plugin) — use a
> `loader/index.tsx` folder instead.

## 7. Conventions for the app

- **Title Case** all visible UI text.
- Use the components' **`color` / `size` props and design tokens** — don't hardcode colors or sizes.
- `TextField` / `NumberField` are **full-width by default**; pass `fullWidth={false}` for natural width.
- Keep app/business state in the app; the library only provides UI + the `useForm` helper.
