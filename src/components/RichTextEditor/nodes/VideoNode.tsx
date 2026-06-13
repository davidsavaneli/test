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

/** Serialized shape of a {@link VideoNode} (editor-state JSON). */
export type SerializedVideoNode = Spread<{ src: string }, SerializedLexicalNode>

/** A direct video file (rendered with `<video controls>` rather than an embed `<iframe>`). */
function isFileVideo(src: string): boolean {
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(src)
}

/**
 * Normalizes a pasted video URL into an embeddable one — YouTube/Vimeo watch links become their
 * `embed` form; everything else (incl. already-embed URLs and direct files) is returned unchanged,
 * so the conversion is idempotent across HTML round-trips.
 */
export function toVideoEmbedSrc(raw: string): string {
  const youtube = raw.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  )
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`
  const vimeo = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return raw
}

/** Rebuilds a `VideoNode` from a pasted/loaded `<iframe>` or `<video>` element. */
function convertVideoElement(domNode: HTMLElement): DOMConversionOutput | null {
  const src = domNode.getAttribute('src') || domNode.querySelector('source')?.getAttribute('src')
  if (src) return { node: $createVideoNode(src) }
  return null
}

/**
 * A block-level video node. Direct media files render with `<video controls>`; everything else is
 * treated as an embed and renders in a responsive `<iframe>` (YouTube/Vimeo links are normalized to
 * their embed URL). Serializes to a clean `<video>` / `<iframe>` for the HTML value.
 */
export class VideoNode extends DecoratorNode<ReactNode> {
  __src: string

  static getType(): string {
    return 'tz-video'
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(node.__src, node.__key)
  }

  constructor(src: string, key?: NodeKey) {
    super(key)
    this.__src = src
  }

  static importJSON(json: SerializedVideoNode): VideoNode {
    return $createVideoNode(json.src)
  }

  exportJSON(): SerializedVideoNode {
    return { ...super.exportJSON(), type: 'tz-video', version: 1, src: this.__src }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      iframe: () => ({ conversion: convertVideoElement, priority: 0 }),
      video: () => ({ conversion: convertVideoElement, priority: 0 }),
    }
  }

  exportDOM(): DOMExportOutput {
    if (isFileVideo(this.__src)) {
      const video = document.createElement('video')
      video.setAttribute('src', this.__src)
      video.setAttribute('controls', 'true')
      return { element: video }
    }
    const iframe = document.createElement('iframe')
    iframe.setAttribute('src', this.__src)
    iframe.setAttribute('frameborder', '0')
    iframe.setAttribute('allowfullscreen', 'true')
    iframe.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
    )
    return { element: iframe }
  }

  /** A block wrapper; the actual media element is rendered by {@link decorate}. */
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

  decorate(): ReactNode {
    if (isFileVideo(this.__src)) return <video src={this.__src} controls />
    return (
      <div className="tz-rte-embed">
        <iframe
          src={this.__src}
          title="Embedded video"
          frameBorder={0}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }
}

/** Creates a `VideoNode`, normalizing the URL to an embeddable one (use inside an `editor.update`). */
export function $createVideoNode(src: string): VideoNode {
  return $applyNodeReplacement(new VideoNode(toVideoEmbedSrc(src)))
}

/** Type guard for `VideoNode`. */
export function $isVideoNode(node: LexicalNode | null | undefined): node is VideoNode {
  return node instanceof VideoNode
}
