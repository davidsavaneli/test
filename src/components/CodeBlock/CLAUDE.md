# CodeBlock

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A syntax-highlighted code block with **VS Code colors** — built on **`shiki`** (an **optional peer**,
`>=1`, `external`/never bundled like `zod`/`dayjs`): the actual VS Code highlighting engine (TextMate
grammars) with its **`dark-plus`** theme. The block is **always dark**, in both app light/dark modes
(code reads best on a dark surface, and the deep background anchors it) — it does **not** flip with the
theme. Highlighting is **async + lazy**: the component `import('shiki')`s on first render (consumers who
never render a `CodeBlock` never load it) and shows the **plain code as a fallback** (on the same dark
surface) until it lands — or forever, if `shiki` isn't installed or the `language` is unknown (nothing
breaks). Props: **`code`** (required) · **`language`** (any shiki id — `'tsx'` default, `'json'`,
`'bash'`, …) · **`title`** (a filename header bar; the copy button moves into it) · **`copyable`**
(default `true` — a floating top-right `IconButton` that copies `code`, flips `Copy → CopySuccess`
for 1.6s, and carries a **`Tooltip`** whose text flips **`Copy code` → `Copied!`** on click — the
tooltip is already open from the hover/focus, so the label just updates; `placement="left"` keeps it
inside the block's `overflow: hidden`; the button is forced light via `--tz-btn-rgb: 255,255,255` over
the dark surface) ·
**`showLineNumbers`** (a muted CSS-counter gutter on shiki's `.line` spans) · **`maxHeight`** (px —
the code scrolls inside) · **`wrap`** (soft-wrap instead of horizontal scroll). The **whole block**
uses VS Code's **own dark colors** (`#1E1E1E` body / `#252526` header — a deliberate literal-color
exception, like the Modal scrim; the highlighted tokens are shiki's); only the outer border/radius is
`--tz-*`, and the mono font stack is a one-off literal (no mono token). The shiki output is injected
via `dangerouslySetInnerHTML` (trusted — shiki escapes the source). Tests mock `shiki` (deterministic;
the real engine is verified in a browser) and cover the fallback → highlight swap, the options passed,
the failure fallback, copy, title/wrap/line-number/maxHeight, and ref forwarding. Own CSS module. _A
light-theme opt-in, a `diff`/line-highlight mode and a `CodeBlock`-in-`Tabs` multi-file view are
natural next iterations._
