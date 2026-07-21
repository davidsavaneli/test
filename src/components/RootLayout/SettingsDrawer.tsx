import { useState } from 'react'
import { DEFAULT_FONT_FAMILY, useT, useTheme } from '../../theme'
import { Col } from '../Flex'
import { Divider } from '../Divider'
import { Modal } from '../Modal'
import { ChoiceCardGroup } from '../ChoiceCard'
import { Select } from '../Select'
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
  /** Show the light/dark **Theme** section (gated by the shell's `header.theme`, the same flag as the header toggle). */
  showTheme?: boolean
}

/**
 * The header user-menu **Settings** drawer (a right-side `Modal`), top to bottom: a **Theme** section — an
 * exclusive `ChoiceCardGroup` (**Light** / **Dark** cards) driving `useTheme().setMode`, shown only when
 * **`showTheme`** (the shell's `header.theme`, so the header toggle + this section appear/disappear
 * together); **Accent Color** — **two `SwatchPicker`s** (Light + Dark) so both accents are chosen
 * independently, each with a per-mode set (deeper tones for light, brighter for dark), calling
 * `setAccentColor(color, mode)` and persisting it — each list leads with the provider's default for that
 * mode (`defaultAccentColors[mode]`), selected when there's no override (picking it clears the override).
 * When `showTheme` is off the panel is locked to one mode, so **only the active mode's accent picker**
 * shows (the other is pointless without a theme switch);
 * a **Font** section (a searchable `Select` — Inter preset + type any Google Font — driving
 * `setFontFamily`); and a **Header** section (an exclusive `ChoiceCardGroup` **Scrollable** / **Fixed**
 * driving `setHeaderSticky`). Internal to the admin shell — not a public export.
 */
export function SettingsDrawer({ open, onClose, showTheme = true }: SettingsDrawerProps) {
  const {
    mode,
    setMode,
    accentColors,
    defaultAccentColors,
    setAccentColor,
    headerSticky,
    setHeaderSticky,
    fontFamily,
    setFontFamily,
  } = useTheme()
  const t = useT()

  // One searchable Select doubles as a "type any Google Font" field. Base = Inter (the only preset) +
  // the active font (so a custom pick stays visible/selectable). While searching, the typed query is
  // offered as its own option — picking it applies + loads that family. Base is always kept in the
  // list (never filtered out) so `value` always resolves in the trigger, even mid-search.
  const [fontQuery, setFontQuery] = useState('')
  const q = fontQuery.trim()
  const base =
    fontFamily !== DEFAULT_FONT_FAMILY ? [DEFAULT_FONT_FAMILY, fontFamily] : [DEFAULT_FONT_FAMILY]
  const showTyped = q.length > 0 && !base.some((f) => f.toLowerCase() === q.toLowerCase())
  const fontOptions = (showTyped ? [q, ...base] : base).map((f) => ({
    value: f,
    label: f === DEFAULT_FONT_FAMILY ? t('settings.fontDefault', { font: f }) : f,
  }))

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
        labels={{ [def]: t('settings.accentDefault', { color: def }) }}
        aria-label={String(label)}
      />
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      placement="right"
      size="sm"
      title={t('settings.label')}
      icon="Setting5"
    >
      {showTheme && (
        <>
          <Typography variant="subtitle" as="h3">
            {t('settings.themeTitle')}
          </Typography>
          <Typography
            variant="bodySmall"
            color="muted"
            as="p"
            style={{ marginTop: 'var(--tz-space-xxs)' }}
          >
            {t('settings.themeDesc')}
          </Typography>
          <ChoiceCardGroup
            exclusive
            color="accent"
            minCardWidth={130}
            value={mode}
            onChange={(v) => {
              if (typeof v === 'string') setMode(v as 'light' | 'dark')
            }}
            options={[
              {
                value: 'light',
                label: t('settings.light'),
                description: t('settings.lightDesc'),
                icon: 'Sun',
              },
              {
                value: 'dark',
                label: t('settings.dark'),
                description: t('settings.darkDesc'),
                icon: 'Moon',
              },
            ]}
            aria-label={t('settings.themeTitle')}
            style={{ marginTop: 'var(--tz-space-sm)' }}
          />

          <Divider style={{ margin: 'var(--tz-space-md) 0' }} />
        </>
      )}

      <Typography variant="subtitle" as="h3">
        {t('settings.accentTitle')}
      </Typography>
      <Typography
        variant="bodySmall"
        color="muted"
        as="p"
        style={{ marginTop: 'var(--tz-space-xxs)' }}
      >
        {t('settings.accentDesc')}
      </Typography>
      <Col gap="md" style={{ marginTop: 'var(--tz-space-sm)' }}>
        {showTheme ? (
          <>
            {picker('light', t('settings.lightTheme'))}
            {picker('dark', t('settings.darkTheme'))}
          </>
        ) : (
          // theme switching is off → the panel stays in one mode, so only that mode's accent matters
          picker(mode, mode === 'light' ? t('settings.lightTheme') : t('settings.darkTheme'))
        )}
      </Col>

      <Divider style={{ margin: 'var(--tz-space-md) 0' }} />

      <Typography variant="subtitle" as="h3">
        {t('settings.fontTitle')}
      </Typography>
      <Typography
        variant="bodySmall"
        color="muted"
        as="p"
        style={{ marginTop: 'var(--tz-space-xxs)' }}
      >
        {t('settings.fontDesc')}
      </Typography>
      <Select
        label={t('settings.fontFamily')}
        searchable
        searchPlaceholder={t('settings.fontSearch')}
        value={fontFamily}
        options={fontOptions}
        onSearchChange={setFontQuery}
        onChange={(v) => {
          setFontFamily(v)
          setFontQuery('')
        }}
        aria-label={t('settings.fontFamily')}
        style={{ marginTop: 'var(--tz-space-sm)' }}
      />

      <Divider style={{ margin: 'var(--tz-space-md) 0' }} />

      <Typography variant="subtitle" as="h3">
        {t('settings.headerTitle')}
      </Typography>
      <Typography
        variant="bodySmall"
        color="muted"
        as="p"
        style={{ marginTop: 'var(--tz-space-xxs)' }}
      >
        {t('settings.headerDesc')}
      </Typography>
      <ChoiceCardGroup
        exclusive
        color="accent"
        minCardWidth={130}
        value={headerSticky ? 'fixed' : 'static'}
        // exclusive (radio) → always a string; set sticky from the picked card
        onChange={(v) => {
          if (typeof v === 'string') setHeaderSticky(v === 'fixed')
        }}
        options={[
          {
            value: 'static',
            label: t('settings.scrollable'),
            description: t('settings.scrollableDesc'),
          },
          { value: 'fixed', label: t('settings.fixed'), description: t('settings.fixedDesc') },
        ]}
        aria-label={t('settings.headerTitle')}
        style={{ marginTop: 'var(--tz-space-sm)' }}
      />
    </Modal>
  )
}
