import { useState } from 'react'
import { z } from 'zod'
import {
  Button,
  FileUploader,
  Form,
  useForm,
  type FileUploaderItem,
  type FileUploaderValue,
} from '../../../src'
import { Block, Section } from '../../shared'

// A file item: a fresh pick (binary) OR an already-uploaded one (source URL).
const fileItemSchema = z
  .object({
    file: z.instanceof(File).optional(),
    source: z.string().optional(),
    sortIndex: z.number(),
  })
  .refine((it) => Boolean(it.file) || Boolean(it.source), 'Missing file')

/** Bound to a <Form> by `name` — zod validates the array on submit; scroll-to-error focuses the field. */
function FormDemo() {
  const [output, setOutput] = useState<string | null>(null)
  const form = useForm({
    schema: z.object({ gallery: z.array(fileItemSchema).min(1, 'Add at least one image') }),
    defaultValues: { gallery: [] as FileUploaderItem[] },
    onSubmit: (values) =>
      setOutput(`${(values.gallery as FileUploaderItem[]).length} file(s) — ready to upload`),
  })
  return (
    <Form form={form}>
      <FileUploader
        name="gallery"
        multiple
        required
        label="Gallery"
        accept={{ 'image/*': [] }}
        maxFiles={5}
      />
      <Button type="submit" style={{ marginTop: 'var(--tz-space-sm)' }}>
        Submit
      </Button>
      {output != null && (
        <span style={{ marginLeft: 'var(--tz-space-sm)', color: 'var(--tz-color-success)' }}>
          ✓ {output}
        </span>
      )}
    </Form>
  )
}

// Stand-in "already uploaded" images as inline SVG data URIs, so the demo renders with no network.
// A real backend would return a normal https URL here — the component treats any source string the same.
const swatch = (hex: string, label: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180"><rect width="240" height="180" fill="${hex}"/><text x="120" y="100" font-family="sans-serif" font-size="26" fill="#fff" text-anchor="middle">${label}</text></svg>`,
  )}`

// Already-uploaded items (edit mode): a source URL, no `file` binary.
const EXISTING: FileUploaderItem[] = [
  { source: swatch('#13404e', 'One'), sortIndex: 0 },
  { source: swatch('#039aa1', 'Two'), sortIndex: 1 },
]

// A non-image file (renders the file-icon fallback tile) alongside a source image.
const MIXED: FileUploaderItem[] = [
  {
    file: new File(['%PDF-1.4 demo'], 'report.pdf', { type: 'application/pdf' }),
    source: '',
    sortIndex: 0,
  },
  { source: swatch('#056472', 'Img'), sortIndex: 1 },
]

// A file larger than the block's maxFileSize → kept, but shown in an error state.
const OVERSIZED: FileUploaderItem[] = [
  {
    file: new File([new Uint8Array(1_200_000)], 'big-report.pdf', { type: 'application/pdf' }),
    source: '',
    sortIndex: 0,
  },
]

/** Renders the emitted value model in a readable form (File → its name). */
function Output({ value }: { value: FileUploaderValue }) {
  const arr = Array.isArray(value) ? value : value ? [value] : []
  const view = arr.map((it) => ({
    file: it.file?.name,
    source: it.source || undefined,
    sortIndex: it.sortIndex,
  }))
  return (
    <pre
      style={{
        margin: 0,
        padding: 'var(--tz-space-sm)',
        background: 'var(--tz-color-secondary)',
        border: '1px solid var(--tz-color-border)',
        borderRadius: 'var(--tz-radius-sm)',
        fontSize: 'var(--tz-font-size-sm)',
        color: 'var(--tz-color-text)',
        whiteSpace: 'pre-wrap',
        overflowX: 'auto',
      }}
    >
      {`value = ${JSON.stringify(view, null, 2)}`}
    </pre>
  )
}

export function FileUploaderSection() {
  const [single, setSingle] = useState<FileUploaderValue>(null)
  const [gallery, setGallery] = useState<FileUploaderValue>([])
  const [edit, setEdit] = useState<FileUploaderValue>(EXISTING)

  return (
    <Section>
      <Block
        label="In a <Form> — required + zod validation"
        description="name binds it to useForm; Submit with no files shows the error + scroll-to-error focuses the field. Validate the array with z.array(fileItemSchema).min(1)."
      >
        <FormDemo />
      </Block>

      <Block
        label="Single — collect one file (controlled)"
        description="value + onChange, accept images only. Picking a new file replaces the current one; only the File binary is collected (you upload it on save)."
      >
        <FileUploader value={single} onChange={setSingle} accept={{ 'image/*': [] }} />
      </Block>

      <Block
        label="Multiple — controlled, with the emitted value"
        description="onChange fires the { file, source, sortIndex } model on every add / remove / reorder — shown live below."
      >
        <FileUploader multiple value={gallery} onChange={setGallery} accept={{ 'image/*': [] }} />
        <Output value={gallery} />
      </Block>

      <Block
        label="Uncontrolled — defaultValue"
        description="No value/onChange — the component manages its own state, seeded once from defaultValue."
      >
        <FileUploader multiple defaultValue={EXISTING} />
      </Block>

      <Block
        label='itemInsertLocation="start"'
        description="A newly added file lands at the top of the list instead of the bottom (default is 'end')."
      >
        <FileUploader multiple itemInsertLocation="start" defaultValue={EXISTING} />
      </Block>

      <Block
        label="Edit mode — already-uploaded files (source URLs)"
        description="Controlled value with source items (no binary). Remove or reorder them, or add new picks alongside."
      >
        <FileUploader multiple value={edit} onChange={setEdit} />
      </Block>

      <Block
        label="Accepted types — images + PDF"
        description="accept (react-dropzone format) restricts the picker and rejects non-matching drops."
      >
        <FileUploader multiple accept={{ 'image/*': [], 'application/pdf': ['.pdf'] }} />
      </Block>

      <Block
        label="Limits — maxFiles 4, maxFileSize 5 MB"
        description="The dropzone shows the constraints; over-limit picks raise a notice that auto-dismisses (below the cards)."
      >
        <FileUploader multiple accept={{ 'image/*': [] }} maxFiles={4} maxFileSize="5MB" />
      </Block>

      <Block
        label="Validation — oversized file shown in an error state"
        description='maxFileSize="1MB"; a larger file is kept but flagged (red ring + "Exceeds 1.0 MB limit").'
      >
        <FileUploader multiple defaultValue={OVERSIZED} maxFileSize="1MB" />
      </Block>

      <Block
        label="Any file type — non-images show a file icon"
        description="No accept; a non-image file (PDF) renders the file-icon fallback tile next to image cards."
      >
        <FileUploader multiple defaultValue={MIXED} />
      </Block>

      <Block
        label="allowDrop = false"
        description="Click-to-browse only (no OS drag-and-drop); reordering still works."
      >
        <FileUploader multiple allowDrop={false} defaultValue={EXISTING} />
      </Block>

      <Block
        label="allowReorder = false"
        description="Drag-and-drop in works, but the cards can't be reordered."
      >
        <FileUploader multiple allowReorder={false} defaultValue={EXISTING} />
      </Block>

      <Block
        label="allowDownload = false"
        description="The download button (shown by default on each item) is hidden — only remove remains."
      >
        <FileUploader multiple allowDownload={false} defaultValue={EXISTING} />
      </Block>
    </Section>
  )
}
