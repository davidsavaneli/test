# sava-test (`@techzy/ui`) — Usage Guide for Consuming Apps

> Copy this file into the **root of the consuming admin-panel project** as `CLAUDE.md` so the
> assistant knows how to use the library. This is the _consumer_ guide (how to USE the package) —
> it intentionally omits the library's own build/maintenance internals.

The package is a reusable React component library (currently published as **`sava-test`**; the real
name is `@techzy/ui`). Stack on the consumer side: React 18+ and TypeScript. Everything is imported
from the package root.

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
import 'sava-test/reset.css' // global reset
import 'sava-test/styles.css' // design tokens + base styles
import { ThemeProvider } from 'sava-test'

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

## 4. Components (all from `'sava-test'`)

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
`onChange(boolean)` · `error` + `helperText` · `required` · `disabled`.

**ThemeToggle** — wraps `IconButton`; flips the theme mode. Pass-through `variant`/`color`/`size`.

**Hooks** — `useDisclosure(initial?)` → `{ isOpen, open, close, toggle }`.

## 5. Forms (Zod-powered) — the easy way

```tsx
import { z } from 'zod'
import { useForm, Form, TextField, NumberField, Checkbox, Button } from 'sava-test'

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
- Errors show after blur (then live), per `mode`. Field form-values are real types: number for
  `NumberField`, boolean for `Checkbox`. For a nullable/optional number, type the schema field with
  `.nullable()` and annotate any `required` refine as `(v): boolean => v !== null` (TS infers a
  type-predicate otherwise and breaks the `null` default).

## 6. Conventions for the app

- **Title Case** all visible UI text.
- Use the components' **`color` / `size` props and design tokens** — don't hardcode colors or sizes.
- `TextField` / `NumberField` are **full-width by default**; pass `fullWidth={false}` for natural width.
- Keep app/business state in the app; the library only provides UI + the `useForm` helper.
