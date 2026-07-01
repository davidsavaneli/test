import { clsx } from 'clsx'
import { Icon } from '../Icon'
import { Overlay } from '../Overlay/Overlay'
import styles from './FileUploaderPreview.module.css'

export interface FileUploaderPreviewProps {
  /** The media URL (a File's object URL or a source URL). */
  url: string
  /** Render a `<video controls>` instead of an `<img>`. */
  isVideo: boolean
  /**
   * The image is an SVG — a vector has no reliable pixel size (a viewBox-only icon shows tiny, a sizeless
   * one collapses to nothing), so when set the image is given a floored box (`min-*` + `object-fit:
   * contain`): a small SVG scales up to a visible minimum while a larger one keeps its real size.
   */
  isSvg?: boolean
  /** Accessible name / image alt. */
  name: string
  /** Dismiss the overlay. */
  onClose: () => void
}

/**
 * A fullscreen media lightbox for the FileUploader — a dark backdrop with the image (or a `<video>` with
 * controls) centered. Built on the shared `<Overlay>` (portal to `<body>`, scroll-lock, fade-in, backdrop
 * / Escape dismissal); a darker scrim (`dim={0.85}`) than a Modal since media reads over black. Opened
 * from a card's **Eye** button (image + video items only). Internal — not exported.
 */
export function FileUploaderPreview({
  url,
  isVideo,
  isSvg,
  name,
  onClose,
}: FileUploaderPreviewProps) {
  return (
    <Overlay
      open
      onClose={onClose}
      dim={0.85}
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${name}`}
    >
      <button
        type="button"
        className={styles.close}
        aria-label="Close preview"
        onClick={onClose}
        autoFocus
      >
        <Icon name="Close" size="lg" />
      </button>
      {isVideo ? (
        <video src={url} className={styles.media} controls playsInline />
      ) : (
        // an SVG's natural size is unreliable, so it always gets the floored box (`.mediaSvg`); a raster
        // keeps its natural size, only capped to the viewport (`.media`)
        <img src={url} alt={name} className={clsx(styles.media, isSvg && styles.mediaSvg)} />
      )}
    </Overlay>
  )
}
