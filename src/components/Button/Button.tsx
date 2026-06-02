import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react'
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
  /** Shows a spinner and blocks interaction (also sets the native `disabled`). */
  loading?: boolean
  /** Stretches the button to fill its container. */
  fullWidth?: boolean
  /** Pill shape (fully rounded corners). */
  rounded?: boolean
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
    className,
    style,
    type = 'button',
    children,
    ...props
  },
  ref,
) {
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
      {loading && <Loader size={size} className={styles.loader} aria-hidden="true" />}
      <span className={styles.content}>{children}</span>
    </button>
  )
})
