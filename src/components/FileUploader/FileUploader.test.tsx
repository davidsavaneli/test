import { createRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { z } from 'zod'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'
import { toast } from '../Toast/toastStore'
import {
  fileKey,
  FileUploader,
  type FileUploaderItem,
  type FileUploaderValue,
  formatBytes,
  isImageItem,
  itemKey,
  labelOf,
  splitName,
  toBytes,
} from './FileUploader'

// A real File with a fixed `lastModified`, so two separate picks of "the same file" share a content key
// — exactly how the OS re-pick behaves (the bug: a re-pick is a new File object, identical metadata).
const makeFile = (name: string, content = 'x', type = 'image/png', lastModified = 1000): File =>
  new File([content], name, { type, lastModified })

const fileInput = (container: HTMLElement): HTMLInputElement =>
  container.querySelector('input[type="file"]') as HTMLInputElement

// Each card carries a "Remove <name>" button — counting them is a stable proxy for the card count.
const removeButtons = () => screen.queryAllByRole('button', { name: /^Remove / })

// Drop a file through react-dropzone's hidden input (the click-to-browse path; OS drag needs a real browser).
const pick = async (input: HTMLInputElement, ...files: File[]) => {
  fireEvent.change(input, { target: { files } })
  // react-dropzone resolves the files on a microtask before calling onDrop
  await waitFor(() => {})
}

// Open a card's Alt text modal (the "Edit alt text for …" button) and return the dialog.
const openAltDialog = async (editName: string | RegExp = /^Edit alt text/) => {
  fireEvent.click(screen.getByRole('button', { name: editName }))
  return screen.findByRole('dialog')
}

describe('FileUploader pure helpers', () => {
  it('formatBytes renders human-readable sizes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
    expect(formatBytes(12 * 1024 * 1024)).toBe('12 MB')
  })

  it('toBytes parses numbers and human strings', () => {
    expect(toBytes(2048)).toBe(2048)
    expect(toBytes('5MB')).toBe(5 * 1024 * 1024)
    expect(toBytes('500KB')).toBe(500 * 1024)
    expect(toBytes('1.5 mb')).toBe(1.5 * 1024 * 1024)
    expect(toBytes('10')).toBe(10) // no unit → bytes
    expect(toBytes('nonsense')).toBeUndefined()
  })

  it('splitName peels a short trailing extension only', () => {
    expect(splitName('photo.png')).toEqual({ base: 'photo', ext: '.png' })
    expect(splitName('archive.tar.gz')).toEqual({ base: 'archive.tar', ext: '.gz' })
    expect(splitName('noext')).toEqual({ base: 'noext', ext: '' })
    // a dot buried in a long hash is not treated as an extension
    expect(splitName('a1b2c3d4.verylongsegment')).toEqual({
      base: 'a1b2c3d4.verylongsegment',
      ext: '',
    })
  })

  it('labelOf reads a File name or a source URL segment', () => {
    expect(labelOf({ file: makeFile('a.png'), source: '', sortIndex: 0 })).toBe('a.png')
    expect(labelOf({ source: 'https://cdn.x.com/path/img.jpg?v=1', sortIndex: 0 })).toBe('img.jpg')
    expect(labelOf({ source: 'data:image/png;base64,zzz', sortIndex: 0 })).toBe('File')
    expect(labelOf({ source: '', sortIndex: 0 })).toBe('File')
  })

  it('fileKey collides on identical content metadata and differs otherwise (the dedup core)', () => {
    // two distinct File objects, same name + size + lastModified → same key (a re-pick)
    expect(fileKey(makeFile('a.png'))).toBe(fileKey(makeFile('a.png')))
    // any of name / size / lastModified differing → a different key
    expect(fileKey(makeFile('a.png'))).not.toBe(fileKey(makeFile('b.png')))
    expect(fileKey(makeFile('a.png', 'x'))).not.toBe(fileKey(makeFile('a.png', 'longer')))
    expect(fileKey(makeFile('a.png', 'x', 'image/png', 1000))).not.toBe(
      fileKey(makeFile('a.png', 'x', 'image/png', 2000)),
    )
  })

  it('itemKey keys a File by content and a source by URL (never colliding across the two)', () => {
    const file = makeFile('a.png')
    expect(itemKey({ file, source: '', sortIndex: 0 })).toBe(fileKey(file))
    expect(itemKey({ source: 'https://x/a.png', sortIndex: 0 })).toBe('s:https://x/a.png')
    // a picked File and a same-named source are distinct identities (f: vs s: prefix)
    expect(itemKey({ file: makeFile('a.png'), source: '', sortIndex: 0 })).not.toBe(
      itemKey({ source: 'a.png', sortIndex: 0 }),
    )
  })

  it('isImageItem detects images (the only items that get crop + alt text)', () => {
    // Files — by MIME type
    expect(isImageItem({ file: makeFile('a.png', 'x', 'image/png'), sortIndex: 0 })).toBe(true)
    expect(isImageItem({ file: makeFile('v.mp4', 'x', 'video/mp4'), sortIndex: 0 })).toBe(false)
    expect(isImageItem({ file: makeFile('d.pdf', 'x', 'application/pdf'), sortIndex: 0 })).toBe(
      false,
    )
    // sources — by extension / data-URI / image-first default
    expect(isImageItem({ source: 'https://x/a.jpg', sortIndex: 0 })).toBe(true)
    expect(isImageItem({ source: 'https://x/clip.mp4', sortIndex: 0 })).toBe(false)
    expect(isImageItem({ source: 'https://x/report.pdf?v=2', sortIndex: 0 })).toBe(false)
    expect(isImageItem({ source: 'data:image/png;base64,zz', sortIndex: 0 })).toBe(true)
    expect(isImageItem({ source: 'https://picsum.photos/seed/x/240/180', sortIndex: 0 })).toBe(true)
  })
})

describe('FileUploader rendering & a11y', () => {
  it('renders the label and a required asterisk', () => {
    render(<FileUploader label="Gallery" required />)
    expect(screen.getByText('Gallery')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('shows the dropzone prompt', () => {
    render(<FileUploader />)
    expect(screen.getByText(/Choose a file/i)).toBeInTheDocument()
  })

  it('marks the root invalid and shows the helper as a live status while error', () => {
    const { container } = render(<FileUploader error helperText="Required" />)
    expect(container.firstChild).toHaveAttribute('aria-invalid', 'true')
    // (the helper is a role="status" live region — query by its text, since DndContext adds its own)
    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<FileUploader ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('carries name + tabIndex=-1 on the root for the form scroll-to-error', () => {
    const { container } = render(<FileUploader name="gallery" />)
    const root = container.querySelector('[name="gallery"]') as HTMLElement
    expect(root).not.toBeNull()
    expect(root).toHaveAttribute('tabindex', '-1')
  })
})

describe('FileUploader add / dedup behavior', () => {
  it('adds a picked file (uncontrolled) and emits the value model', async () => {
    const onChange = vi.fn()
    const { container } = render(<FileUploader multiple onChange={onChange} />)
    await pick(fileInput(container), makeFile('a.png'))

    expect(removeButtons()).toHaveLength(1)
    const value = onChange.mock.lastCall?.[0] as FileUploaderItem[]
    expect(value).toHaveLength(1)
    expect(value[0].file?.name).toBe('a.png')
    expect(value[0].source).toBe('')
    expect(value[0].sortIndex).toBe(0)
  })

  it('skips a duplicate pick (same content) and surfaces a notice — the reported bug', async () => {
    const onChange = vi.fn()
    const { container } = render(<FileUploader multiple onChange={onChange} />)
    const input = fileInput(container)

    await pick(input, makeFile('a.png'))
    expect(removeButtons()).toHaveLength(1)
    onChange.mockClear()

    // re-pick "the same file" — a new File object, identical name/size/lastModified
    await pick(input, makeFile('a.png'))
    expect(removeButtons()).toHaveLength(1) // still one card — not stacked
    expect(onChange).not.toHaveBeenCalled() // nothing committed
    expect(screen.getByText(/already added/i)).toBeInTheDocument()
  })

  it('adds a genuinely different file', async () => {
    const { container } = render(<FileUploader multiple />)
    const input = fileInput(container)
    await pick(input, makeFile('a.png'))
    await pick(input, makeFile('b.png'))
    expect(removeButtons()).toHaveLength(2)
  })

  it('allowDuplicates lets the same file stack', async () => {
    const { container } = render(<FileUploader multiple allowDuplicates />)
    const input = fileInput(container)
    await pick(input, makeFile('a.png'))
    await pick(input, makeFile('a.png'))
    expect(removeButtons()).toHaveLength(2)
  })

  it('also dedupes within a single multi-file batch', async () => {
    const onChange = vi.fn()
    const { container } = render(<FileUploader multiple onChange={onChange} />)
    await pick(fileInput(container), makeFile('a.png'), makeFile('a.png'), makeFile('b.png'))
    expect(removeButtons()).toHaveLength(2) // a.png once + b.png
  })

  it('caps at maxFiles after de-duplication and notes it', async () => {
    const { container } = render(<FileUploader multiple maxFiles={1} />)
    const input = fileInput(container)
    await pick(input, makeFile('a.png'))
    await pick(input, makeFile('b.png'))
    expect(removeButtons()).toHaveLength(1)
    // the over-cap notice lands in the helper slot (the dropzone also shows a static "Up to 1 file" hint)
    expect(container.querySelector('.helper')).toHaveTextContent(/Up to 1 file/i)
  })
})

describe('FileUploader rejections → toast (not added)', () => {
  it('rejects an oversized pick and shows a toast error', async () => {
    const spy = vi.spyOn(toast, 'error').mockReturnValue('id')
    const onChange = vi.fn()
    const { container } = render(<FileUploader multiple maxFileSize={100} onChange={onChange} />)
    // a 200-byte file exceeds the 100-byte limit → react-dropzone rejects it (file-too-large)
    await pick(
      fileInput(container),
      new File([new Uint8Array(200)], 'big.png', { type: 'image/png', lastModified: 1000 }),
    )
    expect(removeButtons()).toHaveLength(0) // not added
    expect(onChange).not.toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/exceeds/i))
    spy.mockRestore()
  })

  it('rejects an unsupported file type and shows a toast error', async () => {
    const spy = vi.spyOn(toast, 'error').mockReturnValue('id')
    const { container } = render(<FileUploader multiple accept={{ 'image/*': [] }} />)
    await pick(
      fileInput(container),
      new File(['x'], 'notes.txt', { type: 'text/plain', lastModified: 1000 }),
    )
    expect(removeButtons()).toHaveLength(0) // not added
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/unsupported/i))
    spy.mockRestore()
  })
})

describe('FileUploader alt text (allowAltText)', () => {
  const LOCALES = [
    { code: 'en-US', label: 'English' },
    { code: 'ka-GE', label: 'ქართული' },
  ]
  const itemA: FileUploaderItem = { file: makeFile('a.png'), source: '', sortIndex: 0 }
  const itemB: FileUploaderItem = { file: makeFile('b.png'), source: '', sortIndex: 1 }

  it('hides the edit button with allowAltText={false}', () => {
    render(<FileUploader multiple allowAltText={false} defaultValue={[itemA]} />)
    expect(screen.queryByRole('button', { name: /^Edit / })).toBeNull()
  })

  it('shows an edit button per card by default', () => {
    render(<FileUploader multiple defaultValue={[itemA, itemB]} />)
    expect(screen.getAllByRole('button', { name: /^Edit / })).toHaveLength(2)
  })

  it('hides crop + alt-text for a non-image item (still allows download/remove)', () => {
    const pdf: FileUploaderItem = {
      file: makeFile('doc.pdf', 'x', 'application/pdf'),
      source: '',
      sortIndex: 0,
    }
    render(<FileUploader multiple defaultValue={[pdf]} />)
    expect(screen.queryByRole('button', { name: /^Crop / })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Edit alt text/ })).toBeNull()
    expect(screen.getByRole('button', { name: /^Download / })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Remove / })).toBeInTheDocument()
  })

  it('shows one alt-text field per locale (no tabs) and saves them', async () => {
    const onChange = vi.fn()
    render(
      <FileUploader multiple altTextLocales={LOCALES} defaultValue={[itemA]} onChange={onChange} />,
    )
    const dialog = await openAltDialog()
    expect(within(dialog).getByLabelText('English')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('ქართული')).toBeInTheDocument()
    expect(within(dialog).queryByRole('tab')).toBeNull() // separate modals — no tabs at all

    fireEvent.change(within(dialog).getByLabelText('English'), { target: { value: 'A red car' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ altText: { 'en-US': 'A red car' } }),
      ]),
    )
  })

  it('prefills the alt-text field for a single locale', async () => {
    const item: FileUploaderItem = {
      source: 'https://x/a.png',
      sortIndex: 0,
      altText: { 'en-US': 'Existing alt' },
    }
    render(
      <FileUploader
        multiple
        altTextLocales={[{ code: 'en-US', label: 'English' }]}
        defaultValue={[item]}
      />,
    )
    const dialog = await openAltDialog()
    expect(within(dialog).getByLabelText('English')).toHaveValue('Existing alt')
    expect(within(dialog).queryByLabelText('ქართული')).toBeNull() // single locale → one field
  })

  it('opens a separate crop modal with the crop stage for an image item (drag needs a real browser)', async () => {
    render(<FileUploader multiple defaultValue={[{ source: 'https://x/a.png', sortIndex: 0 }]} />)
    fireEvent.click(screen.getByRole('button', { name: /^Crop / }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Drag to select the area to keep')).toBeInTheDocument()
    expect(within(dialog).queryByLabelText('English')).toBeNull() // crop modal has no alt-text fields
  })

  it('prunes empty alt text back to undefined on save', async () => {
    const onChange = vi.fn()
    render(
      <FileUploader
        multiple
        altTextLocales={[{ code: 'en-US', label: 'English' }]}
        defaultValue={[{ ...itemA, altText: { 'en-US': 'old' } }]}
        onChange={onChange}
      />,
    )
    const dialog = await openAltDialog()
    fireEvent.change(within(dialog).getByLabelText('English'), { target: { value: '   ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ altText: undefined })]),
    )
  })

  it('saves onto the originally-opened item even if the value reorders externally mid-edit', async () => {
    const onChange = vi.fn()
    function Harness() {
      const [value, setValue] = useState<FileUploaderValue>([itemA, itemB])
      return (
        <>
          <button type="button" onClick={() => setValue([itemB, itemA])}>
            ext-reorder
          </button>
          <FileUploader
            multiple
            allowAltText
            altTextLocales={[{ code: 'en-US', label: 'English' }]}
            value={value}
            onChange={(v) => {
              onChange(v)
              setValue(v)
            }}
          />
        </>
      )
    }
    render(<Harness />)
    // open the alt-text editor on item B (the second card)
    const dialog = await openAltDialog('Edit alt text for b.png')
    // an external change reorders the array under the open modal — B is now first
    fireEvent.click(screen.getByRole('button', { name: 'ext-reorder' }))
    fireEvent.change(within(dialog).getByLabelText('English'), { target: { value: 'B alt' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() => {
      const v = onChange.mock.lastCall?.[0] as FileUploaderItem[]
      expect(v.find((it) => it.file?.name === 'b.png')?.altText).toEqual({ 'en-US': 'B alt' })
      expect(v.find((it) => it.file?.name === 'a.png')?.altText).toBeUndefined()
    })
  })

  it('localizedAltText={false} edits a single plain string', async () => {
    const onChange = vi.fn()
    render(
      <FileUploader
        multiple
        localizedAltText={false}
        altTextLocales={LOCALES} // ignored when not localized
        defaultValue={[itemA]}
        onChange={onChange}
      />,
    )
    const dialog = await openAltDialog()
    expect(within(dialog).queryByLabelText('English')).toBeNull() // non-localized → no per-locale fields
    fireEvent.change(within(dialog).getByLabelText('Alt text'), { target: { value: 'Plain alt' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ altText: 'Plain alt' })]),
    )
  })

  it('prefills a string altText in non-localized mode', async () => {
    render(
      <FileUploader
        multiple
        localizedAltText={false}
        defaultValue={[{ ...itemA, altText: 'Existing plain' }]}
      />,
    )
    const dialog = await openAltDialog()
    expect(within(dialog).getByLabelText('Alt text')).toHaveValue('Existing plain')
  })
})

// a <Form> with a too-strict rule (min 2) so a 1-item gallery is invalid while an edit button still shows
const STRICT_ITEM = z
  .object({
    file: z.instanceof(File).optional(),
    source: z.string().optional(),
    sortIndex: z.number(),
    altText: z.record(z.string()).optional(),
  })
  .refine((i) => Boolean(i.file) || Boolean(i.source))

function StrictGalleryForm() {
  const form = useForm({
    schema: z.object({ gallery: z.array(STRICT_ITEM).min(2, 'Add at least two') }),
    defaultValues: { gallery: [{ file: makeFile('a.png'), source: '', sortIndex: 0 }] },
    onSubmit: vi.fn(),
  })
  return (
    <Form form={form}>
      <FileUploader
        name="gallery"
        multiple
        allowAltText
        altTextLocales={[{ code: 'en-US', label: 'English' }]}
        label="Gallery"
      />
    </Form>
  )
}

describe('FileUploader alt-text modal vs form touched state', () => {
  it('reveals the bound error on a real blur out of the widget (control)', async () => {
    render(<StrictGalleryForm />)
    const root = document.querySelector('[name="gallery"]') as HTMLElement
    fireEvent.blur(root, { relatedTarget: document.body })
    expect(await screen.findByText('Add at least two')).toBeInTheDocument()
  })

  it('does NOT mark the field touched when the alt-text editor is opened', async () => {
    render(<StrictGalleryForm />)
    fireEvent.click(screen.getByRole('button', { name: /^Edit / }))
    await screen.findByRole('dialog')
    // focus left the root into the body-portaled modal — the guard must keep the field untouched
    const root = document.querySelector('[name="gallery"]') as HTMLElement
    fireEvent.blur(root, { relatedTarget: document.body })
    expect(screen.queryByText('Add at least two')).toBeNull()
  })

  it('reveals the required error after the last file is removed', async () => {
    function Harness() {
      const form = useForm({
        schema: z.object({ gallery: z.array(STRICT_ITEM).min(1, 'Add at least one image') }),
        defaultValues: { gallery: [{ file: makeFile('a.png'), source: '', sortIndex: 0 }] },
        onSubmit: vi.fn(),
      })
      return (
        <Form form={form}>
          <FileUploader name="gallery" multiple label="Gallery" />
        </Form>
      )
    }
    render(<Harness />)
    expect(screen.queryByText('Add at least one image')).toBeNull() // valid + untouched
    fireEvent.click(screen.getByRole('button', { name: /^Remove / }))
    expect(await screen.findByText('Add at least one image')).toBeInTheDocument()
  })
})

describe('FileUploader <Form> binding', () => {
  function Harness({ onSubmit }: { onSubmit: () => void }) {
    const form = useForm({
      schema: z.object({
        gallery: z
          .array(
            z.object({
              file: z.instanceof(File).optional(),
              source: z.string().optional(),
              sortIndex: z.number(),
            }),
          )
          .min(1, 'Add at least one image'),
      }),
      defaultValues: { gallery: [] as FileUploaderItem[] },
      onSubmit,
    })
    return (
      <Form form={form}>
        <FileUploader name="gallery" multiple label="Gallery" />
        <button type="submit">Submit</button>
      </Form>
    )
  }

  it('blocks submit and shows the validation error when empty', async () => {
    const onSubmit = vi.fn()
    render(<Harness onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => {
      expect(screen.getByText('Add at least one image')).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('validates and submits once a file is added', async () => {
    const onSubmit = vi.fn()
    const { container } = render(<Harness onSubmit={onSubmit} />)
    await pick(fileInput(container), makeFile('a.png'))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const submitted = onSubmit.mock.lastCall?.[0] as { gallery: FileUploaderItem[] }
    expect(submitted.gallery).toHaveLength(1)
    expect(submitted.gallery[0].file?.name).toBe('a.png')
  })

  it('keeps altText through submit when the item schema declares it', async () => {
    const onSubmit = vi.fn()
    function AltHarness() {
      const form = useForm({
        schema: z.object({
          gallery: z
            .array(
              z.object({
                file: z.instanceof(File).optional(),
                source: z.string().optional(),
                sortIndex: z.number(),
                altText: z.record(z.string()).optional(),
              }),
            )
            .min(1),
        }),
        defaultValues: {
          gallery: [{ source: 'https://x/a.png', sortIndex: 0, altText: { 'en-US': 'A' } }],
        },
        onSubmit,
      })
      return (
        <Form form={form}>
          <FileUploader name="gallery" multiple allowAltText label="Gallery" />
          <button type="submit">Submit</button>
        </Form>
      )
    }
    render(<AltHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const submitted = onSubmit.mock.lastCall?.[0] as { gallery: FileUploaderItem[] }
    expect(submitted.gallery[0].altText).toEqual({ 'en-US': 'A' })
  })
})
