import {
  forwardRef,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { space, type Spacing } from '../Flex/Flex'
import { ListSizeContext } from './listContext'
import type { ListItemSize } from './ListItem'

export interface ListProps extends HTMLAttributes<HTMLElement> {
  /** Render a different element — e.g. `'ul'`, `'nav'`, `'menu'`. Defaults to `div`. */
  as?: ElementType
  /** Gap between items (token key, px number, or CSS value). Defaults to `2px`. */
  gap?: Spacing
  /** Padding around the list (token key, px number, or CSS value). */
  padding?: Spacing
  /** Default size for the contained `ListItem`s — each item can still override its own `size`. */
  size?: ListItemSize
  children?: ReactNode
}

/**
 * A thin semantic container for `ListItem`s — a vertical stack with a configurable `gap`/`padding`
 * and `role="list"` (override `role` to `"menu"` for a dropdown, etc.). `size` sets a default for all
 * contained `ListItem`s. Layout is set via inline style, matching the `Flex`/`Grid` primitives.
 */
export const List = forwardRef<HTMLElement, ListProps>(function List(
  { as, gap = 2, padding, role = 'list', size, style, children, ...props },
  ref,
) {
  const Component = (as ?? 'div') as ElementType
  return (
    <Component
      ref={ref}
      role={role}
      style={
        {
          display: 'flex',
          flexDirection: 'column',
          gap: space(gap),
          padding: space(padding),
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      {size ? (
        <ListSizeContext.Provider value={size}>{children}</ListSizeContext.Provider>
      ) : (
        children
      )}
    </Component>
  )
})
