import { forwardRef } from 'react'
import { useTheme, useT } from '../../theme'
import { Icon } from '../Icon'
import { IconButton, type IconButtonProps } from '../IconButton'

/** Inherits `IconButton`'s look (variant, color, size); the icon and toggle behavior are built in. */
export type ThemeToggleProps = Omit<IconButtonProps, 'children'>

/**
 * A one-tap color-theme switch. Renders an `IconButton` showing the `Sun` icon
 * in light mode and the `Moon` icon in dark mode, and flips `mode` on click.
 * Styling comes from `IconButton`, so `variant`, `color` and `size` pass through.
 */
export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(function ThemeToggle(
  { variant = 'outlined', ...props },
  ref,
) {
  const { mode, toggleMode } = useTheme()
  const t = useT()
  const isDark = mode === 'dark'

  return (
    <IconButton
      ref={ref}
      variant={variant}
      role="switch"
      aria-checked={isDark}
      aria-label={t('themeToggle.label')}
      {...props}
      onClick={(event) => {
        props.onClick?.(event) // preserve a caller-supplied handler, then toggle
        toggleMode()
      }}
    >
      <Icon name={isDark ? 'Moon' : 'Sun'} />
    </IconButton>
  )
})
