import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { z } from 'zod'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'
import { toast } from '../Toast/toastStore'
import {
  fileKey,
  FileUploader,
  type FileUploaderItem,
  formatBytes,
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
})
