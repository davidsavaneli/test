import { useRef, useState, type ChangeEvent } from 'react'
import ReactCrop, { type Crop, type PercentCrop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { useT, type LocaleConfig } from '../../theme'
import { Button } from '../Button'
import { Modal } from '../Modal'
import { TextField } from '../TextField'
import { Typography } from '../Typography'
import styles from './FileUploaderEditDialog.module.css'

/** What a dialog hands back on Save: the alt-text draft (alt-text mode) or a cropped File (crop mode). */
export interface EditDialogResult {
  /** Alt-text values keyed by locale code (or the single `''` key in non-localized mode). */
  draft?: Record<string, string>
  /** A freshly-cropped File (native-resolution, lossless). */
  croppedFile?: File
}

export interface FileUploaderEditDialogProps {
  /** Which editor to show — the **crop** stage or the **alt text** fields (each is its own modal). */
  mode: 'crop' | 'altText'
  /** Display name (modal description + the cropped File's name). */
  name: string
  /** Image URL for crop mode (object URL for a File, or the source URL). */
  imageUrl: string | null
  /** MIME type for the cropped output — keeps the original (PNG ⇒ lossless). */
  mimeType: string
  /** Locales for the alt-text editor (one field each); a single `{ code: '' }` ⇒ one plain field. */
  editLocales: LocaleConfig[]
  /** The alt-text draft to seed from the item's current value. */
  initialDraft: Record<string, string>
  /** Close without saving. */
  onClose: () => void
  /** Commit the result (alt-text draft or cropped File). */
  onSave: (result: EditDialogResult) => void
}

/** The crop selection in the image's NATIVE pixels — what actually gets exported (no resample / resize). */
interface NaturalCrop {
  x: number
  y: number
  width: number
  height: number
}

/**
 * The FileUploader per-item edit modal. Two separate modes (each opened from its own card button):
 * **`crop`** — a draggable selection over the image, exported at the image's native resolution (lossless,
 * dimensions shown live); **`altText`** — one `TextField` per locale (stacked, no tabs). Built on the
 * library's `Modal` + `TextField` and **`react-image-crop`** (an optional peer). Internal — not exported.
 */
export function FileUploaderEditDialog({
  mode,
  name,
  imageUrl,
  mimeType,
  editLocales,
  initialDraft,
  onClose,
  onSave,
}: FileUploaderEditDialogProps) {
  const t = useT()
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  // store the crop in NATIVE coords (computed on every drag) so the export never depends on display size
  const [naturalCrop, setNaturalCrop] = useState<NaturalCrop | null>(null)
  // the image's intrinsic size (captured on load) — shown as the readout until a crop is selected
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>(initialDraft)
  const [cropError, setCropError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onCropChange = (px: PixelCrop, percent: PercentCrop) => {
    setCrop(percent)
    const img = imgRef.current
    if (img && img.width > 0 && px.width >= 1 && px.height >= 1) {
      const sx = img.naturalWidth / img.width
      const sy = img.naturalHeight / img.height
      setNaturalCrop({
        x: Math.round(px.x * sx),
        y: Math.round(px.y * sy),
        width: Math.round(px.width * sx),
        height: Math.round(px.height * sy),
      })
    } else {
      setNaturalCrop(null)
    }
  }

  // Crop at native resolution: copy the selected region 1:1 (no resample → no quality loss, no resize).
  const buildCroppedFile = async (): Promise<File | undefined> => {
    const image = imgRef.current
    if (!image || !naturalCrop || naturalCrop.width < 1 || naturalCrop.height < 1) return undefined
    const canvas = document.createElement('canvas')
    canvas.width = naturalCrop.width
    canvas.height = naturalCrop.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    ctx.imageSmoothingEnabled = false // 1:1 native-pixel copy — no resampling
    ctx.drawImage(
      image,
      naturalCrop.x,
      naturalCrop.y,
      naturalCrop.width,
      naturalCrop.height,
      0,
      0,
      naturalCrop.width,
      naturalCrop.height,
    )
    // toBlob throws on a cross-origin-tainted canvas — let handleSave catch it
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, 1))
    // a null blob is a failed export too (not just tainted) — throw so it surfaces as a crop error
    // instead of silently resolving to `undefined` and discarding the crop with no feedback
    if (!blob) throw new Error('canvas.toBlob returned null')
    return new File([blob], name, { type: mimeType, lastModified: Date.now() })
  }

  const handleSave = async () => {
    if (mode === 'altText') {
      onSave({ draft })
      return
    }
    setBusy(true)
    try {
      const croppedFile =
        naturalCrop && naturalCrop.width >= 1 && naturalCrop.height >= 1
          ? await buildCroppedFile()
          : undefined
      onSave({ croppedFile }) // parent commits + closes (this dialog unmounts)
    } catch {
      setCropError(t('fileUploader.cropError'))
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size={mode === 'crop' ? 'lg' : 'sm'}
      icon={mode === 'crop' ? 'Crop' : 'Text'}
      title={mode === 'crop' ? t('fileUploader.cropTitle') : t('fileUploader.altTitle')}
      description={name}
      footer={
        <>
          <Button variant="text" color="accent" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} loading={busy}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      {mode === 'crop' ? (
        <div className={styles.cropSection}>
          <div className={styles.cropHead}>
            <Typography variant="bodySmall" color="muted">
              {t('fileUploader.cropHint')}
            </Typography>
            <Typography variant="bodySmall" color={naturalCrop ? 'text' : 'muted'}>
              {naturalCrop
                ? `${naturalCrop.width} × ${naturalCrop.height} px`
                : naturalSize
                  ? `${naturalSize.w} × ${naturalSize.h} px`
                  : ''}
            </Typography>
          </div>
          <div className={styles.cropStage}>
            <ReactCrop crop={crop} onChange={onCropChange} className={styles.crop}>
              <img
                ref={imgRef}
                src={imageUrl ?? undefined}
                alt=""
                className={styles.cropImg}
                onLoad={(e) =>
                  setNaturalSize({
                    w: e.currentTarget.naturalWidth,
                    h: e.currentTarget.naturalHeight,
                  })
                }
              />
            </ReactCrop>
          </div>
          {cropError && (
            <Typography variant="bodySmall" color="error">
              {cropError}
            </Typography>
          )}
        </div>
      ) : (
        <div className={styles.altFields}>
          {editLocales.map((l) => (
            <TextField
              key={l.code}
              label={l.label ?? (l.code || t('fileUploader.altTitle'))}
              placeholder={t('fileUploader.altPlaceholder')}
              value={draft[l.code] ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDraft((d) => ({ ...d, [l.code]: e.target.value }))
              }
            />
          ))}
        </div>
      )}
    </Modal>
  )
}
