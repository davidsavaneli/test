import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { getToasts, subscribeToasts, type ToastPosition } from './toastStore'
import { ToastItem } from './ToastItem'
import styles from './Toaster.module.css'

export interface ToasterProps {
  /** Corner the toasts stack in. Defaults to `bottom-right`. */
  position?: ToastPosition
  /** Default auto-dismiss delay in ms; a per-toast `duration` overrides it. Defaults to `4000`. */
  duration?: number
}

/**
 * The toast viewport — mount it **once** near the app root. It portals to `<body>` at `--tz-z-toast`,
 * subscribes to the imperative `toast` store, and renders each toast as an animated, auto-dismissing
 * `Alert`. Drive it from anywhere with `toast.success('Saved')` / `toast.error(...)` / `toast.dismiss(id)`.
 *
 * @example
 * <Toaster position="bottom-right" />
 * // …elsewhere:
 * toast.success('Saved')
 */
export function Toaster({ position = 'bottom-right', duration = 4000 }: ToasterProps) {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts)

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className={styles.viewport} data-position={position} aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} duration={duration} position={position} />
      ))}
    </div>,
    document.body,
  )
}
