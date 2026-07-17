# UserCard

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A compact **account card** — an `Avatar` + `name`/`email` and an optional **Sign out** button — for
the signed-in user (built for the `RootLayout` **`sidebarFooter`** slot, but usable anywhere), so apps
don't hand-roll the markup per project. Props: **`name`** (primary line + avatar initials source),
**`email`** (muted second line), **`avatar`** (image URL), **`icon`** (fallback avatar icon, default
`User` — passed to `Avatar` **only when there's no `name`**, since Avatar ranks an icon above initials),
**`color`** (avatar tint, default `primary`), **`size`** (`sm`/`md`/`lg` — scales the avatar, fonts +
the button), **`onLogout`** (when given, shows an **outlined `error`** full-width sign-out `Button` with
the `Logout` icon), **`logoutLabel`** (default `"Sign out"`), and **`children`** (extra content between
the identity row and the button — e.g. a settings link). A bordered, rounded card with a faint
`accent`-tint wash. Composes `Avatar` + `Typography` + `Button` + `Icon`; own CSS module (token-only).
Ships named **and** default from `sava-test/components/UserCard`. _A dropdown-menu variant (like the
header account) is a natural next iteration._
