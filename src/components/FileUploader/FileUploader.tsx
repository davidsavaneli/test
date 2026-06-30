import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { AutoAnimationPlugin } from '@formkit/auto-animate'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useDropzone, type Accept, type FileRejection } from 'react-dropzone'
import { useFormContext } from '../../form/formContext'
import { toast } from '../Toast/toastStore'
import { Icon } from '../Icon'
import { Typography } from '../Typography'
// shared field chrome (wrapper / label / required / helper) — the Slider precedent
import fieldStyles from '../TextField/TextField.module.css'
import styles from './FileUploader.module.css'

/**
 * A single file entry. A freshly-picked file carries its binary in `file`; an already-uploaded one
 * (a backend response, edit mode) carries only its URL in `source` — then `file` is absent.
 */
export interface FileUploaderItem {
  /** The picked binary — present for a newly-selected file, absent for an already-uploaded one. */
  file?: File
  /** Server URL of an already-uploaded file (edit mode); `''` for a fresh pick. */
  source?: string
  /** Position in the list (0-based) — kept in sync with the visual order on every change. */
  sortIndex: number
}

/** Single mode → one item (or `null`); `multiple` mode → an array. */
export type FileUploaderValue = FileUploaderItem | FileUploaderItem[] | null

export interface FileUploaderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** Accept more than one file — the value becomes an array. Defaults to `false`. */
  multiple?: boolean
  /** Allow dropping files onto the dropzone (drag from the OS). Defaults to `true`. */
  allowDrop?: boolean
  /** Allow drag + keyboard reordering of the rows (only meaningful with `multiple`). Defaults to `true`. */
  allowReorder?: boolean
  /** Show a download button on each item (downloads the File / source). Defaults to `true`. */
  allowDownload?: boolean
  /**
   * Allow the same file to be added more than once. By default (`false`) a pick that matches an
   * already-present item by content (a File by name + size + last-modified, a source by URL) is skipped
   * and a notice is shown. Only meaningful with `multiple` (single mode replaces, so it can't stack).
   */
  allowDuplicates?: boolean
  /** Disables the whole control — no adding, removing, reordering, or downloading; dimmed + inert. */
  disabled?: boolean
  /**
   * Accepted file types (react-dropzone's format: a MIME type → file-extensions map) — restricts the file
   * picker and rejects non-matching picks/drops (a rejection raises a `toast.error`). E.g. `{ 'image/*': [] }`
   * or `{ 'image/*': [], 'application/pdf': ['.pdf'] }`. Omit to accept any type.
   */
  accept?: Accept
  /** Maximum number of files (only meaningful with `multiple`). Picks beyond it are rejected with a notice. */
  maxFiles?: number
  /**
   * Maximum size per file — a bytes `number`, or a human string like `"5MB"` / `"500KB"`. A picked file
   * over the limit is **rejected** (not added) and raises a **`toast.error`** (so a `<Toaster>` — mounted
   * by `RootLayout` by default — must be present to see it). A file supplied via `value`/`defaultValue`
   * that exceeds the limit is still rendered but flagged in an error state (red ring + `"Exceeds … limit"`).
   */
  maxFileSize?: number | string
  /** Where a newly added file lands in the list (`multiple` only): `'start'` (top) or `'end'` (bottom). Defaults to `'end'`. */
  itemInsertLocation?: 'start' | 'end'
  /** Controlled value — one item (or `null`) when single, an array when `multiple`. */
  value?: FileUploaderValue
  /** Initial value for uncontrolled use. */
  defaultValue?: FileUploaderValue
  /** Fires with the next value whenever files are added, removed, or reordered. */
  onChange?: (value: FileUploaderValue) => void
  /** Label rendered above the control. */
  label?: ReactNode
  /** Marks the field invalid: red dropzone border + the `helperText` in the error color. */
  error?: boolean
  /** Helper / validation text under the control. Adopts the error color while `error`. */
  helperText?: ReactNode
  /** Adds a red asterisk after the label. */
  required?: boolean
  /** Stretches the control to fill its container width. Defaults to `true`. */
  fullWidth?: boolean
  /**
   * Binds the field to a surrounding `<Form>` — the form value is the item / array, validated with e.g.
   * `z.array(fileItemSchema).min(1)`. Reads the raw `form.values[name]` and writes via `setValue`;
   * error/touched come from the form, and the form's scroll-to-error can focus the field.
   */
  name?: string
}

const canMakeObjectUrl = (): boolean =>
  typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'

// auto-animate plugin: the ENTER (add) is handled by a CSS mount animation on `.row` (a reliable, visible
// drop-in), so here `add` is a no-op to avoid double-animating; auto-animate still smoothly animates the
// `remove` (lift + fade) and the `remain` reflow (rows sliding up to fill a gap).
const ANIM_MS = 300
const listAnimation: AutoAnimationPlugin = (el, action, oldCoords, newCoords) => {
  let keyframes: Keyframe[] = [{}, {}]
  let duration = ANIM_MS
  if (action === 'add') {
    duration = 0
  } else if (action === 'remove') {
    keyframes = [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-8px)' },
    ]
  } else if (oldCoords && newCoords) {
    const dx = oldCoords.left - newCoords.left
    const dy = oldCoords.top - newCoords.top
    keyframes = [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }]
  }
  return new KeyframeEffect(el, keyframes, { duration, easing: 'ease-out' })
}

/** Human-readable byte size, e.g. `2.4 MB`. (Exported for unit tests; not part of the public surface.) */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`
}

/** Coerce a `maxFileSize` (a bytes number, or a human string like `"5MB"` / `"500 KB"`) to bytes. */
export const toBytes = (size: number | string): number | undefined => {
  if (typeof size === 'number') return size
  const match = /^\s*([\d.]+)\s*(b|kb|mb|gb|tb)?\s*$/i.exec(size)
  if (!match) return undefined
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
  }
  return parseFloat(match[1]) * (units[(match[2] || 'b').toLowerCase()] ?? 1)
}

/**
 * A content-identity key for de-duplication. The same file picked twice arrives as two distinct `File`
 * objects (so a `WeakMap`/reference check can't catch it), but its name + size + last-modified match.
 */
export const fileKey = (file: File): string => `f:${file.name}:${file.size}:${file.lastModified}`
/** The dedup key for an existing item — a File by its content, an already-uploaded one by its URL. */
export const itemKey = (item: FileUploaderItem): string =>
  item.file ? fileKey(item.file) : `s:${item.source ?? ''}`

/** Display name — the File's name or the last path segment of a source URL. */
export const labelOf = (item: FileUploaderItem): string => {
  if (item.file) return item.file.name
  if (item.source) {
    if (/^(data|blob):/i.test(item.source)) return 'File'
    return item.source.split(/[?#]/)[0].split('/').pop() || 'File'
  }
  return 'File'
}

/** Download an item — a File via a fresh object URL, a source URL via a download link. */
const triggerDownload = (item: FileUploaderItem) => {
  if (typeof document === 'undefined') return
  const a = document.createElement('a')
  a.style.display = 'none'
  if (item.file) {
    if (!canMakeObjectUrl()) return
    const url = URL.createObjectURL(item.file)
    a.href = url
    a.download = item.file.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } else if (item.source) {
    a.href = item.source
    a.download = labelOf(item)
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
}

/**
 * Split a name into the part that may truncate and a short trailing extension that should always stay
 * visible — so a long name middle-ellipses as `name….ext` instead of overflowing or losing the type.
 */
export const splitName = (name: string): { base: string; ext: string } => {
  const dot = name.lastIndexOf('.')
  // only peel off a real, short extension (".png", ".jpeg") — not a dot buried in a long hash
  return dot > 0 && name.length - dot <= 7
    ? { base: name.slice(0, dot), ext: name.slice(dot) }
    : { base: name, ext: '' }
}

// ── one row ─────────────────────────────────────────────────────────────────────────────────────

interface RowProps {
  id: string
  item: FileUploaderItem
  preview: string | null
  sortable: boolean
  entering: boolean
  disabled?: boolean
  error?: string
  onRemove: () => void
  onDownload?: () => void
  onPreviewError?: () => void
}

function Row({
  id,
  item,
  preview,
  sortable,
  entering,
  disabled,
  error,
  onRemove,
  onDownload,
  onPreviewError,
}: RowProps) {
  // the whole tile is the drag handle (no separate grip — matches the image-card visual)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !sortable,
  })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const label = labelOf(item)
  const { base, ext } = splitName(label)
  const meta = item.file ? formatBytes(item.file.size) : 'Uploaded'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        styles.tile,
        sortable && styles.grabbable,
        entering && styles.entering,
        isDragging && styles.dragging,
        error && styles.tileError,
      )}
      {...attributes}
      {...listeners}
    >
      {preview ? (
        <img
          src={preview}
          alt=""
          className={styles.tileImg}
          draggable={false}
          onError={onPreviewError}
        />
      ) : (
        <span className={styles.tileFallback} aria-hidden="true">
          <Icon name="Document" size="lg" />
        </span>
      )}

      <div className={styles.tileTop}>
        {!disabled && (
          <button
            type="button"
            className={styles.tileRemove}
            aria-label={`Remove ${label}`}
            onClick={onRemove}
            onPointerDown={(e) => e.stopPropagation()} // don't start a drag from the remove button
          >
            <Icon name="Close" size="sm" />
          </button>
        )}
        <span className={styles.tileText}>
          <span className={styles.name} title={label}>
            <span className={styles.nameBase}>{base}</span>
            {ext && <span className={styles.nameExt}>{ext}</span>}
          </span>
          <span className={clsx(styles.tileMeta, error && styles.metaError)}>{error ?? meta}</span>
        </span>
        {onDownload && (
          <button
            type="button"
            className={styles.tileDownload}
            aria-label={`Download ${label}`}
            onClick={onDownload}
            onPointerDown={(e) => e.stopPropagation()} // don't start a drag from the download button
          >
            <Icon name="DocumentDownload" size="sm" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── the field ───────────────────────────────────────────────────────────────────────────────────

/**
 * A small, clean file field that **collects** files for the consumer to upload on save — it never
 * uploads itself. New picks carry their binary in `file`; already-uploaded files arrive with a
 * `source` URL. A soft dropzone panel sits above a grid of image cards (thumbnail/file-icon + name +
 * size, with overlaid remove + download buttons). `allowDrop` enables drag-from-OS (via
 * `react-dropzone`); `allowReorder` enables drag + keyboard reordering (via `@dnd-kit`); cards animate
 * in/out (via `@formkit/auto-animate`). Controlled (`value` + `onChange`) or uncontrolled
 * (`defaultValue`); binds to a `<Form>` by `name`. The forwarded ref points at the root.
 */
export const FileUploader = forwardRef<HTMLDivElement, FileUploaderProps>(function FileUploader(
  {
    multiple = false,
    allowDrop = true,
    allowReorder = true,
    allowDownload = true,
    allowDuplicates = false,
    disabled = false,
    accept,
    maxFiles,
    maxFileSize,
    itemInsertLocation = 'end',
    value,
    defaultValue,
    onChange,
    label,
    error,
    helperText,
    required = false,
    fullWidth = true,
    name,
    id: idProp,
    onBlur,
    className,
    style,
    ...props
  },
  ref,
) {
  const reactId = useId()
  const id = idProp ?? reactId
  const helperId = `${id}-helper`

  const maxBytes = maxFileSize != null ? toBytes(maxFileSize) : undefined
  const [notice, setNotice] = useState<string | null>(null)
  // the rejection notice auto-dismisses so it doesn't linger forever
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

  // Auto-bind to a surrounding <Form> by `name`. The value is a typed object/array, so read it RAW from
  // values[name] (never field().value, which String-coerces); error/touched come from field().
  const form = useFormContext()
  const isFormBound = Boolean(form && name)
  const bound = form && name ? form.field(name) : undefined

  const fallback: FileUploaderValue = multiple ? [] : null
  const externalValue: FileUploaderValue | undefined =
    value !== undefined
      ? value
      : isFormBound
        ? ((form!.values[name!] as FileUploaderValue | undefined) ?? fallback)
        : undefined
  const isControlled = externalValue !== undefined
  const [internal, setInternal] = useState<FileUploaderValue>(defaultValue ?? fallback)
  const current = isControlled ? externalValue! : internal
  const items: FileUploaderItem[] =
    current == null ? [] : Array.isArray(current) ? current : [current]

  const resolvedError = error ?? bound?.error ?? false
  const resolvedHelperText = helperText ?? bound?.helperText
  const shownHelper = notice ?? resolvedHelperText
  const helperIsError = Boolean(notice) || resolvedError

  const reorderEnabled = allowReorder && multiple && !disabled

  // Stable ids per item so a row keeps its identity (and focus) across reorders.
  const fileIds = useRef(new WeakMap<File, string>())
  const seed = useRef(0)
  const idOf = (item: FileUploaderItem, index: number): string => {
    if (item.file) {
      let id = fileIds.current.get(item.file)
      if (!id) {
        seed.current += 1
        id = `f${seed.current}`
        fileIds.current.set(item.file, id)
      }
      return id
    }
    return item.source ? `s:${item.source}` : `i:${index}`
  }
  const ids = items.map((item, i) => idOf(item, i))

  // Ids that have already animated in, so only genuinely new rows get the entrance animation — a reorder
  // re-inserts the moved/shifted nodes, which would otherwise restart the CSS drop-in on them.
  const enteredIds = useRef<Set<string>>(new Set())
  const enteringIds = new Set(ids.filter((id) => !enteredIds.current.has(id)))
  useEffect(() => {
    enteredIds.current = new Set(ids)
  })

  // Source URLs that failed to load as an image (so we fall back to the file icon).
  const [failedSources, setFailedSources] = useState<ReadonlySet<string>>(() => new Set())
  const markSourceFailed = (src: string) =>
    setFailedSources((prev) => (prev.has(src) ? prev : new Set(prev).add(src)))

  // Object URLs for image File previews, revoked when the File leaves the value / on unmount.
  const objectUrls = useRef(new Map<File, string>())
  const previewOf = (item: FileUploaderItem): string | null => {
    if (item.file) {
      if (!item.file.type.startsWith('image/') || !canMakeObjectUrl()) return null
      let url = objectUrls.current.get(item.file)
      if (!url) {
        url = URL.createObjectURL(item.file)
        objectUrls.current.set(item.file, url)
      }
      return url
    }
    // an already-uploaded item is assumed to be an image (this is an image-first uploader); a non-image
    // URL just falls the row back to the file icon via the <img> onError handler
    if (item.source && !failedSources.has(item.source)) return item.source
    return null
  }
  useEffect(() => {
    const cache = objectUrls.current
    const liveFiles = new Set(items.map((it) => it.file).filter(Boolean) as File[])
    const liveSources = new Set(items.filter((it) => !it.file && it.source).map((it) => it.source!))
    for (const [file, url] of cache) {
      if (!liveFiles.has(file)) {
        URL.revokeObjectURL(url)
        cache.delete(file)
      }
    }
    setFailedSources((prev) => {
      if (prev.size === 0) return prev
      const next = new Set([...prev].filter((s) => liveSources.has(s)))
      return next.size === prev.size ? prev : next
    })
  }, [current]) // eslint-disable-line react-hooks/exhaustive-deps -- `current` is the value identity
  useEffect(() => {
    const cache = objectUrls.current
    return () => {
      for (const url of cache.values()) URL.revokeObjectURL(url)
      cache.clear()
    }
  }, [])

  const reindex = (arr: FileUploaderItem[]): FileUploaderItem[] =>
    arr.map((it, i) => (it.sortIndex === i ? it : { ...it, sortIndex: i }))

  const commit = (next: FileUploaderItem[]) => {
    const ordered = reindex(next)
    const out: FileUploaderValue = multiple ? ordered : (ordered[0] ?? null)
    if (!isControlled) setInternal(out)
    if (isFormBound) form!.setValue(name!, out)
    onChange?.(out)
  }

  const addFiles = (accepted: File[], rejections: FileRejection[] = []) => {
    // Hard rejections (the file is invalid: wrong type, or over `maxFileSize` — react-dropzone rejects
    // both, so they never reach `accepted`) surface as a Toast error and are not added.
    const wrongType = rejections.filter((r) => r.errors.some((e) => e.code === 'file-invalid-type'))
    const tooLarge = rejections.filter((r) => r.errors.some((e) => e.code === 'file-too-large'))
    if (wrongType.length > 0)
      toast.error(
        wrongType.length === 1
          ? `"${wrongType[0].file.name}" has an unsupported file type`
          : `${wrongType.length} files have an unsupported type`,
      )
    if (tooLarge.length > 0 && maxBytes != null)
      toast.error(
        tooLarge.length === 1
          ? `"${tooLarge[0].file.name}" exceeds the ${formatBytes(maxBytes)} limit`
          : `${tooLarge.length} files exceed the ${formatBytes(maxBytes)} limit`,
      )

    // Soft notices (the file is valid, just not added now) stay in the inline helper slot + auto-dismiss.
    const reasons: string[] = []
    let taken = accepted
    // drop files already present (same content) + intra-batch dupes, unless explicitly allowed
    if (multiple && !allowDuplicates) {
      const seen = new Set(items.map(itemKey))
      const unique: File[] = []
      for (const file of taken) {
        const key = fileKey(file)
        if (seen.has(key)) continue
        seen.add(key)
        unique.push(file)
      }
      if (unique.length < taken.length) reasons.push('Some files are already added')
      taken = unique
    }
    if (multiple && maxFiles != null) {
      const room = Math.max(0, maxFiles - items.length)
      if (taken.length > room) {
        taken = taken.slice(0, room)
        reasons.push(`Up to ${maxFiles} ${maxFiles === 1 ? 'file' : 'files'}`)
      }
    }

    setNotice(reasons.length > 0 ? reasons.join(' · ') : null)
    if (taken.length === 0) return
    const picked = taken.map<FileUploaderItem>((file) => ({ file, source: '', sortIndex: 0 }))
    if (!multiple) {
      commit([picked[0]])
      return
    }
    commit(itemInsertLocation === 'start' ? [...picked, ...items] : [...items, ...picked])
  }
  const removeAt = (index: number) => {
    setNotice(null)
    commit(items.filter((_, i) => i !== index))
  }

  // auto-animate handles add / remove / shift on the list; it's paused during a dnd-kit drag so the two
  // don't both animate the reorder (dnd-kit owns the drag visuals, auto-animate owns enter/exit).
  const [listRef, enableAnimations] = useAutoAnimate(listAnimation)
  const reEnableAnimations = () => {
    if (typeof requestAnimationFrame === 'function')
      requestAnimationFrame(() => enableAnimations(true))
    else enableAnimations(true)
  }
  const handleDragStart = () => enableAnimations(false)
  const handleDragCancel = () => reEnableAnimations()
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const from = ids.indexOf(String(active.id))
      const to = ids.indexOf(String(over.id))
      if (from !== -1 && to !== -1) commit(arrayMove(items, from, to))
    }
    reEnableAnimations() // after the reorder DOM settles, so the move isn't double-animated
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple,
    accept,
    // reject oversized picks here so they never get added; the rejection surfaces as a Toast in addFiles
    maxSize: maxBytes,
    disabled,
    noKeyboard: false,
    noDrag: !allowDrop,
    onDrop: (accepted, rejections) => addFiles(accepted, rejections),
  })

  const showDropzone = multiple || items.length === 0

  // static constraint hint shown inside the dropzone (e.g. "Up to 5 files · Max 5 MB each")
  const hintParts: string[] = []
  if (multiple && maxFiles != null)
    hintParts.push(`Up to ${maxFiles} ${maxFiles === 1 ? 'file' : 'files'}`)
  if (maxBytes != null) hintParts.push(`Max ${formatBytes(maxBytes)} each`)
  const hint = hintParts.join(' · ')

  const prompt: ReactNode = allowDrop ? (
    <>
      <span className={styles.accent}>Choose a file</span> or drag &amp; drop it here
    </>
  ) : (
    <span className={styles.accent}>Choose a file</span>
  )

  // mark the field touched once focus leaves the whole widget (so blurThenLive errors reveal on blur)
  const onRootBlur = (event: FocusEvent<HTMLDivElement>) => {
    onBlur?.(event)
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    bound?.onBlur(event as unknown as FocusEvent<HTMLInputElement>)
  }

  return (
    <div
      ref={ref}
      id={id}
      className={clsx(
        styles.root,
        fullWidth && styles.fullWidth,
        resolvedError && styles.error,
        disabled && styles.disabled,
        className,
      )}
      style={style}
      aria-invalid={resolvedError || undefined}
      aria-describedby={shownHelper != null ? helperId : undefined}
      onBlur={onRootBlur}
      {...props}
      // name + tabIndex are load-bearing for the form's scroll-to-error → spread last so props can't clobber
      {...(name ? { name, tabIndex: -1 } : {})}
    >
      {label != null && (
        <label className={fieldStyles.label}>
          <Typography as="span" variant="bodySmall" color="muted">
            {label}
          </Typography>
          {required && (
            <span className={fieldStyles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {showDropzone && (
        <div
          {...getRootProps({ className: clsx(styles.dropzone, isDragActive && styles.dropping) })}
        >
          <input {...getInputProps()} />
          <span className={styles.dropIcon} aria-hidden="true">
            <Icon name="DocumentUpload" size="lg" />
          </span>
          <span className={styles.dropText}>
            <span className={styles.prompt}>{prompt}</span>
            {hint && <span className={styles.hint}>{hint}</span>}
          </span>
        </div>
      )}

      {/* always rendered (even when empty) so auto-animate can animate the last card out on removal */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={reorderEnabled ? handleDragStart : undefined}
        onDragEnd={reorderEnabled ? handleDragEnd : undefined}
        onDragCancel={reorderEnabled ? handleDragCancel : undefined}
      >
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <div ref={listRef} className={clsx(styles.list, items.length > 0 && styles.populated)}>
            {items.map((item, index) => (
              <Row
                key={ids[index]}
                id={ids[index]}
                item={item}
                preview={previewOf(item)}
                sortable={reorderEnabled && items.length > 1}
                entering={enteringIds.has(ids[index])}
                disabled={disabled}
                error={
                  item.file && maxBytes != null && item.file.size > maxBytes
                    ? `Exceeds ${formatBytes(maxBytes)} limit`
                    : undefined
                }
                onRemove={() => removeAt(index)}
                onDownload={allowDownload && !disabled ? () => triggerDownload(item) : undefined}
                onPreviewError={
                  !item.file && item.source ? () => markSourceFailed(item.source!) : undefined
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {shownHelper != null && (
        <Typography
          as="span"
          id={helperId}
          variant="bodySmall"
          color={helperIsError ? 'error' : 'muted'}
          className={fieldStyles.helper}
          role="status"
          aria-live="polite"
        >
          {shownHelper}
        </Typography>
      )}
    </div>
  )
})
