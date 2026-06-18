import { forwardRef, useState, type ReactNode } from 'react'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { Modal } from '../Modal'
import { Typography } from '../Typography'
import styles from './RemoveDialog.module.css'

export interface RemoveDialogProps {
  /** Whether the dialog is open. */
  open: boolean
  /** Called on Cancel, the × button, backdrop, or Escape (ignored while a confirm is in flight). */
  onClose: () => void
  /**
   * The destructive action. May be async — while its promise is pending the Delete button shows a
   * loader and the dialog locks (no dismiss); on success the dialog **auto-closes**, on rejection it
   * stays open so the user can retry (surface the error yourself, e.g. a toast).
   */
  onConfirm: () => void | Promise<void>
  /** Header title. Defaults to `"Remove"`. */
  title?: ReactNode
  /** Body prompt shown under the icon. Defaults to `"Are you sure you want to delete?"`. */
  message?: ReactNode
  /** Confirm (destructive) button label. Defaults to `"Delete"`. */
  confirmLabel?: string
  /** Cancel button label. Defaults to `"Cancel"`. */
  cancelLabel?: string
  /** External loading override — combined with the internal async-confirm state. */
  loading?: boolean
}

/**
 * A ready-made delete confirmation — a thin convenience wrapper over `Modal` for the ubiquitous
 * "Are you sure you want to delete?" prompt. Hardcodes the destructive flavor (a `Trash` glyph in a
 * soft error circle + an `error` Delete button); just wire `open` / `onClose` / `onConfirm`. An async
 * `onConfirm` drives the button loader and locks dismissal, then auto-closes on success. Built on
 * `Modal`, so it inherits the portal, scroll-lock, focus-trap, and backdrop/Escape dismissal.
 *
 * @example
 * const { isOpen, open, close } = useDisclosure()
 * <RemoveDialog open={isOpen} onClose={close} onConfirm={() => deleteItem(id)} />
 */
export const RemoveDialog = forwardRef<HTMLDivElement, RemoveDialogProps>(function RemoveDialog(
  {
    open,
    onClose,
    onConfirm,
    title = 'Remove',
    message = 'Are you sure you want to delete?',
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    loading = false,
  },
  ref,
) {
  const [submitting, setSubmitting] = useState(false)
  const busy = loading || submitting

  // dismissal is blocked while the confirm is running (so the delete can't be abandoned mid-flight)
  const handleClose = () => {
    if (!busy) onClose()
  }

  const handleConfirm = async () => {
    try {
      setSubmitting(true)
      await onConfirm()
      onClose() // auto-close on success
    } catch {
      // keep the dialog open on failure so the user can retry; the consumer surfaces the error
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      ref={ref}
      open={open}
      onClose={handleClose}
      size="sm"
      title={title}
      showCloseButton={!busy}
      closeOnBackdrop={!busy}
      closeOnEscape={!busy}
      footer={
        <>
          <Button variant="text" onClick={handleClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button color="error" variant="filled" onClick={handleConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        <div className={styles.iconBox} aria-hidden>
          <Icon name="Trash" />
        </div>
        <Typography align="center">{message}</Typography>
      </div>
    </Modal>
  )
})
