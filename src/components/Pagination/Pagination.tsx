import {
  forwardRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { Icon, type IconName } from '../Icon'
import type { ThemeColor } from '../../theme'
import { paginationRange } from './paginationRange'
import styles from './Pagination.module.css'

export type PaginationVariant = 'outlined' | 'text'
export type PaginationSize = 'sm' | 'md' | 'lg'

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'color' | 'onChange'> {
  /** Total number of pages (required). From a row count, pass `Math.ceil(total / pageSize)`. */
  count: number
  /** Controlled current page (1-based). */
  page?: number
  /** Initial page for uncontrolled use (1-based). Defaults to `1`. */
  defaultPage?: number
  /** Fires with the next page (1-based) when a page or arrow is activated. */
  onChange?: (page: number) => void
  /** Pages shown on each side of the current page. Defaults to `1`. */
  siblingCount?: number
  /** Pages always shown at the start and end. Defaults to `1`. */
  boundaryCount?: number
  /** Show a jump-to-first-page button before the previous arrow. Defaults to `false`. */
  showFirstButton?: boolean
  /** Show a jump-to-last-page button after the next arrow. Defaults to `false`. */
  showLastButton?: boolean
  /** Hide the previous-page arrow. Defaults to `false`. */
  hidePrevButton?: boolean
  /** Hide the next-page arrow. Defaults to `false`. */
  hideNextButton?: boolean
  /** Item style: `outlined` (bordered boxes, default) or `text` (borderless). */
  variant?: PaginationVariant
  /** Control size — sets the box, font, and icon sizes. Defaults to `md`. */
  size?: PaginationSize
  /** Brand palette token that tints the selected page. Defaults to `medium`. */
  color?: ThemeColor
  /** Render circular page buttons instead of rounded rectangles. Defaults to `false`. */
  rounded?: boolean
  /** Disable the whole control. Defaults to `false`. */
  disabled?: boolean
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi)

/**
 * A page navigator — previous/next arrows around a numbered range with `…` gaps (`1 … 4 5 6 … 10`),
 * the classic pager. Reusable across tables, lists, and galleries: drive it with `count` (total
 * pages) + `page`/`onChange`, computing `count` as `Math.ceil(total / pageSize)`. The selected page
 * is tinted via the shared `--tz-btn-rgb` pattern; unselected items are bordered (`outlined`) or
 * borderless (`text`). Controlled (`page` + `onChange`) or uncontrolled (`defaultPage`).
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    count,
    page,
    defaultPage = 1,
    onChange,
    siblingCount = 1,
    boundaryCount = 1,
    showFirstButton = false,
    showLastButton = false,
    hidePrevButton = false,
    hideNextButton = false,
    variant = 'outlined',
    size = 'md',
    color = 'brand',
    rounded = false,
    disabled = false,
    className,
    style,
    'aria-label': ariaLabel = 'Pagination',
    ...props
  },
  ref,
) {
  const isControlled = page !== undefined
  const [internal, setInternal] = useState(defaultPage)
  const lastPage = Math.max(count, 1)
  const current = clamp(isControlled ? page! : internal, 1, lastPage)

  const go = (next: number) => {
    const target = clamp(next, 1, lastPage)
    if (target === current) return
    if (!isControlled) setInternal(target)
    onChange?.(target)
  }

  const items = paginationRange({ count, page: current, siblingCount, boundaryCount })

  // The selected fill + its readable text color, derived once via the shared button-tint vars.
  const rootStyle = {
    '--tz-btn-rgb': `var(--tz-color-${color}-rgb)`,
    '--tz-btn-on': `var(--tz-color-${color}-contrast, #fff)`,
    ...style,
  } as CSSProperties

  // An arrow / jump control. `flip` mirrors the (left-pointing) icon to face right — the icon set has
  // no matching plain right arrow, so the next/last glyphs are the left ones flipped for symmetry.
  const control = (
    key: string,
    icon: IconName,
    label: string,
    target: number,
    hidden: boolean,
    atBound: boolean,
    flip = false,
  ): ReactNode =>
    hidden ? null : (
      <li key={key} className={styles.item}>
        <button
          type="button"
          className={clsx(styles.page, styles.arrow)}
          aria-label={label}
          disabled={disabled || atBound}
          onClick={() => go(target)}
        >
          <Icon name={icon} size={size} className={flip ? styles.flip : undefined} />
        </button>
      </li>
    )

  return (
    <nav
      ref={ref}
      aria-label={ariaLabel}
      className={clsx(
        styles.pagination,
        styles[variant],
        styles[size],
        rounded && styles.rounded,
        className,
      )}
      style={rootStyle}
      {...props}
    >
      <ul className={styles.list}>
        {showFirstButton &&
          control('first', 'Previous', 'Go to first page', 1, false, current <= 1)}
        {control(
          'prev',
          'ArrowLeft',
          'Go to previous page',
          current - 1,
          hidePrevButton,
          current <= 1,
        )}
        {items.map((item, i) =>
          typeof item === 'number' ? (
            <li key={item} className={styles.item}>
              <button
                type="button"
                className={clsx(styles.page, item === current && styles.selected)}
                aria-label={`Go to page ${item}`}
                aria-current={item === current ? 'page' : undefined}
                disabled={disabled}
                onClick={() => go(item)}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={`${item}-${i}`} className={styles.item} aria-hidden>
              <span className={styles.ellipsis}>…</span>
            </li>
          ),
        )}
        {control(
          'next',
          'ArrowLeft',
          'Go to next page',
          current + 1,
          hideNextButton,
          current >= count,
          true,
        )}
        {showLastButton &&
          control('last', 'Next', 'Go to last page', count, false, current >= count)}
      </ul>
    </nav>
  )
})
