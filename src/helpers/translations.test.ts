import { describe, expect, it } from 'vitest'
import {
  buildTranslationName,
  buildTranslations,
  flattenTranslations,
  nestTranslations,
  toFormData,
} from './translations'

const LOCALES = [
  { code: 'en-US', label: 'English' },
  { code: 'ka-GE', label: 'ქართული' },
]

describe('buildTranslationName', () => {
  it('namespaces a field by locale', () => {
    expect(buildTranslationName('en-US', 'title')).toBe('translations[en-US].title')
  })
})

describe('buildTranslations', () => {
  it('expands per-field values across locale codes', () => {
    expect(buildTranslations(['en-US', 'ka-GE'], { title: '', body: '' })).toEqual({
      'translations[en-US].title': '',
      'translations[en-US].body': '',
      'translations[ka-GE].title': '',
      'translations[ka-GE].body': '',
    })
  })

  it('accepts LocaleConfig objects + a custom namespace', () => {
    expect(buildTranslations(LOCALES, { title: 1 }, 'languages')).toEqual({
      'languages[en-US].title': 1,
      'languages[ka-GE].title': 1,
    })
  })
})

describe('nestTranslations / flattenTranslations', () => {
  const flat = {
    email: 1,
    'translations[en-US].title': "McDonald's",
    'translations[en-US].description': '<p>en</p>',
    'translations[ka-GE].title': 'მაკდონალდსი',
    'translations[ka-GE].description': '<p>ka</p>',
  }
  const nested = {
    email: 1,
    translations: {
      'en-US': { title: "McDonald's", description: '<p>en</p>' },
      'ka-GE': { title: 'მაკდონალდსი', description: '<p>ka</p>' },
    },
  }

  it('nests flat translation keys (others stay top-level)', () => {
    expect(nestTranslations(flat)).toEqual(nested)
  })

  it('flattens a nested object back to flat keys', () => {
    expect(flattenTranslations(nested)).toEqual(flat)
  })

  it('round-trips and honors a custom namespace', () => {
    const f = { email: 1, 'languages[en-US].title': 'Hi' }
    expect(nestTranslations(f, 'languages')).toEqual({
      email: 1,
      languages: { 'en-US': { title: 'Hi' } },
    })
    expect(flattenTranslations(nestTranslations(f, 'languages'), 'languages')).toEqual(f)
  })
})

describe('toFormData', () => {
  it('serializes flat values — translation keys pass through, arrays index, null is skipped', () => {
    const fd = toFormData({
      email: 'a@b.com',
      quantity: null,
      published: true,
      tags: ['x', 'y'],
      'translations[en-US].title': 'Hi',
    })
    expect(Object.fromEntries(fd.entries())).toEqual({
      email: 'a@b.com',
      published: 'true',
      'tags[0]': 'x',
      'tags[1]': 'y',
      'translations[en-US].title': 'Hi',
    })
    expect(fd.has('quantity')).toBe(false) // null skipped
  })
})
