# Modal

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

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
  (theme palette token, default `accent`), a **`title`** (md/bold, clamps to 2 lines) that labels the dialog via
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
