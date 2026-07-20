import { useEffect, useRef, useState } from 'react'
import { Alert } from '../Alert'
import { closeToast, removeToast, type ToastPosition, type ToastRecord } from './toastStore'
import styles from './Toaster.module.css'

/** Exit-animation duration (matches `--tz-duration`) — how long to keep a closing toast mounted. */
const EXIT_MS = 300

export interface ToastItemProps {
  toast: ToastRecord
  /** Fallback auto-dismiss delay when the toast doesn't set its own. */
  duration: number
  position: ToastPosition
}

/**
 * One rendered toast — an `Alert` wrapped with the enter/exit animation, the auto-dismiss timer
 * (paused while hovered), and the close wiring. Internal to `Toaster`.
 */
export function ToastItem({ toast, duration, position }: ToastItemProps) {
  const [visible, setVisible] = useState(false)
  const ttl = toast.duration ?? duration
  const timer = useRef<number | undefined>(undefined)
  const remaining = useRef(ttl)
  const startedAt = useRef(0)

  // enter — flip `visible` on the next frame so the transition runs
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  // exit — when the store marks this toast closing, animate out then remove it
  useEffect(() => {
    if (toast.open) return
    setVisible(false)
    const t = window.setTimeout(() => removeToast(toast.id), EXIT_MS)
    return () => window.clearTimeout(t)
  }, [toast.open, toast.id])

  // auto-dismiss timer, paused on hover (tracks the remaining time across pauses)
  const clearTimer = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current)
      timer.current = undefined
    }
  }
  const resume = () => {
    if (!toast.open || remaining.current === Infinity) return
    clearTimer()
    startedAt.current = Date.now()
    timer.current = window.setTimeout(() => closeToast(toast.id), remaining.current)
  }
  const pause = () => {
    if (timer.current == null) return
    clearTimer()
    remaining.current -= Date.now() - startedAt.current
  }
  useEffect(() => {
    // (re)start from the full duration on open, and whenever an update-by-id changes `duration`
    // (otherwise the original countdown keeps running against the stale ttl)
    remaining.current = ttl
    resume()
    return clearTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.open, ttl])

  return (
    <div
      className={styles.item}
      data-open={visible ? 'true' : 'false'}
      data-position={position}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <Alert
        color={toast.color}
        variant={toast.variant ?? 'contained'}
        icon={toast.icon}
        action={toast.action}
        onClose={() => closeToast(toast.id)}
        role="status"
        className={styles.alert}
      >
        {toast.message}
      </Alert>
    </div>
  )
}
