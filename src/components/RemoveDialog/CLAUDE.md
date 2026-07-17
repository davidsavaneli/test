# RemoveDialog

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

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
