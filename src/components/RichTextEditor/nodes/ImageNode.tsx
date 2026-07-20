import {
  $applyNodeReplacement,
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical'
import type { ReactNode } from 'react'
import { sanitizeMediaUrl } from '../urlSafety'

/** Serialized shape of an {@link ImageNode} (editor-state JSON). */
export type SerializedImageNode = Spread<{ src: string; alt: string }, SerializedLexicalNode>

/** Rebuilds an `ImageNode` from a pasted/loaded `<img>` element. */
function convertImageElement(domNode: HTMLElement): DOMConversionOutput | null {
  if (domNode instanceof HTMLImageElement && domNode.src) {
    return { node: $createImageNode(domNode.getAttribute('src') ?? domNode.src, domNode.alt) }
  }
  return null
}

/**
 * A block-level image node. Renders a plain `<img>` (the `src` may be a remote URL or a base64
 * `data:` URL when inserted via upload). Serializes to a clean `<img src alt>` for the HTML value and
 * parses back from any `<img>` on paste/load.
 */
export class ImageNode extends DecoratorNode<ReactNode> {
  __src: string
  __alt: string

  static getType(): string {
    return 'tz-image'
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__alt, node.__key)
  }

  constructor(src: string, alt = '', key?: NodeKey) {
    super(key)
    // sanitize here so every path (insert, paste import, JSON load, clone) gets a safe scheme
    this.__src = sanitizeMediaUrl(src)
    this.__alt = alt
  }

  static importJSON(json: SerializedImageNode): ImageNode {
    return $createImageNode(json.src, json.alt)
  }

  exportJSON(): SerializedImageNode {
    return { ...super.exportJSON(), type: 'tz-image', version: 1, src: this.__src, alt: this.__alt }
  }

  static importDOM(): DOMConversionMap | null {
    return { img: () => ({ conversion: convertImageElement, priority: 0 }) }
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img')
    element.setAttribute('src', this.__src)
    element.setAttribute('alt', this.__alt)
    return { element }
  }

  /** A block wrapper; the actual `<img>` is rendered by {@link decorate}. */
  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.style.display = 'contents'
    return div
  }

  updateDOM(): false {
    return false
  }

  getSrc(): string {
    return this.__src
  }

  getAltText(): string {
    return this.__alt
  }

  decorate(): ReactNode {
    return <img src={this.__src} alt={this.__alt} draggable={false} />
  }
}

/** Creates an `ImageNode` (use inside an `editor.update`). */
export function $createImageNode(src: string, alt = ''): ImageNode {
  return $applyNodeReplacement(new ImageNode(src, alt))
}

/** Type guard for `ImageNode`. */
export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode
}
