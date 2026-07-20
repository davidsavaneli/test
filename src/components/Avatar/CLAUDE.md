# Avatar / AvatarGroup

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

**Avatar** shows, in priority order: an image (`src` — falls back automatically on load error), an
`icon` (`IconName` or node), explicit `children` (e.g. initials `"D.S."`), initials derived from
`name` (`"David Savaneli"` → `"DS"`), else a default `User` icon. `size` (`sm` 32 · `md` 40 · `lg` 48),
`shape` (`circle` default · `square`), `color` (default `accent`, via `--tz-btn-rgb` / `--tz-btn-on`).
a11y: an image renders `<img alt>` (alt ← `alt`/`name`); a non-image avatar with a name gets
`role="img"` + `aria-label`. **AvatarGroup** overlaps `Avatar` children (negative margin + a
`--tz-color-surface` ring) and collapses the overflow past `max` into a trailing `+N` avatar;
the group `size` is cloned onto every child (so they match), while the group `color` tints only the
`+N` overflow avatar (each child keeps its own `color`). Both live in
`src/components/Avatar/` (one folder, two exports); `Avatar` ships named **and** default. Own CSS module.
