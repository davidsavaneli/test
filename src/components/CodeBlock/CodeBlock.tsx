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
import { useT } from '../../theme'
import { IconButton } from '../IconButton'
import { Icon } from '../Icon'
import { Tooltip } from '../Tooltip'
import styles from './CodeBlock.module.css'

// how long the copy button shows the "copied" tick before reverting
const COPIED_RESET_MS = 1600

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
  /** The source code to render. */
  code: string
  /** Shiki language id (`'tsx'`, `'json'`, `'bash'`, `'css'`, …). Defaults to `'tsx'`. */
  language?: string
  /** Header line (e.g. a filename) — adds a header bar above the code with the copy button in it. */
  title?: ReactNode
  /** Show a copy-to-clipboard button. Defaults to `true`. */
  copyable?: boolean
  /** Show line numbers. Defaults to `false`. */
  showLineNumbers?: boolean
  /** Cap the block height in px — taller code scrolls inside. */
  maxHeight?: number
  /** Soft-wrap long lines instead of scrolling horizontally. Defaults to `false`. */
  wrap?: boolean
}

/**
 * A syntax-highlighted code block with **VS Code colors** — powered by **Shiki** (an optional peer,
 * `npm i shiki`), the actual VS Code highlighting engine, using its **`dark-plus`** theme. The block
 * is **always dark** (in both app modes) — code reads best on a dark surface, and the deep background
 * anchors it regardless of the surrounding light/dark theme. Highlighting is **async and lazy**
 * (`import('shiki')` on first render); until it lands — or if `shiki` isn't installed / the language
 * is unknown — the block shows the plain code (on the same dark surface), so nothing breaks. `title`
 * adds a header bar (e.g. a filename); `copyable` (default `true`) shows a copy button that flips to a
 * tick; `showLineNumbers`, `maxHeight` (scrolls inside) and `wrap` shape the body. The whole block
 * keeps VS Code's own dark colors (a deliberate literal-color exception, like the Modal scrim); only
 * the outer border/radius uses `--tz-*` tokens.
 */
export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock(
  {
    code,
    language = 'tsx',
    title,
    copyable = true,
    showLineNumbers = false,
    maxHeight,
    wrap = false,
    className,
    style,
    ...props
  },
  ref,
) {
  const t = useT()
  const [html, setHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<number | undefined>(undefined)

  // highlight asynchronously — shiki is an optional peer, loaded lazily on first use; a missing
  // package or an unknown language just leaves the plain (unhighlighted) fallback in place
  useEffect(() => {
    let cancelled = false
    import('shiki')
      .then(({ codeToHtml }) =>
        codeToHtml(code, {
          lang: language,
          // always VS Code's dark theme — the block stays dark in both app modes
          theme: 'dark-plus',
        }),
      )
      .then((out) => {
        if (!cancelled) setHtml(out)
      })
      .catch(() => {
        if (!cancelled) setHtml(null)
      })
    return () => {
      cancelled = true
    }
  }, [code, language])

  useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  const handleCopy = () => {
    navigator.clipboard
      ?.writeText(code)
      .then(() => {
        setCopied(true)
        window.clearTimeout(copyTimer.current)
        copyTimer.current = window.setTimeout(() => setCopied(false), COPIED_RESET_MS)
      })
      .catch(() => {})
  }

  const copyButton = copyable && (
    // the tooltip is hover/focus-driven; clicking flips `copied`, so its content updates to "Copied!"
    // while it's still open (the pointer is on the button). `left` keeps it inside the block's
    // `overflow: hidden` bounds.
    <Tooltip
      content={copied ? t('codeBlock.copied') : t('codeBlock.copy')}
      placement="left"
      // always a white pill with dark text over the (always-dark) block — set via `style` so it beats
      // Tooltip's own color-derived --tz-btn-rgb (which is spread before the consumer `style`)
      style={{ '--tz-btn-rgb': '255, 255, 255', '--tz-btn-on': '#1e1e1e' } as CSSProperties}
    >
      <IconButton
        variant="text"
        size="sm"
        className={styles.copy}
        // force the button light over the dark surface — passed via `style` so it beats IconButton's
        // own inline `--tz-btn-rgb` (which is spread before the consumer `style`, so this wins)
        style={{ '--tz-btn-rgb': '255, 255, 255' } as CSSProperties}
        aria-label={copied ? t('codeBlock.copied') : t('codeBlock.copy')}
        onClick={handleCopy}
      >
        <Icon name={copied ? 'CopySuccess' : 'Copy'} />
      </IconButton>
    </Tooltip>
  )

  return (
    <div ref={ref} className={clsx(styles.root, className)} style={style} {...props}>
      {title != null && (
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          {copyButton}
        </div>
      )}
      <div
        className={clsx(
          styles.code,
          wrap && styles.wrap,
          showLineNumbers && styles.lineNumbers,
          title == null && styles.padForCopy,
        )}
        style={maxHeight != null ? ({ maxHeight } as CSSProperties) : undefined}
      >
        {html != null ? (
          // shiki output is trusted markup — it escapes the source code itself
          <div className={styles.highlighted} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className={styles.plain}>
            <code>{code}</code>
          </pre>
        )}
      </div>
      {/* with no header the copy button floats over the code's top-right corner */}
      {title == null && copyButton && <div className={styles.floatingCopy}>{copyButton}</div>}
    </div>
  )
})
