# Tabs

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A data-driven tab strip (+ optional panels). **`items`**: `{ value, label?, ariaLabel?, icon? (IconName|node),
disabled?, error?, dot?, badge?, content? }[]`. Controlled (`value` + `onChange(value)`) or uncontrolled
(`defaultValue`); the active value defaults to the URL query (when synced) then the first enabled tab.
**URL query sync — the headline feature, ON BY DEFAULT:** the active tab reads from / writes to the URL
query via the **native History API** (`URLSearchParams` + `history.replace`/`pushState`; no router
dependency, works standalone or inside TanStack Router), so a **refresh restores the tab**. The param
name resolves **`queryKey` prop → `<ConfigProvider config={{ keys: { tabQueryKey } }}>` →
`DEFAULT_TABS_QUERY_KEY` (`'tab'`)** (e.g. `?tab=general`); set **`queryKey`** to override per-strip, and
pass **`queryKey={null}`** to opt out (pure state, URL untouched). **Nested tabs auto-avoid collisions:**
a `Tabs` rendered inside another tab's panel detects its nesting depth (via an internal
`TabsDepthContext`) and defaults to **`keys.nestedTabQueryKey` (`'nestedTab'`)** instead, so the outer and
inner strips sync to different params (`?tab=…&nestedTab=…`) with zero consumer effort. **Multiple
**unrelated** strips on one page still need distinct keys** (3+ nesting levels too); the library's own
internal tab strips — `DateTimePicker`'s Date/Time tabs and `TranslatedFields`' locale tabs — pass
`queryKey={null}` so they never touch the page URL. The URL is
canonicalized on mount (replace). **Back-button behavior:** by **default tab changes `replaceState`** (no
history entry — Back leaves the page, doesn't step through tabs); pass **`pushHistory`** to `pushState`
instead (Back walks tabs). A `popstate` listener restores the tab from the query on Back/Forward. Per-tab: `icon`,
`disabled` (skipped by keyboard), `error`, and two Badge-style indicators — a **`badge`** count as a
small **inline pill trailing the label** (tinted via `--tz-btn-rgb`; caps at `99+`, so it never overlaps
the text) and a **`dot`** (a fixed **6px** circle pinned to the label's **top-right corner**, absolute,
anchored to the inner content). Two flavors of dot: a plain **`dot: true`** is the **tab color**
(`--tz-btn-rgb`, e.g. an unread/notification marker), while **`error: true`** shows a **red**
(`--tz-color-error`) dot — the validation/"needs-fixing" signal (e.g. an invalid `TranslatedFields`
locale) — and **does not tint the rest of the tab** (no red label; the active underline/pill stays the
theme color). `error` renders its red dot even without an explicit `dot`. When the tabs don't fit, the strip **scrolls horizontally** (`overflow-x:auto`,
scrollbar hidden; tabs keep their natural width) and the active tab is kept in view (`scrollIntoView`).
For an **icon-only** tab pass `ariaLabel` (falls back to `value`). `variant` (`underline` default · `pill`), `size` (`sm/md/lg`), `color` (theme palette
token, default `primary`, via the `--tz-btn-rgb` pattern), `orientation` (`horizontal` default ·
`vertical`), `fullWidth`, and **`autoFocus`** (focus the active tab on mount — e.g. when the strip lives
inside a popover that just opened, as `DateTimePicker` does). a11y: `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, roving tabindex with
Arrow/Home/End keyboard nav (automatic activation), `aria-controls`/`aria-labelledby` linking the active
panel, and an **`aria-label`** prop naming the tablist; the resolved active value is always clamped to a
present, enabled tab (no keyboard trap). Items with `content` render an active `role="tabpanel"`. Own CSS module.
