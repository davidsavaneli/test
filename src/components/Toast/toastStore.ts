import type { ReactNode } from 'react'
import type { ThemeColor } from '../../theme'
import type { IconName } from '../../icons/names'
import type { AlertVariant } from '../Alert'

/** Where the `Toaster` stacks toasts. */
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface ToastOptions {
  /** Auto-dismiss delay in ms; `Infinity` keeps it open until dismissed. Defaults to the `Toaster`'s `duration`. */
  duration?: number
  /** Alert tint style. Defaults to `contained` (solid fill). */
  variant?: AlertVariant
  /** Leading icon — an `IconName`, a node, or `false` to hide it. Defaults to the semantic icon for the color. */
  icon?: IconName | ReactNode | false
  /** Trailing action (e.g. an `UNDO` button). */
  action?: ReactNode
  /** Explicit id — reuse it to update an existing toast or to target `toast.dismiss(id)`. Auto-generated otherwise. */
  id?: string
}

/** A live toast in the store (internal). `open` flips to `false` to drive the exit animation before removal. */
export interface ToastRecord extends ToastOptions {
  id: string
  message: ReactNode
  color: ThemeColor
  open: boolean
}

let toasts: ToastRecord[] = []
let seq = 0
const listeners = new Set<() => void>()

const emit = () => {
  for (const listener of listeners) listener()
}

/** Subscribe to store changes (used by `Toaster` via `useSyncExternalStore`). */
export const subscribeToasts = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** The current toasts — a stable reference between changes (snapshot for `useSyncExternalStore`). */
export const getToasts = (): ToastRecord[] => toasts

const upsert = (message: ReactNode, color: ThemeColor, options?: ToastOptions): string => {
  const id = options?.id ?? `tz-toast-${++seq}`
  const index = toasts.findIndex((t) => t.id === id)
  // on update-by-id, merge over the existing record so fields omitted this call (action, a sticky
  // duration, …) are preserved rather than silently reset to defaults
  const prev = index >= 0 ? toasts[index] : undefined
  const record: ToastRecord = { ...prev, ...options, id, message, color, open: true }
  toasts = index >= 0 ? toasts.map((t, i) => (i === index ? record : t)) : [...toasts, record]
  emit()
  return id
}

/** Mark a toast as closing — drives its exit animation; the `Toaster` removes it afterwards. */
export const closeToast = (id: string): void => {
  toasts = toasts.map((t) => (t.id === id ? { ...t, open: false } : t))
  emit()
}

/** Remove a toast outright (called by the `Toaster` once its exit animation finishes). */
export const removeToast = (id: string): void => {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

/** Imperative toast API — callable from anywhere (event handlers, async code, outside React). */
export interface ToastApi {
  /** Show a neutral (info) toast. Returns the toast id. */
  (message: ReactNode, options?: ToastOptions): string
  success: (message: ReactNode, options?: ToastOptions) => string
  error: (message: ReactNode, options?: ToastOptions) => string
  warning: (message: ReactNode, options?: ToastOptions) => string
  info: (message: ReactNode, options?: ToastOptions) => string
  /** Dismiss a toast by id, or all toasts when called with no argument. */
  dismiss: (id?: string) => void
}

export const toast: ToastApi = Object.assign(
  (message: ReactNode, options?: ToastOptions) => upsert(message, 'info', options),
  {
    success: (message: ReactNode, options?: ToastOptions) => upsert(message, 'success', options),
    error: (message: ReactNode, options?: ToastOptions) => upsert(message, 'error', options),
    warning: (message: ReactNode, options?: ToastOptions) => upsert(message, 'warning', options),
    info: (message: ReactNode, options?: ToastOptions) => upsert(message, 'info', options),
    dismiss: (id?: string) => {
      if (id == null) {
        toasts = toasts.map((t) => ({ ...t, open: false }))
        emit()
      } else {
        closeToast(id)
      }
    },
  },
)
