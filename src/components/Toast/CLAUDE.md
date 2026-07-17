# Toast / Toaster

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

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
