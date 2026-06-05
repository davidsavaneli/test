import { forwardRef } from 'react'
import { Flex, type FlexProps } from './Flex'

export interface ColProps extends Omit<FlexProps, 'direction'> {}

/**
 * A vertical flex column. `Flex` with `direction="column"` (children stretch to full width by
 * default) — set `gap`/`align`/`justify`/`padding` via props.
 */
export const Col = forwardRef<HTMLDivElement, ColProps>(function Col(props, ref) {
  return <Flex ref={ref} direction="column" {...props} />
})
