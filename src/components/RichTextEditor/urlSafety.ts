/**
 * URL-scheme allowlist for the RichTextEditor — the single defense against script-URL XSS
 * (`javascript:`, `vbscript:`, `data:text/html`, …) reaching the exported HTML value, whether a URL
 * arrives via the toolbar dialogs, a paste, or a loaded value. Rejected URLs are neutralized (an
 * empty `src`, or a `'#'` `href`) rather than executed.
 */

// Link schemes we trust, plus relative/anchor/query starts (which carry no scheme at all).
const SAFE_LINK = /^(?:https?:|mailto:|tel:|ftp:|#|\/|\?|\.)/i
// Does the string begin with an explicit `scheme:` at all? (Anything schemeless is treated as relative.)
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i

/**
 * Sanitize a link `href`: allow `http(s)`/`mailto`/`tel`/`ftp` and relative/anchor/query URLs; any
 * other explicit scheme (`javascript:`, `data:`, `vbscript:`, …) collapses to `'#'`.
 */
export function sanitizeLinkUrl(url: string): string {
  const trimmed = url.trim()
  if (trimmed === '') return ''
  if (SAFE_LINK.test(trimmed)) return trimmed
  if (!HAS_SCHEME.test(trimmed)) return trimmed // schemeless (e.g. `example.com/x`) → relative, safe
  return '#' // a disallowed scheme
}

/**
 * Sanitize an image/video `src`: like {@link sanitizeLinkUrl}, but also permits inline
 * `data:image`/`data:video` (upload embeds) and `blob:` object URLs. A disallowed scheme yields `''`.
 */
export function sanitizeMediaUrl(url: string): string {
  const trimmed = url.trim()
  if (/^data:(?:image|video)\//i.test(trimmed) || /^blob:/i.test(trimmed)) return trimmed
  const safe = sanitizeLinkUrl(trimmed)
  return safe === '#' ? '' : safe
}
