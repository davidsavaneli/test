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

    // lock the root scroller (html) and body — covers both page-scroll and body-scroll layouts
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      html.style.overflow = previousHtmlOverflow
      body.style.overflow = previousBodyOverflow
      body.style.paddingRight = previousPaddingRight
    }
  }, [locked])
}
