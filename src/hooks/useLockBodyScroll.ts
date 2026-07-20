import { useEffect, useLayoutEffect } from 'react'

// `useLayoutEffect` warns during SSR; fall back to `useEffect` on the server (neither runs there anyway).
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// Module-level lock: a ref-count + the styles captured on the FIRST lock. Shared across all instances so
// nested locks (a Select popover open inside a Modal, etc.) are safe to release in ANY order — the page
// only unlocks when the last one releases, and always restores the true originals (not another lock's).
let lockCount = 0
let saved: { htmlOverflow: string; bodyOverflow: string; bodyPaddingRight: string } | null = null

function acquire(): void {
  if (lockCount === 0) {
    const html = document.documentElement
    const { body } = document
    saved = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
    }
    const scrollbarWidth = window.innerWidth - html.clientWidth
    // `clip` (not `hidden`) locks scroll WITHOUT establishing a scroll container, so `position: sticky`
    // descendants (a sticky sidebar/header) keep working instead of jumping while the overlay is open
    html.style.overflow = 'clip'
    body.style.overflow = 'clip'
    if (scrollbarWidth > 0) {
      // augment any existing body padding rather than overwrite it (consumer apps may pad the body)
      const current = parseFloat(getComputedStyle(body).paddingRight) || 0
      body.style.paddingRight = `${current + scrollbarWidth}px`
    }
  }
  lockCount += 1
}

function release(): void {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0 && saved) {
    const html = document.documentElement
    const { body } = document
    html.style.overflow = saved.htmlOverflow
    body.style.overflow = saved.bodyOverflow
    body.style.paddingRight = saved.bodyPaddingRight
    saved = null
  }
}

/**
 * Locks scrolling on `document.body` while `locked` is true (e.g. an open menu / modal / drawer).
 * Compensates for the removed scrollbar by **adding** to the body's `padding-right` so the page doesn't
 * shift, and restores the previous inline styles when unlocked. **Ref-counted** — nested locks are safe
 * to release in any order; the page unlocks only when the last one releases. SSR-safe.
 */
export function useLockBodyScroll(locked: boolean): void {
  useIsomorphicLayoutEffect(() => {
    if (!locked || typeof document === 'undefined') return
    acquire()
    return release
  }, [locked])
}
