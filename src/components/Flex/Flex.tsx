import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react'

/** A space value: a `--tz-space-*` scale key, a raw number (px), or any CSS length string. */
export type Spacing = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | number | (string & {})
export type FlexDirection = 'row' | 'column'
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
export type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'

const SCALE = new Set(['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'])
const ALIGN: Record<FlexAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
}
const JUSTIFY: Record<FlexJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
}

/** Resolve a `Spacing` to a CSS value — scale key → token, number → px, else passthrough. */
export function space(value?: Spacing): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'number') return `${value}px`
  return SCALE.has(value) ? `var(--tz-space-${value})` : value
}

export interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  /** Main axis. `row` (default) or `column`. */
  direction?: FlexDirection
  /** Gap between children (token key, px number, or CSS value). */
  gap?: Spacing
  /** `align-items`. */
  align?: FlexAlign
  /** `justify-content`. */
  justify?: FlexJustify
  /** Allow children to wrap onto multiple lines. */
  wrap?: boolean
  /** Padding (token key, px number, or CSS value — e.g. `"24px 8px"`). */
  padding?: Spacing
  /** Render as `inline-flex` instead of `flex`. */
  inline?: boolean
  /** The box's own `flex-grow` (when this Flex is itself a flex child). `true` = `1`. */
  grow?: boolean | number
}

/**
 * A flexbox layout primitive — set direction/gap/alignment/padding via props instead of inline styles.
 * `Row` and `Col` are thin presets over it. Spacing accepts `--tz-space-*` keys (`"md"`), raw px
 * numbers, or any CSS value; consumer `style` still merges last.
 */
export const Flex = forwardRef<HTMLDivElement, FlexProps>(function Flex(
  {
    direction = 'row',
    gap,
    align,
    justify,
    wrap = false,
    padding,
    inline = false,
    grow,
    style,
    ...props
  },
  ref,
) {
  const flexStyle: CSSProperties = {
    display: inline ? 'inline-flex' : 'flex',
    flexDirection: direction,
    gap: space(gap),
    alignItems: align && ALIGN[align],
    justifyContent: justify && JUSTIFY[justify],
    flexWrap: wrap ? 'wrap' : undefined,
    padding: space(padding),
    flexGrow: grow === true ? 1 : grow === false ? undefined : grow,
    ...style,
  }
  return <div ref={ref} style={flexStyle} {...props} />
})
