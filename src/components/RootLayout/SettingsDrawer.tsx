import { useTheme } from '../../theme'
import { Modal } from '../Modal'
import { SwatchPicker } from '../SwatchPicker'
import { Typography } from '../Typography'

/** The library's default brand accent — the first swatch, selected when there's no override. */
const DEFAULT_BRAND = '#056472'

/** Static brand-accent choices. The first is the provider default (see `DEFAULT_BRAND`). */
const BRAND_SWATCHES = [
  DEFAULT_BRAND, // teal (default)
  '#7c3aed', // violet
  '#2563eb', // blue
  '#0891b2', // cyan
  '#059669', // green
  '#ca8a04', // amber
  '#ea580c', // orange
  '#dc2626', // red
  '#db2777', // pink
]

export interface SettingsDrawerProps {
  /** Whether the drawer is open. */
  open: boolean
  /** Close handler. */
  onClose: () => void
}

/**
 * The header user-menu **Settings** drawer (a right-side `Modal`). Renders a `SwatchPicker` of static
 * brand-accent colors; picking one overrides the theme `brand` color (via `useTheme().setBrandColor`)
 * and persists it to localStorage, so the choice is restored on the next visit. The first swatch is the
 * provider default (`brand`) and reads as selected when no override is set; picking it clears the
 * override. Internal to the admin shell — not a public export.
 */
export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { brandColor, setBrandColor } = useTheme()

  return (
    <Modal
      open={open}
      onClose={onClose}
      placement="right"
      size="sm"
      title="Settings"
      icon="Setting5"
    >
      <Typography variant="subtitle" as="h3">
        Brand Color
      </Typography>
      <Typography
        variant="bodySmall"
        color="muted"
        as="p"
        style={{ marginTop: 'var(--tz-space-xxs)' }}
      >
        Pick your accent color — it's saved and restored next time you open the panel.
      </Typography>
      <SwatchPicker
        colors={BRAND_SWATCHES}
        // with no override, the first (default) swatch reads as selected
        value={brandColor ?? DEFAULT_BRAND}
        // the default swatch clears the override; the rest set it (both modes)
        onChange={(color) => setBrandColor(color === DEFAULT_BRAND ? null : color)}
        labels={{ [DEFAULT_BRAND]: `Default (${DEFAULT_BRAND})` }}
        aria-label="Brand color"
        style={{ marginTop: 'var(--tz-space-sm)' }}
      />
    </Modal>
  )
}
