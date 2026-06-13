import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { RichTextEditor } from './RichTextEditor'
import { toVideoEmbedSrc } from './nodes/VideoNode'

// NOTE: Lexical's contenteditable input pipeline relies on trusted browser events, which jsdom and
// automated harnesses can't synthesize — so typing / toolbar-command behavior is verified manually in
// a real browser. Here we cover render, structure, a11y, options and the pure URL-normalization logic.

describe('RichTextEditor', () => {
  it('renders the toolbar and an editable region', () => {
    render(<RichTextEditor aria-label="Body editor" />)
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Body editor' })).toBeInTheDocument()
  })

  it('exposes the core toolbar controls', () => {
    render(<RichTextEditor aria-label="E" />)
    for (const name of [
      'Undo',
      'Redo',
      'Bold',
      'Italic',
      'Underline',
      'Align left',
      'Align center',
      'Align right',
      'Insert link',
      'Insert image',
      'Insert video',
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('has no strikethrough or inline-code control', () => {
    render(<RichTextEditor aria-label="E" />)
    expect(screen.queryByRole('button', { name: 'Strikethrough' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Inline code' })).toBeNull()
  })

  it('emits an empty string for a blank editor (not <p><br></p>)', async () => {
    const onChange = vi.fn()
    render(<RichTextEditor defaultValue="<p></p>" onChange={onChange} aria-label="E" />)
    await waitFor(() => expect(onChange).toHaveBeenCalled())
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]
    expect(lastCall[0]).toBe('')
  })

  it('renders the parsed defaultValue HTML as content', async () => {
    render(<RichTextEditor defaultValue="<h2>Hello</h2><p>World</p>" aria-label="E" />)
    expect(await screen.findByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('World')).toBeInTheDocument()
  })

  it('renders a label, required asterisk and helper text', () => {
    render(<RichTextEditor label="Body" required helperText="Required field" aria-label="E" />)
    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
    expect(screen.getByText('Required field')).toBeInTheDocument()
  })

  it('is read-only when disabled', () => {
    render(<RichTextEditor disabled defaultValue="<p>x</p>" aria-label="E" />)
    expect(screen.getByRole('textbox', { name: 'E' })).toHaveAttribute('contenteditable', 'false')
  })
})

describe('toVideoEmbedSrc', () => {
  it('normalizes YouTube watch / short / youtu.be links to the embed URL', () => {
    const embed = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    expect(toVideoEmbedSrc('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(embed)
    expect(toVideoEmbedSrc('https://youtu.be/dQw4w9WgXcQ')).toBe(embed)
    expect(toVideoEmbedSrc('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(embed) // idempotent
  })

  it('normalizes Vimeo links to the player URL', () => {
    expect(toVideoEmbedSrc('https://vimeo.com/123456789')).toBe(
      'https://player.vimeo.com/video/123456789',
    )
  })

  it('leaves direct file / unknown URLs unchanged', () => {
    expect(toVideoEmbedSrc('https://cdn.example.com/clip.mp4')).toBe(
      'https://cdn.example.com/clip.mp4',
    )
  })
})
