import { beforeEach, describe, expect, it } from 'vitest'
import { applyTheme } from './applyTheme'

/** Reads a CSS custom property off an element's inline style. */
const cssVar = (el: HTMLElement, name: string) => el.style.getPropertyValue(name).trim()

describe('applyTheme', () => {
  let target: HTMLElement

  beforeEach(() => {
    target = document.createElement('div')
  })

  it('writes each color as a "r, g, b" triplet', () => {
    applyTheme({ primary: '#13404e' }, target)
    expect(cssVar(target, '--tz-color-primary-rgb')).toBe('19, 64, 78')
  })

  it('expands 3-digit hex shorthand', () => {
    applyTheme({ primary: '#fff' }, target)
    expect(cssVar(target, '--tz-color-primary-rgb')).toBe('255, 255, 255')
  })

  it('skips falsy color values', () => {
    applyTheme({ primary: '', secondary: '#ffffff' }, target)
    expect(cssVar(target, '--tz-color-primary-rgb')).toBe('')
    expect(cssVar(target, '--tz-color-secondary-rgb')).toBe('255, 255, 255')
  })

  describe('contrast color', () => {
    it('uses white on a dark fill', () => {
      applyTheme({ primary: '#13404e' }, target)
      expect(cssVar(target, '--tz-color-primary-contrast')).toBe('#ffffff')
    })

    it('uses near-black on a light fill (YIQ >= 150)', () => {
      // a light fill on a non-overridden color falls through to the luminance pick
      applyTheme({ primary: '#f4f9f8' }, target)
      expect(cssVar(target, '--tz-color-primary-contrast')).toBe('#04202b')
    })

    it('overrides `secondary` to the primary color regardless of its hex', () => {
      applyTheme({ secondary: '#f4f9f8' }, target)
      expect(cssVar(target, '--tz-color-secondary-contrast')).toBe(
        'rgb(var(--tz-color-primary-rgb))',
      )
    })

    it('keeps the `warning` label white even though it is a light fill', () => {
      applyTheme({ warning: '#ffbf00' }, target)
      expect(cssVar(target, '--tz-color-warning-contrast')).toBe('#ffffff')
    })
  })
})
