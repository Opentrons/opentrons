import { describe, expect, it } from 'vitest'

import {
  getInvalidCharForKeyboard,
  shouldAcceptKeyboardInput,
} from '../externalKeyboardGuard'

describe('externalKeyboardGuard - alphanumeric', () => {
  it('returns null for empty value', () => {
    expect(getInvalidCharForKeyboard('', 'alphanumeric')).toBeNull()
  })

  it('allows lowercase letters', () => {
    expect(getInvalidCharForKeyboard('abc', 'alphanumeric')).toBeNull()
    expect(shouldAcceptKeyboardInput('abc', '', 'alphanumeric')).toBe(true)
  })

  it('allows uppercase letters', () => {
    expect(getInvalidCharForKeyboard('ABC', 'alphanumeric')).toBeNull()
    expect(shouldAcceptKeyboardInput('ABC', '', 'alphanumeric')).toBe(true)
  })

  it('allows digits', () => {
    expect(getInvalidCharForKeyboard('123', 'alphanumeric')).toBeNull()
    expect(shouldAcceptKeyboardInput('123', '', 'alphanumeric')).toBe(true)
  })

  it('detects invalid char after entry', () => {
    expect(shouldAcceptKeyboardInput('a!', 'a', 'alphanumeric')).toBe(true)
    expect(getInvalidCharForKeyboard('a!', 'alphanumeric')).toBe('!')
  })

  it('blocks further additions while invalid char remains', () => {
    expect(shouldAcceptKeyboardInput('a!b', 'a!', 'alphanumeric')).toBe(false)
    expect(getInvalidCharForKeyboard('a!', 'alphanumeric')).toBe('!')
  })

  it('allows deletion while in invalid state', () => {
    expect(shouldAcceptKeyboardInput('a', 'a!', 'alphanumeric')).toBe(true)
    expect(getInvalidCharForKeyboard('a', 'alphanumeric')).toBeNull()
  })

  it('clears invalidChar only when all invalid chars are removed', () => {
    expect(getInvalidCharForKeyboard('a!@', 'alphanumeric')).toBe('!')
    expect(shouldAcceptKeyboardInput('a!', 'a!@', 'alphanumeric')).toBe(true)
    expect(getInvalidCharForKeyboard('a!', 'alphanumeric')).toBe('!')
    expect(shouldAcceptKeyboardInput('a', 'a!', 'alphanumeric')).toBe(true)
    expect(getInvalidCharForKeyboard('a', 'alphanumeric')).toBeNull()
  })

  it('detects space character', () => {
    expect(shouldAcceptKeyboardInput('a b', 'a', 'alphanumeric')).toBe(true)
    expect(getInvalidCharForKeyboard('a b', 'alphanumeric')).toBe(' ')
  })

  it('handles paste: records first invalid char, blocks further additions', () => {
    expect(shouldAcceptKeyboardInput('ab!c@', '', 'alphanumeric')).toBe(true)
    expect(getInvalidCharForKeyboard('ab!c@', 'alphanumeric')).toBe('!')
    expect(shouldAcceptKeyboardInput('ab!c@d', 'ab!c@', 'alphanumeric')).toBe(
      false
    )
  })

  it('stays in sync when value is cleared without onChange', () => {
    expect(getInvalidCharForKeyboard('', 'alphanumeric')).toBeNull()
  })
})

describe('externalKeyboardGuard - numerical', () => {
  it('allows digits for int keyboard', () => {
    expect(getInvalidCharForKeyboard('123', 'numerical')).toBeNull()
    expect(shouldAcceptKeyboardInput('123', '', 'numerical')).toBe(true)
  })

  it('detects decimal point on int keyboard', () => {
    expect(
      shouldAcceptKeyboardInput('1.', '1', 'numerical', {
        isDecimal: false,
      })
    ).toBe(true)
    expect(
      getInvalidCharForKeyboard('1.', 'numerical', { isDecimal: false })
    ).toBe('.')
  })

  it('allows decimal point when isDecimal=true', () => {
    expect(
      getInvalidCharForKeyboard('1.', 'numerical', { isDecimal: true })
    ).toBeNull()
    expect(
      shouldAcceptKeyboardInput('1.', '1', 'numerical', { isDecimal: true })
    ).toBe(true)
  })

  it('detects hyphen when hasHyphen=false', () => {
    expect(
      shouldAcceptKeyboardInput('-1', '', 'numerical', {
        hasHyphen: false,
      })
    ).toBe(true)
    expect(
      getInvalidCharForKeyboard('-1', 'numerical', { hasHyphen: false })
    ).toBe('-')
  })

  it('allows hyphen when hasHyphen=true', () => {
    expect(
      getInvalidCharForKeyboard('-1', 'numerical', { hasHyphen: true })
    ).toBeNull()
    expect(
      shouldAcceptKeyboardInput('-1', '', 'numerical', { hasHyphen: true })
    ).toBe(true)
  })
})
