export interface ThemePalette {
  primary: string
  secondary: string
  dark: string
  medium: string
  light: string
  success: string
  error: string
  info: string
  warning: string
}

/** Names of the brand palette tokens (maps to `--tz-color-<name>`). */
export type ThemeColor = keyof ThemePalette

function hexToRgbTriplet(hex: string): string {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  }
  const int = parseInt(h, 16)
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`
}

/**
 * Picks a readable text color (near-black or white) to sit on top of a solid
 * fill — used by `contained` controls so the label stays legible on light
 * colors (e.g. a light `primary` in dark mode).
 */
function contrastColor(rgbTriplet: string): string {
  const [r, g, b] = rgbTriplet.split(',').map((n) => Number(n.trim()))
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 150 ? '#04202b' : '#ffffff'
}

/**
 * Per-color overrides for the `contained` label color, where the automatic
 * luminance pick isn't the desired look:
 * - `secondary`: near-white fill that blends with the page, so the label uses
 *   the primary color (flips with the mode) to stay readable without a border.
 * - `light` / `warning`: keep the plain white label by design.
 */
const CONTRAST_OVERRIDE: Readonly<Record<string, string>> = {
  secondary: 'rgb(var(--tz-color-primary-rgb))',
  light: '#ffffff',
  warning: '#ffffff',
}

export function applyTheme(
  theme: Partial<ThemePalette>,
  target: HTMLElement = document.documentElement,
): void {
  for (const [name, value] of Object.entries(theme)) {
    if (!value) continue
    const triplet = hexToRgbTriplet(value)
    target.style.setProperty(`--tz-color-${name}-rgb`, triplet)
    target.style.setProperty(
      `--tz-color-${name}-contrast`,
      CONTRAST_OVERRIDE[name] ?? contrastColor(triplet),
    )
  }
}
