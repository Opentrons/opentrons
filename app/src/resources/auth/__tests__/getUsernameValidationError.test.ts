import { describe, expect, it } from 'vitest'

import {
  CREDENTIAL_ALLOWED_CHARACTERS,
  CREDENTIAL_ALLOWED_PATTERN,
  CREDENTIAL_SPECIAL_CHARACTERS,
} from '../credentialCharacters'
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

  it('accepts letters, digits, and every password punctuation character', () => {
    expect(getUsernameValidationError('Ada_Lovelace-1')).toBeNull()
    expect(
      getUsernameValidationError(`user${CREDENTIAL_SPECIAL_CHARACTERS[0]}`)
    ).toBeNull()
    for (const character of CREDENTIAL_SPECIAL_CHARACTERS) {
      expect(CREDENTIAL_ALLOWED_CHARACTERS.includes(character)).toBe(true)
      expect(CREDENTIAL_ALLOWED_PATTERN.test(`a${character}`)).toBe(true)
    }
  })

  it('rejects characters outside the password-compatible allowlist', () => {
    expect(getUsernameValidationError('José')).toBe('invalidCharacters')
  })
})
