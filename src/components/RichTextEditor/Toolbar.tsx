import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createParagraphNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  type ElementFormatType,
  type TextFormatType,
} from 'lexical'
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  type HeadingTagType,
} from '@lexical/rich-text'
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from '@lexical/list'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { sanitizeLinkUrl } from './urlSafety'
import { toast } from '../Toast/toastStore'
import { useT, type MessageKey } from '../../theme'
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
  $setBlocksType,
} from '@lexical/selection'
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from '@lexical/utils'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import type { IconName } from '../../icons/names'
import { Button } from '../Button'
import { ColorPickerPanel, DEFAULT_SWATCHES } from '../ColorPicker/ColorPickerPanel'
import { Divider } from '../Divider'
import { Dropdown } from '../Dropdown'
import { FloatingPanel } from '../FloatingPanel/FloatingPanel'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { ListItem } from '../List'
import { Modal } from '../Modal'
import { TextField } from '../TextField'
import { $createImageNode } from './nodes/ImageNode'
import { $createVideoNode } from './nodes/VideoNode'
import styles from './RichTextEditor.module.css'

type Size = 'sm' | 'md' | 'lg'
type BlockType = 'paragraph' | HeadingTagType | 'quote' | 'bullet' | 'number' | 'check'

// Block-type labels stay **English in every language** by design — "Paragraph" / "Heading" are
// editor-standard terms the maintainer prefers untranslated, so these are literals, not i18n keys.
const BLOCK_LABEL: Partial<Record<BlockType, string>> = {
  paragraph: 'Paragraph',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  quote: 'Quote',
  bullet: 'Bullet List',
  number: 'Numbered List',
  check: 'Check List',
}

/** Items in the block-type dropdown — lists & quote are standalone toolbar buttons; check lists are excluded. */
const BLOCKS: { type: BlockType; icon?: IconName }[] = [
  { type: 'paragraph', icon: 'Text' },
  { type: 'h1', icon: 'Hashtag' },
  { type: 'h2', icon: 'Hashtag' },
  { type: 'h3', icon: 'Hashtag' },
]

/** Text-alignment controls (set the block element's `text-align`); `labelKey` resolves via `t`. */
const ALIGNS: { value: ElementFormatType; labelKey: MessageKey; icon: IconName }[] = [
  { value: 'left', labelKey: 'rte.alignLeft', icon: 'TextalignLeft' },
  { value: 'center', labelKey: 'rte.alignCenter', icon: 'TextalignCenter' },
  { value: 'right', labelKey: 'rte.alignRight', icon: 'TextalignRight' },
]

/** Font-size options (the `font-size` style value). */
const FONT_SIZES = ['10px', '12px', '14px', '16px', '18px', '20px']

/** The editor's default content size per `size` (mirrors `.content` in the CSS) — shown active when the
 * selection has no explicit `font-size`. */
const DEFAULT_FONT_SIZE: Record<Size, string> = { sm: '12px', md: '14px', lg: '16px' }

/** Config for the shared URL-input `Modal` (link / image-by-URL / video) — replaces `window.prompt`. */
type UrlDialog = {
  icon: IconName
  title: string
  label: string
  placeholder: string
  confirmLabel: string
  onConfirm: (url: string) => void
}

/** The text-color button glyph — a brush icon with a corner triangle tinted with the current text
 * color (so the selected color is always visible). Accepts the `size` `IconButton` injects so it
 * doesn't hit the DOM. */
function ColorGlyph({ color, size }: { color: string; size?: Size }) {
  return (
    <span className={styles.colorGlyph}>
      <Icon name="Brush" size={size} />
      <span
        className={styles.colorBar}
        style={{ borderColor: `transparent transparent ${color || 'currentColor'} transparent` }}
        aria-hidden="true"
      />
    </span>
  )
}

export interface ToolbarProps {
  size: Size
  disabled: boolean
  /** Optional async upload — when set, an inserted image uses the returned URL instead of a base64 data URL. */
  onImageUpload?: (file: File) => Promise<string>
}

/** The editor toolbar — reads the live selection and dispatches Lexical commands. */
export function Toolbar({ size, disabled, onImageUpload }: ToolbarProps) {
  const t = useT()
  const blockLabel = (b: BlockType): string => BLOCK_LABEL[b] ?? b // h4–h6 aren't offered by the editor
  const [editor] = useLexicalComposerContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [blockType, setBlockType] = useState<BlockType>('paragraph')
  const [elementFormat, setElementFormat] = useState<ElementFormatType>('left')
  const [fontSize, setFontSize] = useState('')
  const [textColor, setTextColor] = useState('')
  const [colorOpen, setColorOpen] = useState(false)
  const colorTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  // shared URL-input modal (link / image-by-URL / video)
  const [urlDialog, setUrlDialog] = useState<UrlDialog | null>(null)
  const [urlValue, setUrlValue] = useState('')

  const syncState = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return
    setIsBold(selection.hasFormat('bold'))
    setIsItalic(selection.hasFormat('italic'))
    setIsUnderline(selection.hasFormat('underline'))
    setTextColor($getSelectionStyleValueForProperty(selection, 'color', ''))
    setFontSize($getSelectionStyleValueForProperty(selection, 'font-size', ''))

    const anchorNode = selection.anchor.getNode()
    const parent = anchorNode.getParent()
    const linkNode = $isLinkNode(anchorNode) ? anchorNode : $isLinkNode(parent) ? parent : null
    setIsLink(linkNode !== null)
    setLinkUrl(linkNode?.getURL() ?? '')

    // the block element under the cursor — drives both the alignment and block-type state
    const element =
      anchorNode.getKey() === 'root'
        ? anchorNode
        : ($findMatchingParent(anchorNode, (e) => {
            const parent = e.getParent()
            return parent === null || parent.getKey() === 'root'
          }) ?? anchorNode.getTopLevelElement())

    setElementFormat(($isElementNode(element) && element.getFormatType()) || 'left')

    const listNode = $getNearestNodeOfType(anchorNode, ListNode)
    if (listNode) setBlockType(listNode.getListType())
    else if ($isHeadingNode(element)) setBlockType(element.getTag())
    else if ($isQuoteNode(element)) setBlockType('quote')
    else setBlockType('paragraph')
  }, [])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => editorState.read(syncState)),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          syncState()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload)
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload)
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, syncState])

  const format = (type: TextFormatType) => editor.dispatchCommand(FORMAT_TEXT_COMMAND, type)

  const applyAlign = (fmt: ElementFormatType) => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, fmt)

  // apply the picked color to the (retained) selection; `''` clears it back to the default
  const applyColor = (color: string) => {
    setTextColor(color)
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) $patchStyleText(selection, { color: color || null })
    })
  }

  // apply a font size to the (retained) selection; `''` clears it back to the editor default
  const applyFontSize = (value: string) => {
    setFontSize(value)
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) $patchStyleText(selection, { 'font-size': value || null })
    })
  }

  const applyBlock = (type: BlockType) => {
    if (type === 'bullet' || type === 'number' || type === 'check') {
      if (blockType === type) {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
      } else {
        const command =
          type === 'bullet'
            ? INSERT_UNORDERED_LIST_COMMAND
            : type === 'number'
              ? INSERT_ORDERED_LIST_COMMAND
              : INSERT_CHECK_LIST_COMMAND
        editor.dispatchCommand(command, undefined)
      }
      return
    }
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      if (type === 'paragraph') $setBlocksType(selection, () => $createParagraphNode())
      else if (type === 'quote') $setBlocksType(selection, () => $createQuoteNode())
      else $setBlocksType(selection, () => $createHeadingNode(type))
    })
  }

  const toggleQuote = () => applyBlock(blockType === 'quote' ? 'paragraph' : 'quote')

  // open the shared URL modal (prefilled value + handler differ per action)
  const openUrlDialog = (config: UrlDialog, initial = '') => {
    setUrlValue(initial)
    setUrlDialog(config)
  }
  const closeUrlDialog = () => setUrlDialog(null)
  const confirmUrlDialog = () => {
    urlDialog?.onConfirm(urlValue.trim())
    setUrlDialog(null)
  }

  const insertLink = () =>
    openUrlDialog(
      {
        icon: 'Link2',
        title: t('rte.linkTitle'),
        label: t('rte.linkUrl'),
        placeholder: 'https://example.com',
        confirmLabel: isLink ? t('common.update') : t('common.insert'),
        // an empty value removes the link (matches the old prompt behavior); sanitize the scheme
        onConfirm: (url) =>
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, url === '' ? null : sanitizeLinkUrl(url)),
      },
      linkUrl, // prefill the current link's URL when the cursor sits in one
    )

  const insertImageByUrl = () =>
    openUrlDialog({
      icon: 'GalleryAdd',
      title: t('rte.imageTitle'),
      label: t('rte.imageUrl'),
      placeholder: 'https://example.com/image.jpg',
      confirmLabel: t('common.insert'),
      onConfirm: (url) => {
        if (url) editor.update(() => $insertNodeToNearestRoot($createImageNode(url)))
      },
    })

  const onImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = '' // allow re-picking the same file
    if (!file) return
    try {
      const url = onImageUpload ? await onImageUpload(file) : await fileToDataUrl(file)
      editor.update(() => $insertNodeToNearestRoot($createImageNode(url, file.name)))
    } catch {
      // a rejecting consumer upload handler (or a failed data-URL read) shouldn't fail silently
      toast.error(t('rte.imageError'))
    }
  }

  const insertVideo = () =>
    openUrlDialog({
      icon: 'VideoSquare',
      title: t('rte.videoTitle'),
      label: t('rte.videoUrl'),
      placeholder: t('rte.videoUrlPlaceholder'),
      confirmLabel: t('common.insert'),
      onConfirm: (url) => {
        if (url) editor.update(() => $insertNodeToNearestRoot($createVideoNode(url)))
      },
    })

  /** A format toggle — soft-filled while active. */
  const fmtBtn = (
    active: boolean,
    label: string,
    onClick: () => void,
    child: React.ReactNode,
    key?: string,
  ) => (
    <IconButton
      key={key}
      variant={active ? 'filled' : 'text'}
      color="primary"
      size={size}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()} // keep focus/selection in the editor
      onClick={onClick}
    >
      {child}
    </IconButton>
  )

  // the block dropdown only manages Paragraph / Headings — lists & quote are separate toggle buttons,
  // so when the cursor is in a list/quote/check the trigger shows "Paragraph", not e.g. "Bullet List".
  const dropdownBlock: BlockType = blockType.startsWith('h') ? blockType : 'paragraph'

  // font-size shown active: the selection's explicit size, else the editor's default for this `size`
  const effectiveFontSize = fontSize || DEFAULT_FONT_SIZE[size]

  return (
    <div
      className={styles.toolbar}
      role="toolbar"
      aria-label={t('rte.formatting')}
      aria-orientation="horizontal"
    >
      <IconButton
        variant="text"
        color="primary"
        size={size}
        disabled={disabled || !canUndo}
        aria-label={t('rte.undo')}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        <Icon name="UndoArrow" />
      </IconButton>
      <IconButton
        variant="text"
        color="primary"
        size={size}
        disabled={disabled || !canRedo}
        aria-label={t('rte.redo')}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        <Icon name="RedoArrow" />
      </IconButton>

      <Divider orientation="vertical" />

      <Dropdown
        size={size}
        disabled={disabled}
        minWidth={false}
        trigger={
          <Button
            variant="text"
            color="primary"
            size={size}
            disabled={disabled}
            endIcon={<Icon name="ArrowDown4" />}
            aria-label={t('rte.fontSize')}
            onMouseDown={(e) => e.preventDefault()} // keep the selection while opening
          >
            {effectiveFontSize}
          </Button>
        }
      >
        {FONT_SIZES.map((f) => (
          <ListItem
            key={f}
            clickable
            selected={f === effectiveFontSize}
            onClick={() => applyFontSize(f)}
          >
            {f}
          </ListItem>
        ))}
      </Dropdown>

      <Divider orientation="vertical" />

      <Dropdown
        size={size}
        disabled={disabled}
        trigger={
          <Button
            variant="text"
            color="primary"
            size={size}
            disabled={disabled}
            endIcon={<Icon name="ArrowDown4" />}
            onMouseDown={(e) => e.preventDefault()} // keep the selection while opening
          >
            {blockLabel(dropdownBlock)}
          </Button>
        }
      >
        {BLOCKS.map((b) => (
          <ListItem
            key={b.type}
            clickable
            selected={dropdownBlock === b.type}
            icon={b.icon}
            onClick={() => applyBlock(b.type)}
          >
            {blockLabel(b.type)}
          </ListItem>
        ))}
      </Dropdown>

      <Divider orientation="vertical" />

      {fmtBtn(isBold, t('rte.bold'), () => format('bold'), <Icon name="TextBold" />)}
      {fmtBtn(isItalic, t('rte.italic'), () => format('italic'), <Icon name="TextItalic" />)}
      {fmtBtn(
        isUnderline,
        t('rte.underline'),
        () => format('underline'),
        <Icon name="TextUnderline" />,
      )}

      <Divider orientation="vertical" />

      {fmtBtn(
        blockType === 'bullet',
        t('rte.bulletList'),
        () => applyBlock('bullet'),
        <Icon name="ListBullet" />,
      )}
      {fmtBtn(
        blockType === 'number',
        t('rte.numberedList'),
        () => applyBlock('number'),
        <Icon name="ListNumber" />,
      )}
      {fmtBtn(blockType === 'quote', t('rte.quote'), toggleQuote, <Icon name="QuoteUp" />)}

      <Divider orientation="vertical" />

      {ALIGNS.map((a) =>
        fmtBtn(
          elementFormat === a.value,
          t(a.labelKey),
          () => applyAlign(a.value),
          <Icon name={a.icon} />,
          a.value,
        ),
      )}

      <Divider orientation="vertical" />

      <IconButton
        ref={colorTriggerRef}
        variant="text"
        color="primary"
        size={size}
        disabled={disabled}
        aria-label={t('rte.textColor')}
        aria-expanded={colorOpen}
        onMouseDown={(e) => e.preventDefault()} // keep the editor's selection while opening
        onClick={() => setColorOpen((o) => !o)}
      >
        <ColorGlyph color={textColor} />
      </IconButton>
      <FloatingPanel
        open={colorOpen}
        triggerRef={colorTriggerRef}
        onClose={(refocus) => {
          setColorOpen(false)
          if (refocus) colorTriggerRef.current?.focus()
        }}
        role="dialog"
        ariaLabel={t('rte.textColor')}
        width={232}
      >
        {/* no "no color" swatch; with no explicit color the accent default (first swatch) shows selected */}
        <ColorPickerPanel
          value={textColor || DEFAULT_SWATCHES[0]}
          onChange={applyColor}
          clearable={false}
        />
      </FloatingPanel>

      {fmtBtn(isLink, t('rte.link'), insertLink, <Icon name="Link2" />)}

      <Dropdown
        size={size}
        disabled={disabled}
        minWidth={false}
        trigger={
          <IconButton
            variant="text"
            color="primary"
            size={size}
            disabled={disabled}
            aria-label={t('rte.insertImage')}
          >
            <Icon name="GalleryAdd" />
          </IconButton>
        }
      >
        <ListItem clickable icon="GalleryImport" onClick={() => fileInputRef.current?.click()}>
          {t('rte.uploadImage')}
        </ListItem>
        <ListItem clickable icon="Link" onClick={insertImageByUrl}>
          {t('rte.imageByUrl')}
        </ListItem>
      </Dropdown>

      <IconButton
        variant="text"
        color="primary"
        size={size}
        disabled={disabled}
        aria-label={t('rte.insertVideo')}
        onClick={insertVideo}
      >
        <Icon name="VideoSquare" />
      </IconButton>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onImageFile}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* shared URL-input dialog for link / image-by-URL / video (replaces window.prompt). The footer
          Submit drives the body <form> via the `form` attribute (works across the modal's portal). */}
      <Modal
        open={urlDialog !== null}
        onClose={closeUrlDialog}
        size="sm"
        icon={urlDialog?.icon}
        title={urlDialog?.title}
        footer={
          <>
            <Button variant="text" onClick={closeUrlDialog}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="rte-url-form">
              {urlDialog?.confirmLabel ?? t('common.insert')}
            </Button>
          </>
        }
      >
        <form
          id="rte-url-form"
          onSubmit={(e) => {
            e.preventDefault()
            confirmUrlDialog()
          }}
        >
          <TextField
            label={urlDialog?.label}
            placeholder={urlDialog?.placeholder}
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  )
}

/** Reads a picked file into a base64 `data:` URL (the no-backend default for image upload). */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
