import { describe, expect, it } from 'vitest'

import {
  getPasswordComplexityError,
  PASSWORD_SPECIAL_CHARACTERS,
} from '../getPasswordComplexityError'

describe('getPasswordComplexityError', () => {
  it('returns tooShort when the password is shorter than the minimum', () => {
    expect(
      getPasswordComplexityError('short', {
        minLength: 8,
        requireSpecialCharacters: false,
      })
    ).toBe('tooShort')
  })

  it('returns tooShort when both length and special-character rules fail', () => {
    expect(
      getPasswordComplexityError('abc', {
        minLength: 8,
        requireSpecialCharacters: true,
      })
    ).toBe('tooShort')
  })

  it('returns missingSpecialCharacters when length is met but a special character is required', () => {
    expect(
      getPasswordComplexityError('password1', {
        minLength: 8,
        requireSpecialCharacters: true,
      })
    ).toBe('missingSpecialCharacters')
  })

  it('returns null when the password meets length and special-character rules', () => {
    expect(
      getPasswordComplexityError('password!', {
        minLength: 8,
        requireSpecialCharacters: true,
      })
    ).toBeNull()
  })

  it('returns null when special characters are not required', () => {
    expect(
      getPasswordComplexityError('password1', {
        minLength: 8,
        requireSpecialCharacters: false,
      })
    ).toBeNull()
  })

  it('counts unicode code points for length', () => {
    expect(
      getPasswordComplexityError('☃'.repeat(7), {
        minLength: 8,
        requireSpecialCharacters: false,
      })
    ).toBe('tooShort')
    expect(
      getPasswordComplexityError('☃'.repeat(8), {
        minLength: 8,
        requireSpecialCharacters: false,
      })
    ).toBeNull()
  })

  it('accepts every punctuation character used by auth-server', () => {
    for (const character of PASSWORD_SPECIAL_CHARACTERS) {
      expect(
        getPasswordComplexityError(`password${character}`, {
          minLength: 8,
          requireSpecialCharacters: true,
        })
      ).toBeNull()
    }
  })
})
