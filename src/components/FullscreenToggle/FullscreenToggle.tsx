import { forwardRef, useEffect, useState } from 'react'
import { Icon } from '../Icon'
import { IconButton, type IconButtonProps } from '../IconButton'

/** Inherits `IconButton`'s look (variant, color, size); the icon and toggle behavior are built in. */
export type FullscreenToggleProps = Omit<IconButtonProps, 'children'>

/**
 * A one-tap browser fullscreen switch. Renders an `IconButton` that calls the Fullscreen API —
 * `requestFullscreen` to maximize, `exitFullscreen` to restore — and flips its `Maximize3` icon 180°
 * while fullscreen (so it reads as "minimize"), keeping state in sync via the `fullscreenchange`
 * event. Styling comes from `IconButton`, so `variant`, `color` and `size` pass through.
 */
export const FullscreenToggle = forwardRef<HTMLButtonElement, FullscreenToggleProps>(
  function FullscreenToggle({ variant = 'outlined', ...props }, ref) {
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
      const sync = () => setIsFullscreen(document.fullscreenElement != null)
      sync() // pick up a session that's already fullscreen on mount
      document.addEventListener('fullscreenchange', sync)
      return () => document.removeEventListener('fullscreenchange', sync)
    }, [])

    const toggle = () => {
      // `?.` guards environments without the Fullscreen API; `.catch` swallows a blocked request
      if (document.fullscreenElement) {
        document.exitFullscreen?.()?.catch(() => {})
      } else {
        document.documentElement.requestFullscreen?.()?.catch(() => {})
      }
    }

    return (
      <IconButton
        ref={ref}
        variant={variant}
        role="switch"
        aria-checked={isFullscreen}
        aria-label="Toggle fullscreen"
        {...props}
        onClick={toggle}
      >
        <Icon name="Maximize3" style={isFullscreen ? { transform: 'rotate(180deg)' } : undefined} />
      </IconButton>
    )
  },
)
