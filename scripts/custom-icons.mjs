// Hand-authored icons that aren't in the Iconsax dump. build-icons.mjs merges these into the
// generated registry (icons.ts / names.ts), so they survive a regeneration. Keep each `inner` in
// sync with its icons.ts entry. Shape: { name (PascalCase), inner (markup inside <Icon>'s 24x24
// fill="currentColor" <svg>) }. Match the existing fill-based style — e.g. the `Task` checklist,
// whose three right-side "line" paths are reused here.

const LINES =
  '<path d="M21 6.25H11C10.59 6.25 10.25 5.91 10.25 5.5C10.25 5.09 10.59 4.75 11 4.75H21C21.41 4.75 21.75 5.09 21.75 5.5C21.75 5.91 21.41 6.25 21 6.25Z"/>' +
  '<path d="M21 13.25H11C10.59 13.25 10.25 12.91 10.25 12.5C10.25 12.09 10.59 11.75 11 11.75H21C21.41 11.75 21.75 12.09 21.75 12.5C21.75 12.91 21.41 13.25 21 13.25Z"/>' +
  '<path d="M21 20.25H11C10.59 20.25 10.25 19.91 10.25 19.5C10.25 19.09 10.59 18.75 11 18.75H21C21.41 18.75 21.75 19.09 21.75 19.5C21.75 19.91 21.41 20.25 21 20.25Z"/>'

const num = (d, y) =>
  `<text x="4" y="${y}" font-family="system-ui, sans-serif" font-size="8" font-weight="600" text-anchor="middle">${d}</text>`

export const customIcons = [
  // Bare X — the Iconsax `Add` (plus) paths rotated 45°, so it keeps Add's exact thin stroke weight.
  // Used by the `Modal` close button.
  {
    name: 'Close',
    inner:
      '<g transform="rotate(45 12 12)"><path d="M18 12.75H6C5.59 12.75 5.25 12.41 5.25 12C5.25 11.59 5.59 11.25 6 11.25H18C18.41 11.25 18.75 11.59 18.75 12C18.75 12.41 18.41 12.75 18 12.75Z"/><path d="M12 18.75C11.59 18.75 11.25 18.41 11.25 18V6C11.25 5.59 11.59 5.25 12 5.25C12.41 5.25 12.75 5.59 12.75 6V18C12.75 18.41 12.41 18.75 12 18.75Z"/></g>',
  },
  // Bulleted (unordered) list — the checklist's lines with bullet dots instead of ticks.
  {
    name: 'ListBullet',
    inner: `<g>${LINES}<circle cx="4" cy="5.5" r="1.6"/><circle cx="4" cy="12.5" r="1.6"/><circle cx="4" cy="19.5" r="1.6"/></g>`,
  },
  // Numbered (ordered) list — the checklist's lines with 1 / 2 / 3 instead of ticks.
  {
    name: 'ListNumber',
    inner: `<g>${LINES}${num(1, 8.3)}${num(2, 15.3)}${num(3, 22.3)}</g>`,
  },
]
