import { useLayoutEffect } from 'react'

/**
 * Locks scrolling on `document.body` while `locked` is true (e.g. an open menu / modal / drawer).
 * Compensates for the removed scrollbar with matching `padding-right` so the page doesn't shift, and
 * restores the previous inline styles when unlocked. Safe to nest (restores in LIFO order).
 */
export function useLockBodyScroll(locked: boolean): void {
  useLayoutEffect(() => {
    if (!locked || typeof document === 'undefined') return
    const html = document.documentElement
    const { body } = document
    const previousHtmlOverflow = html.style.overflow
    const previousBodyOverflow = body.style.overflow
    const previousPaddingRight = body.style.paddingRight
    const scrollbarWidth = window.innerWidth - html.clientWidth

    // `clip` (not `hidden`) locks scroll WITHOUT establishing a scroll container, so `position: sticky`
    // descendants (e.g. a sticky sidebar/header) keep working instead of jumping while the menu is open
    html.style.overflow = 'clip'
    body.style.overflow = 'clip'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      html.style.overflow = previousHtmlOverflow
      body.style.overflow = previousBodyOverflow
      body.style.paddingRight = previousPaddingRight
    }
  }, [locked])
}
