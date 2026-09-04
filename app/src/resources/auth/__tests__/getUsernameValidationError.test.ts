import { describe, expect, it } from 'vitest'

import { SOFTWARE_KEYBOARD_SYMBOLS } from '../credentialCharacters'
import { getUsernameValidationError } from '../getUsernameValidationError'

describe('getUsernameValidationError', () => {
  it('returns null for an empty username so callers can treat required separately', () => {
    expect(getUsernameValidationError('')).toBeNull()
  })

  it('returns tooLong when the username exceeds the max length', () => {
    expect(getUsernameValidationError('thisusernameistoolong1', 20)).toBe(
      'tooLong'
    )
  })

  it('prefers tooLong when the username is both too long and has a space', () => {
    expect(getUsernameValidationError('this username is long', 20)).toBe(
      'tooLong'
    )
  })

  it('returns invalidCharacters when the username contains a space', () => {
    expect(getUsernameValidationError('test user')).toBe('invalidCharacters')
  })

  it('returns invalidCharacters for other whitespace', () => {
    expect(getUsernameValidationError('test\tuser')).toBe('invalidCharacters')
  })

  it('accepts letters, digits, keyboard symbols, and candidate hanzi', () => {
    expect(getUsernameValidationError('Ada_Lovelace-1')).toBeNull()
    expect(
      getUsernameValidationError(`user${SOFTWARE_KEYBOARD_SYMBOLS[0]}`)
    ).toBeNull()
    expect(getUsernameValidationError('张伟')).toBeNull()
    for (const character of SOFTWARE_KEYBOARD_SYMBOLS) {
      expect(getUsernameValidationError(`a${character}`)).toBeNull()
    }
  })

  it('rejects characters outside the software keyboard allowlist', () => {
    expect(getUsernameValidationError('José')).toBe('invalidCharacters')
    expect(getUsernameValidationError('user`')).toBe('invalidCharacters')
  })
})
