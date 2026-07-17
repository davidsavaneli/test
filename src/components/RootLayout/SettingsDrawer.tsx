import { useTheme } from '../../theme'
import { Col } from '../Flex'
import { Modal } from '../Modal'
import { SwatchPicker } from '../SwatchPicker'
import { Typography } from '../Typography'

// Accent choices offered alongside the provider's default (which leads each list) — 15 per mode, so
// each theme shows 16 total. Tuned PER MODE (deeper tones for light, brighter for dark) and paired by
// hue (red → violet + a neutral) so a color keeps its identity across themes.
const ALT_SWATCHES: Record<'light' | 'dark', string[]> = {
  light: [
    '#dc2626', // red
    '#ea580c', // orange
    '#d97706', // amber
    '#ca8a04', // yellow
    '#65a30d', // lime
    '#16a34a', // green
    '#059669', // emerald
    '#0891b2', // cyan
    '#0284c7', // sky
    '#2563eb', // blue
    '#4f46e5', // indigo
    '#7c3aed', // violet
    '#c026d3', // fuchsia
    '#db2777', // pink
    '#475569', // slate
  ],
  dark: [
    '#f87171', // red
    '#fb923c', // orange
    '#fbbf24', // amber
    '#facc15', // yellow
    '#a3e635', // lime
    '#4ade80', // green
    '#34d399', // emerald
    '#22d3ee', // cyan
    '#38bdf8', // sky
    '#60a5fa', // blue
    '#818cf8', // indigo
    '#a78bfa', // violet
    '#e879f9', // fuchsia
    '#f472b6', // pink
    '#94a3b8', // slate
  ],
}

export interface SettingsDrawerProps {
  /** Whether the drawer is open. */
  open: boolean
  /** Close handler. */
  onClose: () => void
}

/**
 * The header user-menu **Settings** drawer (a right-side `Modal`). Holds **two `SwatchPicker`s** — one
 * for the **Light theme** and one for the **Dark theme** — so both accents are chosen independently in
 * one place (each with a per-mode set: deeper tones for light, brighter for dark). Picking a swatch
 * calls `useTheme().setAccentColor(color, mode)`, overriding that mode's `accent` and persisting it, so
 * the choice is restored on the next visit. Each list leads with the provider's default for that mode
 * (`defaultAccentColors[mode]`), selected when there's no override; picking it clears that mode's
 * override. Internal to the admin shell — not a public export.
 */
export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { accentColors, defaultAccentColors, setAccentColor } = useTheme()

  const picker = (mode: 'light' | 'dark', label: string) => {
    const def = defaultAccentColors[mode]
    // the provider's default (per mode) leads the list; then the mode's alts (minus any collision)
    const colors = [def, ...ALT_SWATCHES[mode].filter((c) => c.toLowerCase() !== def.toLowerCase())]
    return (
      <SwatchPicker
        label={label}
        colors={colors}
        // with no override, this mode's default swatch reads as selected
        value={accentColors[mode] ?? def}
        // the default swatch clears this mode's override; the rest set it
        onChange={(color) =>
          setAccentColor(color.toLowerCase() === def.toLowerCase() ? null : color, mode)
        }
        labels={{ [def]: `Default (${def})` }}
        aria-label={`Accent color — ${label}`}
      />
    )
  }

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
        Accent Color
      </Typography>
      <Typography
        variant="bodySmall"
        color="muted"
        as="p"
        style={{ marginTop: 'var(--tz-space-xxs)' }}
      >
        Pick an accent for each theme — it's saved and restored next time you open the panel.
      </Typography>
      <Col gap="md" style={{ marginTop: 'var(--tz-space-sm)' }}>
        {picker('light', 'Light theme')}
        {picker('dark', 'Dark theme')}
      </Col>
    </Modal>
  )
}
