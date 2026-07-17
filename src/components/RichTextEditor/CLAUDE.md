# RichTextEditor

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A **WYSIWYG rich text editor** built on **Lexical** (an **optional peer** — `lexical` + the `@lexical/*`
React packages, all `external`/never bundled, like `zod`/`dayjs`). **Value is an HTML string** — controlled
(`value` + `onChange(html)`) or uncontrolled (`defaultValue`); inside a `<Form>` a **`name`** prop binds the
HTML value (read raw `form.values[name]`, written via `setValue`; touched/error from `field()`, like
`Select`/`NumberField`) — and the **`name` is mirrored onto the editable `contenteditable` node** (via a
ref+effect) so the form's **scroll-to-error** can find **and focus** the editor (it queries `[name="…"]`;
the RTE has no native input, so without this the field would be invisible to scroll-to-error). Shares the
field-family chrome (`label` · `size` · `error` + `helperText` ·
`required` · `disabled` · `placeholder`) + a token-bordered `.control` with a `:focus-within` ring.
**Toolbar is built from the library's own primitives** (not a borrowed editor UI), left-to-right:
`IconButton`s for undo/redo, a **font-size `Dropdown`** (10–20px; the editor's default for the current
`size` — sm 12 / md 14 / lg 16 — shows active when the selection has no explicit size; via
`$patchStyleText` → inline `font-size`), a **block-type `Dropdown`** (Paragraph / Heading 1–3),
**bold/italic/underline** (the format toggles soft-`filled` while active), standalone toggle buttons for
**Bullet list** / **Numbered list** (the custom `ListBullet`/`ListNumber` icons) and **Quote**,
**text-alignment** (left / center / right, via `FORMAT_ELEMENT_COMMAND` → exported as inline
`text-align` style), a **text-color** control (a brush button whose corner triangle shows the current
color; opens the shared **`ColorPickerPanel`** in a `FloatingPanel`, applied to the selection via
`$patchStyleText` → inline `color` style, read back via `$getSelectionStyleValueForProperty`), a
**link** toggle, an **image** `Dropdown` (Upload / By URL), and a **video** button. The **link** /
**image-by-URL** / **video** actions collect their URL through a shared **`Modal`** (a `TextField` +
Cancel/Confirm — the footer Submit drives the body `<form>` across the modal's portal; the link dialog
prefills the current link's URL), **not `window.prompt`**; the Lexical command runs on the editor's
retained selection when the modal confirms. The toolbar controls are compact (smaller box + icon than the standard sizes —
box 22/26/30px, icon 12/14/16px by editor `size`). Content
is styled entirely with `--tz-*` tokens via a Lexical `theme` mapping node types → CSS-module classes
(headings/quote/lists/check-list/link/inline formats/media). **Markdown shortcuts** while typing (`# `,
`- `, `> `, `1. `, `* *`, …) via the default transformers **minus** the fenced-code-block one (it needs
`CodeNode`, out of v1 scope). **Media:** **images** insert by URL **or** upload — upload embeds the file as
a base64 `data:` URL by default (no backend), or, if **`onImageUpload(file) => Promise<string>`** is
given, uploads through it and inserts the returned URL; **video** is **URL-embed only** (a `VideoNode`
that normalizes YouTube/Vimeo links to a responsive `<iframe>` embed and renders direct media files as
`<video controls>` — no upload). Custom `ImageNode` / `VideoNode` (`DecoratorNode`s) serialize to clean
`<img>` / `<iframe>`/`<video>` and parse back on paste/load. **HTML value hygiene:** the exported HTML is
**class-stripped** (`cleanExportedHtml`) so the value is portable markup (`<h2>` not
`<h2 class="_h2_ab12">`); re-import keys off tag names, so it round-trips. A **blank editor emits `''`**
(not Lexical's `<p><br></p>`) via `$isEditorEmpty`, so a cleared field reads as empty and a `required`
rule fires. Two important Lexical gotchas
baked in: the change listener serializes via **`editor.read`** (not `editorState.read`) so the active
editor is bound for `$generateHtmlFromNodes` (else it throws "no active editor"), and the controlled
value↔editor sync guards a feedback loop via a `lastHtml` ref (re-sync only when the incoming value isn't
our own last emit). a11y: the editable region is a `role="textbox"` `ContentEditable` with the
`aria-label`; the toolbar is `role="toolbar"`. **Note:** interactive editing (typing, toolbar commands)
relies on trusted browser events, so it's verified in a real browser, not jsdom/automated harnesses (the
tests cover render/structure/a11y/options + the pure `toVideoEmbedSrc` URL normalization). Own CSS module.
_Code blocks and tables are out of v1 scope; video upload is the natural next iteration._
