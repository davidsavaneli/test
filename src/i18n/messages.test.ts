import { describe, expect, it } from 'vitest'
import { createAppTranslator, createTranslator } from './messages'

describe('createTranslator', () => {
  it('returns English for en / unknown locales (baseline fallback)', () => {
    expect(createTranslator('en-US')('select.placeholder')).toBe('Select…')
    // a language the library doesn't ship falls back to English per key
    expect(createTranslator('fr-FR')('select.noOptions')).toBe('No options')
  })

  it('returns a shipped built-in translation, matched by base language', () => {
    const t = createTranslator('ka-GE')
    expect(t('select.placeholder')).toBe('აირჩიეთ…')
    expect(t('userCard.signOut')).toBe('გასვლა')
  })

  it('lets a consumer override win (by exact code or base), else falls back', () => {
    const t = createTranslator('ka-GE', {
      ka: { 'select.placeholder': 'აირჩიე' },
      'ka-GE': { 'common.close': 'დახურე' },
    })
    expect(t('select.placeholder')).toBe('აირჩიე') // base override
    expect(t('common.close')).toBe('დახურე') // exact-code override wins
    expect(t('userCard.signOut')).toBe('გასვლა') // unset → built-in ka
  })

  it('interpolates {name} tokens from vars', () => {
    expect(createTranslator('en')('pagination.page', { page: 3 })).toBe('Go to page 3')
    expect(createTranslator('ka')('pagination.page', { page: 7 })).toBe('გვერდი 7')
  })
})

describe('createAppTranslator', () => {
  const APP = {
    en: { 'tx.title': 'Customer transactions', 'tx.count': '{count} transactions' },
    ka: { 'tx.title': 'მომხმარებლის ტრანზაქციები', 'tx.count': '{count} ტრანზაქცია' },
  }

  it('resolves the active language, matched by base code', () => {
    expect(createAppTranslator('en-US', APP)('tx.title')).toBe('Customer transactions')
    expect(createAppTranslator('ka-GE', APP)('tx.title')).toBe('მომხმარებლის ტრანზაქციები')
  })

  it('falls back English → the key itself for a missing language / key', () => {
    // a language not in the catalogs falls back to English per key
    expect(createAppTranslator('fr-FR', APP)('tx.title')).toBe('Customer transactions')
    // an unknown key echoes back (visible, not blank) — and it's safe with no catalogs at all
    expect(createAppTranslator('ka-GE', APP)('tx.unknown')).toBe('tx.unknown')
    expect(createAppTranslator('en')('anything')).toBe('anything')
  })

  it('interpolates {name} tokens from vars', () => {
    expect(createAppTranslator('en', APP)('tx.count', { count: 128 })).toBe('128 transactions')
    expect(createAppTranslator('ka', APP)('tx.count', { count: 5 })).toBe('5 ტრანზაქცია')
  })
})
