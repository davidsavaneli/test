import { useState, type CSSProperties, type ReactNode } from 'react'
import { useTheme } from '../src'

/** A `dark < medium < light` accent ramp. */
export interface AccentRamp {
  dark: string
  medium: string
  light: string
}

/** A color family with a ramp tuned for each theme (light = deeper for white bg, dark = brighter). */
export interface PaletteFamily {
  name: string
  light: AccentRamp
  dark: AccentRamp
}

/** Preset accent families to try live from the floating picker (independent per theme). */
export const PALETTES: PaletteFamily[] = [
  {
    name: 'Violet',
    light: { dark: '#5b21b6', medium: '#6d28d9', light: '#7c3aed' },
    dark: { dark: '#7c3aed', medium: '#8b5cf6', light: '#a78bfa' },
  },
  {
    name: 'Teal',
    light: { dark: '#033b44', medium: '#056472', light: '#039aa1' },
    dark: { dark: '#0e8896', medium: '#16a6b4', light: '#25bac8' },
  },
  {
    name: 'Indigo',
    light: { dark: '#3730a3', medium: '#4338ca', light: '#4f46e5' },
    dark: { dark: '#4f46e5', medium: '#6366f1', light: '#818cf8' },
  },
  {
    name: 'Sky',
    light: { dark: '#075985', medium: '#0369a1', light: '#0284c7' },
    dark: { dark: '#0284c7', medium: '#0ea5e9', light: '#38bdf8' },
  },
  {
    name: 'Emerald',
    light: { dark: '#065f46', medium: '#047857', light: '#059669' },
    dark: { dark: '#059669', medium: '#10b981', light: '#34d399' },
  },
  {
    name: 'Rose',
    light: { dark: '#9f1239', medium: '#be123c', light: '#e11d48' },
    dark: { dark: '#e11d48', medium: '#f43f5e', light: '#fb7185' },
  },
  {
    name: 'Amber',
    light: { dark: '#b45309', medium: '#d97706', light: '#f59e0b' },
    dark: { dark: '#d97706', medium: '#f59e0b', light: '#fbbf24' },
  },
  {
    name: 'Fuchsia',
    light: { dark: '#86198f', medium: '#a21caf', light: '#c026d3' },
    dark: { dark: '#c026d3', medium: '#d946ef', light: '#e879f9' },
  },
]

interface PalettePickerProps {
  /** Active family index for the light theme. */
  lightIdx: number
  /** Active family index for the dark theme. */
  darkIdx: number
  /** Apply a family to the light theme by index. */
  onSelectLight: (idx: number) => void
  /** Apply a family to the dark theme by index. */
  onSelectDark: (idx: number) => void
}

/**
 * A fixed, floating picker (bottom-right) for swapping the accent ramp (`dark`/`medium`/`light`) of
 * each theme live — two side-by-side columns, Light then Dark. Playground-only dev tool.
 */
export function PalettePicker({
  lightIdx,
  darkIdx,
  onSelectLight,
  onSelectDark,
}: PalettePickerProps) {
  const [open, setOpen] = useState(false)
  const { mode } = useTheme()
  const fabRamp = mode === 'dark' ? PALETTES[darkIdx].dark : PALETTES[lightIdx].light

  const swatchEls = (ramp: AccentRamp): ReactNode => (
    <span style={swatches}>
      <span style={{ ...dot, background: ramp.dark }} />
      <span style={{ ...dot, background: ramp.medium }} />
      <span style={{ ...dot, background: ramp.light }} />
    </span>
  )

  const renderColumn = (
    title: string,
    variant: 'light' | 'dark',
    activeIdx: number,
    onSelect: (idx: number) => void,
  ): ReactNode => (
    <div style={col}>
      <div style={colTitle}>{title}</div>
      {PALETTES.map((p, i) => (
        <button
          key={p.name}
          type="button"
          onClick={() => onSelect(i)}
          style={{ ...row, ...(i === activeIdx ? rowActive : null) }}
        >
          {swatchEls(p[variant])}
          <span style={rowName}>{p.name}</span>
          {i === activeIdx && <span aria-hidden>✓</span>}
        </button>
      ))}
    </div>
  )

  return (
    <div style={wrap}>
      {open && (
        <div style={panel}>
          <div style={panelTitle}>Theme accent</div>
          <div style={cols}>
            {renderColumn('Light', 'light', lightIdx, onSelectLight)}
            {renderColumn('Dark', 'dark', darkIdx, onSelectDark)}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={fab}
        aria-label="Color palette"
      >
        {swatchEls(fabRamp)}
        Palette
      </button>
    </div>
  )
}

/* ── inline styles: a fixed neutral-dark surface so the tool stays readable in either theme ──────── */
const wrap: CSSProperties = {
  position: 'fixed',
  right: 24,
  bottom: 24,
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 10,
  fontFamily: 'Inter, system-ui, sans-serif',
}
const fab: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: 999,
  border: '1px solid rgba(255, 255, 255, 0.14)',
  background: '#26262b',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
}
const panel: CSSProperties = {
  padding: 8,
  borderRadius: 14,
  border: '1px solid rgba(255, 255, 255, 0.12)',
  background: '#26262b',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}
const panelTitle: CSSProperties = {
  padding: '6px 10px 0',
  fontSize: 11,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'rgba(255, 255, 255, 0.5)',
}
const cols: CSSProperties = { display: 'flex', gap: 8 }
const col: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2, width: 172 }
const colTitle: CSSProperties = {
  padding: '2px 10px 4px',
  fontSize: 11,
  fontWeight: 600,
  color: 'rgba(255, 255, 255, 0.6)',
}
const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 10px',
  borderRadius: 10,
  border: 0,
  background: 'transparent',
  color: '#fff',
  fontSize: 13,
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
}
const rowActive: CSSProperties = { background: 'rgba(255, 255, 255, 0.1)' }
const rowName: CSSProperties = { flex: 1 }
const swatches: CSSProperties = { display: 'inline-flex', gap: 3, flex: 'none' }
const dot: CSSProperties = { width: 14, height: 14, borderRadius: 4, display: 'inline-block' }
