/** Color math for the ColorPicker: hex ⇄ rgb ⇄ hsv, plus hex validation. All internal, no deps. */

export interface HSV {
  /** Hue 0–360 */
  h: number
  /** Saturation 0–1 */
  s: number
  /** Value/brightness 0–1 */
  v: number
}

export interface RGB {
  r: number
  g: number
  b: number
}

export interface RGBA extends RGB {
  /** Alpha 0–1 */
  a: number
}

export const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))
const clamp255 = (n: number): number => Math.min(255, Math.max(0, Math.round(n)))

/** Normalizes any `#rgb`/`#rrggbb` (with or without `#`) to a lowercase `#rrggbb`, or `null` if invalid. */
export function normalizeHex(input: string): string | null {
  let h = input.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  return /^[0-9a-fA-F]{6}$/.test(h) ? `#${h.toLowerCase()}` : null
}

/** True for a complete `#rrggbb` (or `#rgb`) color. */
export const isValidHex = (input: string): boolean => normalizeHex(input) !== null

export function hexToRgb(hex: string): RGB {
  const h = (normalizeHex(hex) ?? '#000000').slice(1)
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function rgbToHex({ r, g, b }: RGB): string {
  const to = (n: number) =>
    Math.round(clamp01(n / 255) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

/** RGB (0–255) → HSV. */
export function rgbToHsv({ r, g, b }: RGB): HSV {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min

  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return { h, s, v: max }
}

/** HSV → RGB (0–255). */
export function hsvToRgb({ h, s, v }: HSV): RGB {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

export const hexToHsv = (hex: string): HSV => rgbToHsv(hexToRgb(hex))
export const hsvToHex = (hsv: HSV): string => rgbToHex(hsvToRgb(hsv))

/** A readable text/handle color (near-black or white) for sitting on top of a given hex fill. */
export function contrastOn(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? '#04202b' : '#ffffff'
}

const RGB_FUNC =
  /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i

/**
 * Parses any CSS color the picker understands — `#rgb` / `#rgba` / `#rrggbb` / `#rrggbbaa` hex (with
 * or without `#`), or `rgb()` / `rgba()` (alpha as `0–1` or a `%`) — to `{ r, g, b, a }` (`a` is
 * `0–1`), or `null` when it doesn't match.
 */
export function parseColor(input: string): RGBA | null {
  const s = input.trim()
  if (!s) return null

  // hex (with or without #) — 3 / 4 / 6 / 8 digits (3 & 4 expand each nibble to a byte)
  let h = s.replace(/^#/, '')
  if (/^[0-9a-fA-F]{3,4}$/.test(h)) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (/^[0-9a-fA-F]{6}$/.test(h)) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    }
  }
  if (/^[0-9a-fA-F]{8}$/.test(h)) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: clamp01(parseInt(h.slice(6, 8), 16) / 255),
    }
  }

  // rgb() / rgba()
  const m = s.match(RGB_FUNC)
  if (m) {
    let a = 1
    if (m[4] != null) {
      a = m[4].endsWith('%') ? clamp01(parseFloat(m[4]) / 100) : clamp01(parseFloat(m[4]))
    }
    return { r: clamp255(+m[1]), g: clamp255(+m[2]), b: clamp255(+m[3]), a }
  }
  return null
}

/**
 * Formats `{ r, g, b, a }` back to a CSS string: `#rrggbb` when fully opaque (`a >= 1`), else
 * `rgba(r, g, b, a)` with alpha rounded to 2 decimals.
 */
export function formatColor({ r, g, b, a }: RGBA): string {
  if (a >= 1) return rgbToHex({ r, g, b })
  return `rgba(${clamp255(r)}, ${clamp255(g)}, ${clamp255(b)}, ${Math.round(clamp01(a) * 100) / 100})`
}
