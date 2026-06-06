import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
import { Loader } from '../Loader'
import styles from './Button.module.css'

export type ButtonVariant = 'contained' | 'filled' | 'outlined' | 'text'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  /** Visual style. `contained` solid · `filled` soft tint · `outlined` border · `text` bare. */
  variant?: ButtonVariant
  /** Brand palette token that tints the button. Defaults to `dark`. */
  color?: ThemeColor
  /** Preset size — drives height (`--tz-control-height-*`), padding and font size. */
  size?: ButtonSize
  /** Shows the loader and blocks interaction (also sets the native `disabled`). The loader replaces the `startIcon` when present, otherwise it trails the label at the end (right) — so a plain button shows the spinner on the right. The text stays visible. */
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
    color = 'dark',
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
  // The loader replaces the start icon when there is one; otherwise it sits at the end (right) —
  // including a plain button with no icons, so the spinner trails the label.
  const loaderAtEnd = loading && !startIcon

  // size an icon slot to match the button (an explicit icon `size` still wins)
  const sizeIcon = (node: ReactNode): ReactNode =>
    isValidElement(node)
      ? cloneElement(node as ReactElement<{ size?: ButtonSize }>, {
          size: (node.props as { size?: ButtonSize }).size ?? size,
        })
      : node

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
      style={
        {
          '--tz-btn-rgb': `var(--tz-color-${color}-rgb)`,
          '--tz-btn-on': `var(--tz-color-${color}-contrast, #fff)`,
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      {/* leading slot — the loader takes the start icon's place while loading */}
      {loading && !loaderAtEnd ? <Loader size={size} aria-hidden="true" /> : sizeIcon(startIcon)}
      {children != null && children !== false && <span className={styles.label}>{children}</span>}
      {/* trailing slot — the loader takes the end icon's place when there's no start icon */}
      {loaderAtEnd ? <Loader size={size} aria-hidden="true" /> : !loading && sizeIcon(endIcon)}
    </button>
  )
})
