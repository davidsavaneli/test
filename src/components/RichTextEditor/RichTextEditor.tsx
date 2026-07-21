import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import {
  $createParagraphNode,
  $getRoot,
  $insertNodes,
  $isParagraphNode,
  $setSelection,
  type EditorThemeClasses,
} from 'lexical'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import {
  ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from '@lexical/markdown'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListItemNode, ListNode } from '@lexical/list'
import { LinkNode } from '@lexical/link'
import { sanitizeLinkUrl } from './urlSafety'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { useT } from '../../theme'
import { useFormContext } from '../../form/formContext'
import { Typography } from '../Typography'
import { Toolbar } from './Toolbar'
import { ImageNode } from './nodes/ImageNode'
import { VideoNode } from './nodes/VideoNode'
import styles from './RichTextEditor.module.css'

export type RichTextEditorSize = 'sm' | 'md' | 'lg'

/** Lexical node-type → CSS-module class map (so content is styled with `--tz-*` tokens). */
const THEME: EditorThemeClasses = {
  paragraph: styles.paragraph,
  heading: {
    h1: styles.h1,
    h2: styles.h2,
    h3: styles.h3,
    h4: styles.h4,
    h5: styles.h5,
    h6: styles.h6,
  },
  quote: styles.quote,
  list: {
    ul: styles.ul,
    ol: styles.ol,
    listitem: styles.li,
    listitemChecked: styles.liChecked,
    listitemUnchecked: styles.liUnchecked,
    nested: { listitem: styles.nestedLi },
  },
  link: styles.link,
  text: {
    bold: styles.bold,
    italic: styles.italic,
    underline: styles.underline,
    strikethrough: styles.strike,
    code: styles.codeInline,
  },
}

const EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  ImageNode,
  VideoNode,
]

/**
 * Markdown shortcuts for headings/quote/lists + inline formats + links. Excludes the multiline
 * fenced-code-block transformer (it needs `CodeNode`, which is out of scope for v1).
 */
const MARKDOWN_TRANSFORMERS = [
  ...ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
]

/**
 * Strips the editor's (hashed, CSS-module) `class` attributes from exported HTML so the value is clean,
 * portable markup (`<h2>` not `<h2 class="_h2_ab12">`). Classes aren't needed to re-import — parsing
 * keys off tag names — so this is round-trip-safe.
 */
function cleanExportedHtml(html: string): string {
  if (typeof document === 'undefined') return html
  const template = document.createElement('template')
  template.innerHTML = html
  template.content.querySelectorAll('[class]').forEach((el) => el.removeAttribute('class'))
  return template.innerHTML
}

/**
 * True when the editor holds nothing but an empty paragraph (Lexical's "blank" state, which serializes
 * to `<p><br></p>`). Lets the value emit `''` instead, so a cleared editor reads as truly empty (and a
 * `required` rule fires). Call inside an `editor.read`/`update`.
 */
function $isEditorEmpty(): boolean {
  const root = $getRoot()
  const first = root.getFirstChild()
  return (
    root.getChildrenSize() <= 1 &&
    (first === null || ($isParagraphNode(first) && first.getChildrenSize() === 0))
  )
}

/** Replaces the editor's content with the nodes parsed from an HTML string (call inside `editor.update`). */
function $setRootFromHtml(editor: Parameters<typeof $generateNodesFromDOM>[0], html: string) {
  const root = $getRoot()
  root.clear()
  if (html) {
    const dom = new DOMParser().parseFromString(html, 'text/html')
    const nodes = $generateNodesFromDOM(editor, dom)
    root.select()
    $insertNodes(nodes)
  }
  if (root.getChildrenSize() === 0) root.append($createParagraphNode())
  // clear the caret the insert left at the end of the content — otherwise Lexical scrolls it into
  // view when setting the initial/controlled value on mount, dragging the whole page down to a
  // below-the-fold editor (e.g. the prefilled RTEs on the Edit form). Focus re-places it later.
  $setSelection(null)
}

interface ValuePluginProps {
  value?: string
  defaultValue?: string
  onChange: (html: string) => void
  disabled: boolean
}

/** Bridges the HTML `value` ↔ the Lexical editor state, and toggles read-only mode. */
function ValuePlugin({ value, defaultValue, onChange, disabled }: ValuePluginProps) {
  const [editor] = useLexicalComposerContext()
  // the last HTML we wrote-in or emitted-out — guards the controlled-sync ↔ onChange feedback loop
  const lastHtml = useRef<string | undefined>(undefined)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => editor.setEditable(!disabled), [editor, disabled])

  // neutralize unsafe link schemes (javascript:, data:, …) on every LinkNode — covers pasted anchors
  // as well as toolbar inserts (which are also pre-sanitized), so no script URL survives into the value
  useEffect(
    () =>
      editor.registerNodeTransform(LinkNode, (node) => {
        const url = node.getURL()
        const safe = sanitizeLinkUrl(url)
        if (safe !== url) node.setURL(safe)
      }),
    [editor],
  )

  // initial defaultValue (uncontrolled) — once
  useEffect(() => {
    if (value !== undefined || !defaultValue) return
    lastHtml.current = defaultValue
    editor.update(() => $setRootFromHtml(editor, defaultValue), { tag: 'history-merge' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // controlled value → editor (only on a genuine external change, not our own echo)
  useEffect(() => {
    if (value === undefined || value === lastHtml.current) return
    lastHtml.current = value
    editor.update(() => $setRootFromHtml(editor, value), { tag: 'history-merge' })
  }, [editor, value])

  // editor → HTML out. NB: must be `editor.read` (not `editorState.read`) so the active editor is
  // bound — `$generateHtmlFromNodes` → node `createDOM` needs it, else it throws "no active editor".
  useEffect(
    () =>
      editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return
        editor.read(() => {
          const html = $isEditorEmpty()
            ? ''
            : cleanExportedHtml($generateHtmlFromNodes(editor, null))
          if (html === lastHtml.current) return
          lastHtml.current = html
          onChangeRef.current(html)
        })
      }),
    [editor],
  )

  return null
}

export interface RichTextEditorProps {
  /** Label rendered above the editor. */
  label?: ReactNode
  /** Preset size — drives toolbar density, content font size and min-height. */
  size?: RichTextEditorSize
  /** Marks the field invalid: red border/ring and `helperText` in the error color. */
  error?: boolean
  /** Helper / validation text under the editor. Adopts the error color while `error`. */
  helperText?: ReactNode
  /** Adds a red asterisk after the label (visual hint). */
  required?: boolean
  /** Read-only mode — the toolbar disables and the content isn't editable. */
  disabled?: boolean
  /** Placeholder shown while the editor is empty. */
  placeholder?: string
  /** Form field name — auto-binds value/validation to a surrounding `<Form>` (value = the HTML string). */
  name?: string
  /** Controlled HTML value. */
  value?: string
  /** Initial HTML value (uncontrolled). */
  defaultValue?: string
  /** Fires with the serialized **HTML** on every edit. */
  onChange?: (html: string) => void
  /**
   * Async image upload. When provided, an uploaded image is sent through this and the returned URL is
   * inserted; when omitted, the image is embedded inline as a base64 `data:` URL (no backend needed).
   */
  onImageUpload?: (file: File) => Promise<string>
  /** Min height of the editable area in px. Defaults to `220`. */
  minHeight?: number
  /** Accessible label for the editable region. Defaults to `'Rich text editor'`. */
  'aria-label'?: string
  className?: string
  style?: CSSProperties
}

/**
 * A rich text editor built on **Lexical** (an optional peer — install `lexical` + `@lexical/*`). Its
 * value is an **HTML string**: bold/italic/underline/strikethrough/inline-code, headings, lists
 * (bullet/ordered/check), links, block quote, plus **images** (insert by URL or upload — embedded as a
 * base64 `data:` URL unless an `onImageUpload` handler is given) and **video** embeds (paste a
 * YouTube/Vimeo/file URL). Markdown shortcuts work while typing (`# `, `- `, `> `, …). The toolbar is
 * built from the library's own `IconButton`/`Button`/`Dropdown`, and the content is styled entirely
 * with `--tz-*` tokens. Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`); inside a
 * `<Form>`, a `name` prop auto-binds the HTML value (validate with e.g. `z.string().min(1)`).
 */
export const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(
  function RichTextEditor(
    {
      label,
      size = 'md',
      error,
      helperText,
      required = false,
      disabled = false,
      placeholder,
      name,
      value,
      defaultValue,
      onChange,
      onImageUpload,
      minHeight = 220,
      'aria-label': ariaLabel = 'Rich text editor',
      className,
      style,
    },
    ref,
  ) {
    const t = useT()
    const form = useFormContext()
    const bound = form && name ? form.field(name) : undefined
    const resolvedError = error ?? bound?.error ?? false
    const resolvedHelperText = helperText ?? bound?.helperText

    const formValue = form && name ? (form.values as Record<string, unknown>)[name] : undefined
    const effValue =
      value !== undefined ? value : form && name ? String(formValue ?? '') : undefined

    const handleChange = useCallback(
      (html: string) => {
        if (form && name) form.setValue(name, html as never)
        onChange?.(html)
      },
      [form, name, onChange],
    )

    const handleBlur = (event: FocusEvent<HTMLDivElement>) => bound?.onBlur(event as never)

    // Mirror the form `name` onto the editable DOM node so a `<Form>`'s scroll-to-error can find and
    // focus it — the contenteditable isn't an `<input>`, and Lexical's `ContentEditable` doesn't take
    // a `name` prop, so set the attribute imperatively via a ref.
    const contentRef = useRef<HTMLDivElement | null>(null)
    useEffect(() => {
      const el = contentRef.current
      if (!el) return
      if (name) el.setAttribute('name', name)
      else el.removeAttribute('name')
    }, [name])

    const initialConfig = {
      namespace: 'tz-rich-text-editor',
      theme: THEME,
      nodes: EDITOR_NODES,
      editable: !disabled,
      onError: (e: Error) => {
        throw e
      },
    }

    return (
      <div
        ref={ref}
        className={clsx(
          styles.editor,
          styles[size],
          resolvedError && styles.error,
          disabled && styles.disabled,
          className,
        )}
        style={{ '--tz-rte-min-height': `${minHeight}px`, ...style } as CSSProperties}
      >
        {label != null && (
          <div className={styles.label}>
            <Typography as="span" variant="bodySmall" color="muted">
              {label}
            </Typography>
            {required && (
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            )}
          </div>
        )}

        <div className={styles.control}>
          <LexicalComposer initialConfig={initialConfig}>
            <Toolbar size={size} disabled={disabled} onImageUpload={onImageUpload} />
            <div className={styles.shell}>
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    ref={contentRef}
                    className={styles.content}
                    aria-label={ariaLabel}
                    aria-invalid={resolvedError || undefined}
                    onBlur={handleBlur}
                  />
                }
                placeholder={
                  <div className={styles.placeholder}>{placeholder ?? t('rte.placeholder')}</div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
            <HistoryPlugin />
            <ListPlugin />
            <CheckListPlugin />
            <LinkPlugin />
            <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
            <ValuePlugin
              value={effValue}
              defaultValue={defaultValue}
              onChange={handleChange}
              disabled={disabled}
            />
          </LexicalComposer>
        </div>

        {resolvedHelperText != null && (
          <Typography
            as="span"
            variant="bodySmall"
            color={resolvedError ? 'error' : 'muted'}
            className={styles.helper}
          >
            {resolvedHelperText}
          </Typography>
        )}
      </div>
    )
  },
)
