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
import { $setBlocksType } from '@lexical/selection'
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from '@lexical/utils'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import type { IconName } from '../../icons/names'
import { Button } from '../Button'
import { Divider } from '../Divider'
import { Dropdown } from '../Dropdown'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { ListItem } from '../List'
import { $createImageNode } from './nodes/ImageNode'
import { $createVideoNode } from './nodes/VideoNode'
import styles from './RichTextEditor.module.css'

type Size = 'sm' | 'md' | 'lg'
type BlockType = 'paragraph' | HeadingTagType | 'quote' | 'bullet' | 'number' | 'check'

/** Full block-type labels — the dropdown trigger reads this for the current block (incl. Quote). */
const BLOCK_LABEL: Record<BlockType, string> = {
  paragraph: 'Paragraph',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  quote: 'Quote',
  bullet: 'Bullet List',
  number: 'Numbered List',
  check: 'Check List',
}

/** Items in the block-type dropdown — Quote is a standalone toolbar button; check lists are excluded. */
const BLOCKS: { type: BlockType; icon?: IconName }[] = [
  { type: 'paragraph', icon: 'Text' },
  { type: 'h1', icon: 'Hashtag' },
  { type: 'h2', icon: 'Hashtag' },
  { type: 'h3', icon: 'Hashtag' },
  { type: 'bullet' },
  { type: 'number' },
]

/** Text-alignment controls (set the block element's `text-align`). */
const ALIGNS: { value: ElementFormatType; label: string; icon: IconName }[] = [
  { value: 'left', label: 'Align left', icon: 'TextalignLeft' },
  { value: 'center', label: 'Align center', icon: 'TextalignCenter' },
  { value: 'right', label: 'Align right', icon: 'TextalignRight' },
]

export interface ToolbarProps {
  size: Size
  disabled: boolean
  /** Optional async upload — when set, an inserted image uses the returned URL instead of a base64 data URL. */
  onImageUpload?: (file: File) => Promise<string>
}

/** The editor toolbar — reads the live selection and dispatches Lexical commands. */
export function Toolbar({ size, disabled, onImageUpload }: ToolbarProps) {
  const [editor] = useLexicalComposerContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const [blockType, setBlockType] = useState<BlockType>('paragraph')
  const [elementFormat, setElementFormat] = useState<ElementFormatType>('left')
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const syncState = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return
    setIsBold(selection.hasFormat('bold'))
    setIsItalic(selection.hasFormat('italic'))
    setIsUnderline(selection.hasFormat('underline'))

    const anchorNode = selection.anchor.getNode()
    setIsLink($isLinkNode(anchorNode) || $isLinkNode(anchorNode.getParent()))

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

  const insertLink = () => {
    const url = window.prompt('Link URL (leave empty to remove)')
    if (url === null) return
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url.trim() === '' ? null : url.trim())
  }

  const insertImageByUrl = () => {
    const url = window.prompt('Image URL')?.trim()
    if (!url) return
    editor.update(() => $insertNodeToNearestRoot($createImageNode(url)))
  }

  const onImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = '' // allow re-picking the same file
    if (!file) return
    const url = onImageUpload ? await onImageUpload(file) : await fileToDataUrl(file)
    editor.update(() => $insertNodeToNearestRoot($createImageNode(url, file.name)))
  }

  const insertVideo = () => {
    const url = window.prompt('Video URL (YouTube, Vimeo, or a direct file)')?.trim()
    if (!url) return
    editor.update(() => $insertNodeToNearestRoot($createVideoNode(url)))
  }

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

  return (
    <div
      className={styles.toolbar}
      role="toolbar"
      aria-label="Formatting"
      aria-orientation="horizontal"
    >
      <IconButton
        variant="text"
        color="primary"
        size={size}
        disabled={disabled || !canUndo}
        aria-label="Undo"
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
        aria-label="Redo"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        <Icon name="RedoArrow" />
      </IconButton>

      <Divider orientation="vertical" />

      {fmtBtn(isBold, 'Bold', () => format('bold'), <Icon name="TextBold" />)}
      {fmtBtn(isItalic, 'Italic', () => format('italic'), <Icon name="TextItalic" />)}
      {fmtBtn(isUnderline, 'Underline', () => format('underline'), <Icon name="TextUnderline" />)}

      <Divider orientation="vertical" />

      <Dropdown
        size={size}
        disabled={disabled}
        trigger={
          <Button variant="text" color="primary" size={size} endIcon={<Icon name="ArrowDown4" />}>
            {BLOCK_LABEL[blockType]}
          </Button>
        }
      >
        {BLOCKS.map((b) => (
          <ListItem
            key={b.type}
            clickable
            selected={blockType === b.type}
            icon={b.icon}
            onClick={() => applyBlock(b.type)}
          >
            {BLOCK_LABEL[b.type]}
          </ListItem>
        ))}
      </Dropdown>

      {fmtBtn(blockType === 'quote', 'Quote', toggleQuote, <Icon name="QuoteUp" />)}

      <Divider orientation="vertical" />

      {ALIGNS.map((a) =>
        fmtBtn(
          elementFormat === a.value,
          a.label,
          () => applyAlign(a.value),
          <Icon name={a.icon} />,
          a.value,
        ),
      )}

      <Divider orientation="vertical" />

      {fmtBtn(isLink, 'Insert link', insertLink, <Icon name="Link2" />)}

      <Dropdown
        size={size}
        disabled={disabled}
        minWidth={false}
        trigger={
          <IconButton variant="text" color="primary" size={size} aria-label="Insert image">
            <Icon name="GalleryAdd" />
          </IconButton>
        }
      >
        <ListItem clickable icon="GalleryImport" onClick={() => fileInputRef.current?.click()}>
          Upload image
        </ListItem>
        <ListItem clickable icon="Link" onClick={insertImageByUrl}>
          By URL
        </ListItem>
      </Dropdown>

      <IconButton
        variant="text"
        color="primary"
        size={size}
        disabled={disabled}
        aria-label="Insert video"
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
