import { describe, expect, it } from 'vitest'

import { getInvalidCharForKeyboard } from '../externalKeyboardGuard'

describe('getInvalidCharForKeyboard - alphanumeric', () => {
  it('returns null for empty value', () => {
    expect(getInvalidCharForKeyboard('', 'alphanumeric')).toBeNull()
  })

  it('allows lowercase letters', () => {
    expect(getInvalidCharForKeyboard('abc', 'alphanumeric')).toBeNull()
  })

  it('allows uppercase letters', () => {
    expect(getInvalidCharForKeyboard('ABC', 'alphanumeric')).toBeNull()
  })

  it('allows digits', () => {
    expect(getInvalidCharForKeyboard('123', 'alphanumeric')).toBeNull()
  })

  it('detects invalid char after entry', () => {
    expect(getInvalidCharForKeyboard('a!', 'alphanumeric')).toBe('!')
  })

  it('detects space character', () => {
    expect(getInvalidCharForKeyboard('a b', 'alphanumeric')).toBe(' ')
  })

  it('reports the first invalid char when several are present', () => {
    expect(getInvalidCharForKeyboard('ab!c@', 'alphanumeric')).toBe('!')
  })
})

describe('getInvalidCharForKeyboard - numerical', () => {
  it('allows digits for int keyboard', () => {
    expect(getInvalidCharForKeyboard('123', 'numerical')).toBeNull()
  })

  it('detects decimal point on int keyboard', () => {
    expect(
      getInvalidCharForKeyboard('1.', 'numerical', { isDecimal: false })
    ).toBe('.')
  })

  it('allows decimal point when isDecimal=true', () => {
    expect(
      getInvalidCharForKeyboard('1.', 'numerical', { isDecimal: true })
    ).toBeNull()
  })

  it('detects hyphen when hasHyphen=false', () => {
    expect(
      getInvalidCharForKeyboard('-1', 'numerical', { hasHyphen: false })
    ).toBe('-')
  })

  it('allows hyphen when hasHyphen=true', () => {
    expect(
      getInvalidCharForKeyboard('-1', 'numerical', { hasHyphen: true })
    ).toBeNull()
  })
})
