# FileUploader

> Part of `@techzy/ui`. Shared patterns (component anatomy, `--tz-*` tokens, theming, conventions)
> live in the repo-root `CLAUDE.md` (§3–6, §8). This file documents the API below only.

A **file field that collects files for the consumer to upload on save — it never uploads itself** (the
product rule). **Value model — `FileUploaderItem = { file?: File; source?: string; sortIndex: number }`:**
a freshly **picked** file carries its binary in `file` (`source: ''`); an **already-uploaded** one (a
backend response — edit mode) carries only its `source` URL and **no `file`**. `sortIndex` is kept in
sync with the visual order on every change. An optional **`altText`** holds alt text edited per card through
the `allowAltText` edit-button → modal — **per-locale** by default (`Record<localeCode, string>`), or a
single **`string`** with `localizedAltText={false}` (see below). **`FileUploaderValue`** is one item (or
`null`) in single mode, an **array** when `multiple`. Built on
four **optional peers** (all `external`/never bundled, like
`lexical`): **`react-dropzone`** (click-to-browse + OS drag-drop), **`@dnd-kit`** (`core` / `sortable` /
`utilities` — drag + keyboard reorder), **`@formkit/auto-animate`** (card add / remove / shift), and
**`react-image-crop`** (the per-item crop editor — its CSS is **bundled into the lib's stylesheet**, so no
extra consumer import; the JS stays external).

Shares **TextField's field chrome** — it imports `TextField.module.css` for the label / required /
helper / error styling (the `Slider`/`NumberField` precedent) — so `label` · `required` · `error` +
`helperText` · `fullWidth` (**default `true`**) behave like the rest of the field family. A soft
**dropzone** bar (compact, horizontal, dashed `accent` border, `DocumentUpload` icon, the
`"Choose a file or drag & drop it here"` prompt) sits above a **responsive grid of image cards** — each
**≥200px wide and stretching to fill the row** (`repeat(auto-fit, minmax(min(100%, 200px), 1fr))`, so a row
reaches the right edge and wraps once another 200px won't fit), a fixed **200px tall**. The dropzone shows while `multiple` (or, in single mode, until a file is
picked — `showDropzone = multiple || items.length === 0`); a static `hint` inside it spells out the
constraints (`"Up to 5 files · Max 5 MB each"`). Each card shows a **preview** — an image renders as an
`<img>`, a **video** as a first-frame **`<video>`** thumbnail (no controls) with a centered **`PlayCircle`
badge** so it reads as a video (`isVideoItem` — File by MIME, source by extension / `data:video`), and any
non-media / failed load falls back to a centered `Document` icon — with **two scrim overlays**: a **top**
one holding the **name** (middle-truncated as `name….ext` so the extension always stays visible) + a
**meta** line (`formatBytes(size)` for a File, `"Uploaded"` for a source, or the error note) on the left and
the **remove** (`Close`) button pinned **top-right**; and a **bottom** one holding the action buttons —
**crop** (`Crop`), **alt text** (`Text`), **download** (`DocumentDownload`) on the left, and a **view**
(`Eye`) button pinned **bottom-right**. The crop + alt-text buttons are gated by `allowAltText` (on by
default — pass `allowAltText={false}` to hide both) **and shown only for image items** (`isImageItem` — a
video / PDF / doc has nothing to crop or describe; those keep just download + preview + remove); the **view**
button (`allowPreview`, default on) shows for **image + video** items and opens a **fullscreen lightbox**
(the internal **`FileUploaderPreview`**, built on the shared **`Overlay`** like `Modal` — a `<body>`-portaled
dark backdrop with the image / a `<video controls>` centered; scroll-locked, fades in, closes on
backdrop-click / Escape / the × button, with a darker `dim={0.85}` scrim since media reads over black). The
scrims + white text are **literal black/white** (the image behind doesn't flip with the theme — the same
justified exception the `Modal` backdrop makes).

Props: **`multiple`** (`false` — value becomes an array) · **`allowDrop`** (`true` — OS drag-drop; `false`
= click-to-browse only) · **`allowReorder`** (`true` — drag + keyboard reorder, only meaningful with
`multiple`) · **`allowDownload`** (`true` — the per-card download button) · **`allowPreview`** (`true` —
the per-card **view** (Eye) button → fullscreen lightbox; image + video items only) · **`allowAltText`** (`true` —
a per-card **edit** button → modal for the item's `altText`; pass `false` to hide it; see the alt-text note below) ·
**`altTextLocales`** (the locales for that editor — defaults to `useLocales()`; override like
`<TranslatedFields locales>`) · **`localizedAltText`** (`true` — set `false` for a single-`string` `altText`,
one plain input, no locales) · **`allowDuplicates`** (`false` — by default a re-picked file matching an
existing item is skipped; see the dedup note below) · **`disabled`** (`false` — dims to `0.6` and inerts
everything: the dropzone is `react-dropzone`-disabled, and edit / remove / download / reorder drop out) ·
**`accept`** (react-dropzone's `{ MIME: ext[] }` map —
restricts the picker + rejects non-matching picks/drops, e.g. `{ 'image/*': [] }`) · **`maxFiles`** (cap,
`multiple` only — extra picks are dropped) · **`maxFileSize`** (bytes `number`, or a string like `"5MB"` /
`"500KB"` — **passed to react-dropzone as `maxSize`**, so an over-limit pick is **rejected** (not added);
a file supplied via `value`/`defaultValue` that exceeds it is still rendered but flagged in an error state,
red ring + `"Exceeds … limit"`) · **`itemInsertLocation`** (`'start'` / `'end'`, default `'end'` — where a
new pick lands). **Two feedback channels for a failed pick.** A **hard rejection — wrong type (`accept`)
or over `maxFileSize`** — never enters the value and fires a **`toast.error`** (so a `<Toaster>` — mounted
by `RootLayout` by default — must be present to see it; imported from `../Toast/toastStore`). The **soft
notices** — hit the `maxFiles` cap, or a skipped duplicate — stay in the inline helper slot **below the
cards** and **auto-dismiss** after 4s (the file is valid, just not added). **Duplicate picks are
de-duplicated by default** (in `multiple` mode): a pick matching an already-present item by content — a
File keyed by **name + size + last-modified** (`fileKey`), a source by its URL (`itemKey`) — is skipped
(intra-batch dupes too), since the same OS file re-picked is a **new `File` object** a reference/`WeakMap`
check would miss; pass **`allowDuplicates`** to let identical files stack (single mode always replaces, so
it can't stack).

**Edit modals — crop + alt text (`allowAltText`).** Each card has **two** buttons opening **separate**
modals (one internal **`FileUploaderEditDialog`** with a `mode` prop): the **crop** button (`Edit2`) → a
crop modal (`size="lg"`); the **alt-text** button (`Text`) → an alt-text modal (`size="sm"`). **Crop** (via
**`react-image-crop`**): the image with a draggable selection rectangle ("Drag to select the area to keep"),
the selection's **native pixel size shown live** (`W × H px`) — or the image's **original size** before a
selection is drawn. The crop is kept in **native coords** (converted on every drag) so Save doesn't depend
on the displayed size. The crop image is capped to `max-height: calc(100dvh - 360px)` (on the `ReactCrop`
root, since react-image-crop drives the `<img>` via `max-height: inherit`) so a tall image fits the screen. On **Save** the crop is exported by
a **canvas at the image's native resolution** — `drawImage` copies the selected region **1:1**
(`imageSmoothingEnabled = false`, no resample → **no quality loss, no resize**) and `toBlob(mimeType, 1)`
(the original MIME; **PNG ⇒ lossless**) yields a new `File` that **replaces the item's `file`** (`source`
cleared — a cropped source item becomes a fresh pick that uploads on save). A tainted (cross-origin,
no-CORS) canvas makes `toBlob` throw → caught, shown as a dialog error (File-object-URL picks +
same-origin/`data:` sources always work). Both the crop **and** alt-text buttons appear only for **image**
items (`isImageItem` — File by MIME, source by extension / `data:image`); a video / PDF / doc shows neither.
**Alt text**
(the other modal): **per-locale by default** (`localizedAltText` defaults `true`) — **one `TextField` per
content locale, stacked** (labelled by locale; no tabs), locales resolving **`altTextLocales` prop →
`useLocales()`** (a single untabbed field if none), and the value is a `Record<localeCode, string>`. With
**`localizedAltText={false}`** it's a **single plain `TextField`** (no locales) and the value is a
**`string`**. A working **draft** is seeded from the item's `altText` on open; **Save** trims (localized:
prunes empty locales, an all-empty result clears `altText` to `undefined`; non-localized: empty → `undefined`)
and commits via the normal `commit` path (so `altText` rides through `reindex` / controlled value / the
`<Form>`); the edited item is tracked by its **stable id** (not its index), so an external value change
while the modal is open can't retarget the save; **Cancel**/dismiss discards. Because the model gains an
`altText` key, a `<Form>` schema must include it to keep it through parse (zod strips unknown keys) — e.g.
`altText: z.record(z.string()).optional()` (localized), `altText: z.string().optional()` (non-localized), or
a `z.union([...])` to accept either.

**Reorder** is whole-card drag (no grip — the tile _is_ the handle) via `@dnd-kit` (`PointerSensor`
distance 5 + `KeyboardSensor`: Space to pick up, Arrows to move); auto-animate is **paused during a drag**
(dnd-kit owns the drag visuals) and rAF-re-enabled after. A **genuinely new** card drops in via a CSS
`.entering` animation **JS-gated** by an `enteredIds` set, so a reorder (which re-inserts the moved node)
never restarts the entrance on shifted cards; auto-animate handles remove (lift + fade) + remain (slide to
fill). Stable per-item ids (a `WeakMap<File>` for picks, `s:<url>` for sources) keep a card's identity +
focus across reorders. Object URLs for File previews are revoked when the File leaves the value / on
unmount.

Controlled (`value` + `onChange` — fires the item/array on every add / remove / reorder) or uncontrolled
(`defaultValue`). Binds to a surrounding `<Form>` by **`name`**, reading the **raw** `form.values[name]`
(not `field().value`, which would coerce the object/array) and writing via `setValue` — validate the array
with e.g. `z.array(fileItemSchema).min(1, 'Add at least one image')`, where `fileItemSchema` refines that
`file || source` is present; error/touched come from `field()` and the root carries `name` +
`tabIndex={-1}` so the form's **scroll-to-error** can focus it. a11y: root `aria-invalid` +
`aria-describedby` → the helper (`role="status"` `aria-live="polite"`); the remove / edit / download buttons
are `aria-label`led; the fallback icon is `aria-hidden`; touched fires on blur outside the whole widget —
but **not** when focus only leaves because the alt-text `Modal` or the **native file picker** opened over it
(opening the picker would otherwise flash a `required` error before a pick); the picker instead marks touched
on **cancel** (react-dropzone's `onFileDialogCancel` — opened and chose nothing), via `onFileDialogOpen` +
a one-shot suppress flag.
**Note:** the OS-drag drop + dnd-kit drag + the **crop drag** (`react-image-crop`'s pointer drag) + the
canvas crop export rely on trusted browser events / canvas (verified in a real browser, not jsdom), but the
**click-to-browse picker path works in jsdom** (`react-dropzone`'s input change; auto-animate is a no-op
there since it gates on `ResizeObserver`; `react-image-crop` renders fine — it only reads
`getBoundingClientRect`), so the tests cover the pure helpers (`toBytes` / `formatBytes` / `splitName` /
`labelOf` / `fileKey` / `itemKey`), render / structure / a11y, the **dedup behavior** (re-picking the same
file is skipped + notice; `allowDuplicates` stacks), the **rejection toasts** (an oversized / wrong-type
pick is rejected + `toast.error`, asserted via a spy), the **edit modals** (`allowAltText` → separate crop /
alt-text modals; the crop modal's stage renders + per-locale / single `altText` saved/pruned), the
**media kind** (image → `<img>`, video → `<video>` + Eye, PDF/doc → no crop/alt/preview) + the **preview
lightbox** (Eye → a `role="dialog"` overlay with the media, Escape-closes), and the `<Form>` binding. Own CSS
module (plus internal `FileUploaderEditDialog.module.css` + `FileUploaderPreview.module.css`). _A
progress/upload mode and an inline (row) layout are natural next iterations._
