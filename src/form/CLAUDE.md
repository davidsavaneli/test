# Form — `useForm` (Zod-powered)

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

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
