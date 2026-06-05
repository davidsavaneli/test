import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react'
import { space, type FlexAlign, type Spacing } from './Flex'

const GRID_ALIGN: Record<FlexAlign, string> = {
  start: 'start',
  center: 'center',
  end: 'end',
  stretch: 'stretch',
  baseline: 'baseline',
}

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Fixed column count (`repeat(n, minmax(0,1fr))`) or a raw `grid-template-columns` string. */
  cols?: number | string
  /** Responsive columns: every cell at least this wide, auto-fitting to the width (overrides `cols`). */
  minItemWidth?: Spacing
  /** Gap between cells (token key, px number, or CSS value). */
  gap?: Spacing
  /** `align-items` for the cells. */
  align?: FlexAlign
  /** Padding (token key, px number, or CSS value). */
  padding?: Spacing
  /** Render as `inline-grid`. */
  inline?: boolean
}

/**
 * A CSS-grid layout primitive — lay children out in columns via props. Use `cols` for a fixed count
 * or `minItemWidth` for a responsive grid that auto-fits as many equal columns as fit (collapsing to
 * one on narrow widths). Spacing accepts `--tz-space-*` keys, px numbers, or any CSS value; consumer
 * `style` merges last.
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { cols, minItemWidth, gap, align, padding, inline = false, style, ...props },
  ref,
) {
  const gridTemplateColumns =
    minItemWidth != null
      ? `repeat(auto-fit, minmax(${space(minItemWidth)}, 1fr))`
      : typeof cols === 'number'
        ? `repeat(${cols}, minmax(0, 1fr))`
        : cols

  const gridStyle: CSSProperties = {
    display: inline ? 'inline-grid' : 'grid',
    gridTemplateColumns,
    gap: space(gap),
    alignItems: align && GRID_ALIGN[align],
    padding: space(padding),
    ...style,
  }
  return <div ref={ref} style={gridStyle} {...props} />
})
