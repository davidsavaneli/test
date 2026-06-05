import { forwardRef } from 'react'
import { Flex, type FlexProps } from './Flex'

export interface RowProps extends Omit<FlexProps, 'direction'> {}

/**
 * A horizontal flex row. `Flex` with `direction="row"` and `align="center"` by default — override
 * `align`/`gap`/`justify`/`wrap`/`padding` via props.
 */
export const Row = forwardRef<HTMLDivElement, RowProps>(function Row(props, ref) {
  return <Flex ref={ref} direction="row" align="center" {...props} />
})
