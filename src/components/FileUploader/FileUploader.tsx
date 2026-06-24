import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
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
import { Icon } from '../Icon'
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
  /**
   * Accepted file types (react-dropzone's format: a MIME type → file-extensions map) — restricts the file
   * picker and rejects non-matching drops. E.g. `{ 'image/*': [] }` or
   * `{ 'image/*': [], 'application/pdf': ['.pdf'] }`. Omit to accept any type.
   */
  accept?: Accept
  /** Maximum number of files (only meaningful with `multiple`). Picks beyond it are rejected with a notice. */
  maxFiles?: number
  /** Maximum size per file — a bytes `number`, or a human string like `"5MB"` / `"500KB"`. Larger picks are rejected. */
  maxFileSize?: number | string
  /** Where a newly added file lands in the list (`multiple` only): `'start'` (top) or `'end'` (bottom). Defaults to `'end'`. */
  itemInsertLocation?: 'start' | 'end'
  /** Controlled value — one item (or `null`) when single, an array when `multiple`. */
  value?: FileUploaderValue
  /** Initial value for uncontrolled use. */
  defaultValue?: FileUploaderValue
  /** Fires with the next value whenever files are added, removed, or reordered. */
  onChange?: (value: FileUploaderValue) => void
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

/** Human-readable byte size, e.g. `2.4 MB`. */
const formatBytes = (bytes: number): string => {
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
const toBytes = (size: number | string): number | undefined => {
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

/** Display name — the File's name or the last path segment of a source URL. */
const labelOf = (item: FileUploaderItem): string => {
  if (item.file) return item.file.name
  if (item.source) {
    if (/^(data|blob):/i.test(item.source)) return 'File'
    return item.source.split(/[?#]/)[0].split('/').pop() || 'File'
  }
  return 'File'
}

/**
 * Split a name into the part that may truncate and a short trailing extension that should always stay
 * visible — so a long name middle-ellipses as `name….ext` instead of overflowing or losing the type.
 */
const splitName = (name: string): { base: string; ext: string } => {
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
  error?: string
  onRemove: () => void
  onPreviewError?: () => void
}

function Row({ id, item, preview, sortable, entering, error, onRemove, onPreviewError }: RowProps) {
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
        <button
          type="button"
          className={styles.tileRemove}
          aria-label={`Remove ${label}`}
          onClick={onRemove}
          onPointerDown={(e) => e.stopPropagation()} // don't start a drag from the remove button
        >
          <Icon name="Close" size="sm" />
        </button>
        <span className={styles.tileText}>
          <span className={styles.name} title={label}>
            <span className={styles.nameBase}>{base}</span>
            {ext && <span className={styles.nameExt}>{ext}</span>}
          </span>
          <span className={clsx(styles.tileMeta, error && styles.metaError)}>{error ?? meta}</span>
        </span>
      </div>
    </div>
  )
}

// ── the field ───────────────────────────────────────────────────────────────────────────────────

/**
 * A small, clean file field that **collects** files for the consumer to upload on save — it never
 * uploads itself. New picks carry their binary in `file`; already-uploaded files arrive with a
 * `source` URL. A soft dropzone panel sits above a list of file rows (icon/thumbnail + name + size +
 * remove). `allowDrop` enables drag-from-OS (via `react-dropzone`); `allowReorder` enables drag +
 * keyboard reordering (via `@dnd-kit`). New rows animate in. Controlled (`value` + `onChange`) or
 * uncontrolled (`defaultValue`). The forwarded ref points at the root.
 */
export const FileUploader = forwardRef<HTMLDivElement, FileUploaderProps>(function FileUploader(
  {
    multiple = false,
    allowDrop = true,
    allowReorder = true,
    accept,
    maxFiles,
    maxFileSize,
    itemInsertLocation = 'end',
    value,
    defaultValue,
    onChange,
    className,
    style,
    ...props
  },
  ref,
) {
  const maxBytes = maxFileSize != null ? toBytes(maxFileSize) : undefined
  const [notice, setNotice] = useState<string | null>(null)
  // the rejection notice auto-dismisses so it doesn't linger forever
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])
  const isControlled = value !== undefined
  const [internal, setInternal] = useState<FileUploaderValue>(
    defaultValue ?? (multiple ? [] : null),
  )
  const current = isControlled ? value : internal
  const items: FileUploaderItem[] =
    current == null ? [] : Array.isArray(current) ? current : [current]

  const reorderEnabled = allowReorder && multiple

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
    onChange?.(out)
  }

  const addFiles = (accepted: File[], rejections: FileRejection[] = []) => {
    const reasons: string[] = []
    // oversized files are NOT rejected here — they're added and flagged in an error state (see `error` below)
    if (rejections.some((r) => r.errors.some((e) => e.code === 'file-invalid-type')))
      reasons.push('Some files have an unsupported type')

    let taken = accepted
    if (multiple && maxFiles != null) {
      const room = Math.max(0, maxFiles - items.length)
      if (accepted.length > room) {
        taken = accepted.slice(0, room)
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
    // note: maxSize is NOT passed — oversized files are still added but flagged in an error state below
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

  return (
    <div ref={ref} className={clsx(styles.root, className)} style={style} {...props}>
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
                error={
                  item.file && maxBytes != null && item.file.size > maxBytes
                    ? `Exceeds ${formatBytes(maxBytes)} limit`
                    : undefined
                }
                onRemove={() => removeAt(index)}
                onPreviewError={
                  !item.file && item.source ? () => markSourceFailed(item.source!) : undefined
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {notice && (
        <span className={styles.notice} role="status">
          {notice}
        </span>
      )}
    </div>
  )
})
