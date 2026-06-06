import { createContext, useContext } from 'react'
import type { ListItemSize } from './ListItem'

/** Lets a `List` set a default size that its `ListItem`s inherit (an explicit item `size` still wins). */
export const ListSizeContext = createContext<ListItemSize | undefined>(undefined)

/** Read the size provided by a surrounding `List`, if any. */
export const useListSize = (): ListItemSize | undefined => useContext(ListSizeContext)
