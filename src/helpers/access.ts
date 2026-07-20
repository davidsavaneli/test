import { useSyncExternalStore } from 'react'

// Module singleton — readable BOTH from React components (via `useAccessKeys`) and from
// TanStack `beforeLoad` guards (via `hasAccess`), which run outside React.
let keys: string[] = []
const listeners = new Set<() => void>()

/** Set the current user's accessKeys (call after login / getUser; pass `[]` on logout). */
export function setAccessKeys(next: string[]) {
  keys = next ?? []
  listeners.forEach((l) => l())
}

/** The current user's accessKeys (non-reactive read; safe outside React). */
export function getAccessKeys() {
  return keys
}

/**
 * OR semantics: a route with no `roles` (omitted/empty) is public; otherwise the user needs at
 * least one matching key. Works outside React — used by route `beforeLoad` guards.
 */
export function hasAccess(roles?: string[]) {
  if (!roles || roles.length === 0) return true
  return roles.some((r) => keys.includes(r))
}

// hoisted so its identity is stable across renders — an inline arrow would make
// useSyncExternalStore unsubscribe+resubscribe on every render of every consumer
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** Reactive read for components — re-renders the subscriber when the keys change (login/logout). */
export function useAccessKeys() {
  return useSyncExternalStore(subscribe, getAccessKeys, getAccessKeys)
}
