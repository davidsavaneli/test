import { createRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CodeBlock } from './CodeBlock'

// deterministic shiki stub — highlighting itself is VS Code's engine, verified in a real browser
const codeToHtml = vi.fn(
  async (code: string, _options?: Record<string, unknown>) =>
    `<pre class="shiki"><code><span class="line">${code.replace(/</g, '&lt;')}</span></code></pre>`,
)
vi.mock('shiki', () => ({
  codeToHtml: (code: string, options?: Record<string, unknown>) => codeToHtml(code, options),
}))

const CODE = "const answer = 42\nconsole.log('hi')"

beforeEach(() => {
  codeToHtml.mockClear()
})

describe('CodeBlock', () => {
  it('renders the plain code immediately, then swaps in the highlighted markup', async () => {
    const { container } = render(<CodeBlock code={CODE} language="ts" />)
    // the plain fallback is visible synchronously
    expect(container.querySelector('pre')).toHaveTextContent('const answer = 42')
    // shiki's output replaces it
    await waitFor(() => expect(container.querySelector('pre.shiki')).not.toBeNull())
  })

  it("passes the code and language to shiki with VS Code's dark theme", async () => {
    render(<CodeBlock code={CODE} language="json" />)
    await waitFor(() => expect(codeToHtml).toHaveBeenCalled())
    const [code, options] = codeToHtml.mock.calls[0]
    expect(code).toBe(CODE)
    expect(options).toMatchObject({ lang: 'json', theme: 'dark-plus' })
  })

  it('keeps the plain fallback when highlighting fails (missing peer / unknown language)', async () => {
    codeToHtml.mockRejectedValueOnce(new Error('unknown lang'))
    const { container } = render(<CodeBlock code={CODE} language="nope" />)
    await waitFor(() => expect(codeToHtml).toHaveBeenCalled())
    expect(container.querySelector('pre.shiki')).toBeNull()
    expect(container.querySelector('pre')).toHaveTextContent('const answer = 42')
  })

  it('copies the code and flips the button to the copied state', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<CodeBlock code={CODE} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(writeText).toHaveBeenCalledWith(CODE)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument())
  })

  it('shows a copy tooltip that flips to "Copied!" after the click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<CodeBlock code={CODE} />)
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent('Copy code')
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    await waitFor(() => expect(tip).toHaveTextContent('Copied!'))
  })

  it('hides the copy button with copyable={false}', () => {
    render(<CodeBlock code={CODE} copyable={false} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders the title header with the copy button inside it', () => {
    const { container } = render(<CodeBlock code={CODE} title="main.tsx" />)
    expect(screen.getByText('main.tsx')).toBeInTheDocument()
    // header path — no floating copy wrapper
    expect(container.querySelector('.floatingCopy')).toBeNull()
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument()
  })

  it('applies wrap / line-number classes and the maxHeight cap', () => {
    const { container } = render(
      <CodeBlock code={CODE} wrap showLineNumbers maxHeight={240} copyable={false} />,
    )
    const body = container.querySelector('.code')
    expect(body?.classList.contains('wrap')).toBe(true)
    expect(body?.classList.contains('lineNumbers')).toBe(true)
    expect((body as HTMLElement).style.maxHeight).toBe('240px')
  })

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<CodeBlock code={CODE} ref={ref} />)
    expect(ref.current?.tagName).toBe('DIV')
  })
})
