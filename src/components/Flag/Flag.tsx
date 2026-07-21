import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { flagFor } from '../../i18n/messages'
import styles from './Flag.module.css'

export interface FlagProps extends HTMLAttributes<HTMLSpanElement> {
  /** UI-language code (e.g. `'ka-GE'`); the flag is matched by base language via `flagFor`. */
  code: string
  /** Flag height in px (width follows the 4:3 flag ratio). Defaults to `16`. */
  size?: number
}

/**
 * A small rounded country/language flag, rendered from the library's built-in flag registry
 * (`flagFor(code)`, matched by base language). The SVG is library-shipped (trusted), so it's injected as
 * markup; the component renders **nothing** when the language has no shipped flag. Used by the shell's
 * header language switcher, but public for any language UI.
 */
export const Flag = forwardRef<HTMLSpanElement, FlagProps>(function Flag(
  { code, size = 16, className, style, ...props },
  ref,
) {
  const svg = flagFor(code)
  if (!svg) return null
  return (
    <span
      ref={ref}
      className={clsx(styles.flag, className)}
      style={{ '--tz-flag-height': `${size}px`, ...style } as CSSProperties}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
      {...props}
    />
  )
})
