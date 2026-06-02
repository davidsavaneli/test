export interface TechzyTheme {
  primary: string
  secondary: string
  tertiary: string
  dark: string
  medium: string
  light: string
  success: string
  error: string
  info: string
  warning: string
}

/** Names of the brand palette tokens (maps to `--tz-color-<name>`). */
export type TechzyColor = keyof TechzyTheme

function hexToRgbTriplet(hex: string): string {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  }
  const int = parseInt(h, 16)
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`
}

export function applyTheme(
  theme: Partial<TechzyTheme>,
  target: HTMLElement = document.documentElement,
): void {
  for (const [name, value] of Object.entries(theme)) {
    if (!value) continue
    target.style.setProperty(`--tz-color-${name}-rgb`, hexToRgbTriplet(value))
  }
}
