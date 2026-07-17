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
import styles from './IconButton.module.css'

export type IconButtonVariant = 'contained' | 'filled' | 'outlined' | 'text'
export type IconButtonSize = 'sm' | 'md' | 'lg'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  /** Visual style. `contained` solid · `filled` soft tint · `outlined` border · `text` bare. */
  variant?: IconButtonVariant
  /** Theme palette token that tints the button. Defaults to `accent`. */
  color?: ThemeColor
  /** Preset size — square: width === height === `--tz-control-height-*` (matches `Button` heights). */
  size?: IconButtonSize
  /** Shows the loader in the icon's place and blocks interaction (also sets the native `disabled`). */
  loading?: boolean
  /** Circular shape instead of the default rounded square. */
  rounded?: boolean
  /** Ignores all interaction (no clicks, hover or focus) while keeping the normal look — unlike `disabled`, it's not dimmed. */
  nonClickable?: boolean
  /** The icon to render — typically an `<Icon />`. Swapped for the loader while `loading`. */
  children?: ReactNode
}

/**
 * A square, text-less button for a single icon. Shares `Button`'s variants,
 * colors and sizing, but its width equals its height (the matching
 * `--tz-control-height-*`). Pass an `<Icon />` (or any node) as the child;
 * while `loading` it's replaced by the `Loader`. Provide an `aria-label` since
 * there's no visible text.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    variant = 'contained',
    color = 'accent',
    size = 'md',
    loading = false,
    rounded = false,
    disabled = false,
    nonClickable = false,
    className,
    style,
    type = 'button',
    tabIndex,
    children,
    ...props
  },
  ref,
) {
  // size the icon child to match the button (an explicit icon `size` still wins)
  const icon =
    isValidElement(children) && !loading
      ? cloneElement(children as ReactElement<{ size?: IconButtonSize }>, {
          size: (children.props as { size?: IconButtonSize }).size ?? size,
        })
      : children

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-disabled={nonClickable || undefined}
      tabIndex={nonClickable ? -1 : tabIndex}
      className={clsx(
        styles.iconButton,
        styles[variant],
        styles[size],
        rounded && styles.rounded,
        loading && styles.loading,
        disabled && styles.disabled,
        nonClickable && styles.nonClickable,
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
      {loading ? <Loader size={size} aria-hidden="true" /> : icon}
    </button>
  )
})
