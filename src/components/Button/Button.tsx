import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { clsx } from 'clsx'
import type { TechzyColor } from '../../theme'
import { Loader } from '../Loader'
import styles from './Button.module.css'

export type ButtonVariant = 'contained' | 'filled' | 'outlined' | 'text'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  /** Visual style. `contained` solid · `filled` soft tint · `outlined` border · `text` bare. */
  variant?: ButtonVariant
  /** Brand palette token that tints the button. Defaults to `primary`. */
  color?: TechzyColor
  /** Preset size — drives height (`--tz-control-height-*`), padding and font size. */
  size?: ButtonSize
  /** Shows the loader and blocks interaction (also sets the native `disabled`). While loading, the loader replaces whichever icon is present (start by default, end when only `endIcon` is set). */
  loading?: boolean
  /** Stretches the button to fill its container. */
  fullWidth?: boolean
  /** Pill shape (fully rounded corners). */
  rounded?: boolean
  /** Icon before the label. Replaced by the loader while `loading`. */
  startIcon?: ReactNode
  /** Icon after the label. Replaced by the loader while `loading` when no `startIcon` is set. */
  endIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'contained',
    color = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    rounded = false,
    disabled = false,
    startIcon,
    endIcon,
    className,
    style,
    type = 'button',
    children,
    ...props
  },
  ref,
) {
  // The loader replaces whichever icon is present: start by default, end when only `endIcon` is set.
  const loaderAtEnd = loading && !startIcon && endIcon != null

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        rounded && styles.rounded,
        loading && styles.loading,
        disabled && styles.disabled,
        className,
      )}
      style={{ '--tz-btn-rgb': `var(--tz-color-${color}-rgb)`, ...style } as CSSProperties}
      {...props}
    >
      {/* leading slot — the loader takes the start icon's place while loading */}
      {loading && !loaderAtEnd ? <Loader size={size} aria-hidden="true" /> : startIcon}
      {children != null && children !== false && <span className={styles.label}>{children}</span>}
      {/* trailing slot — the loader takes the end icon's place when there's no start icon */}
      {loaderAtEnd ? <Loader size={size} aria-hidden="true" /> : !loading && endIcon}
    </button>
  )
})
