import { describe, expect, it } from 'vitest'

import {
  CREDENTIAL_ALLOWED_CHARACTERS,
  CREDENTIAL_ALLOWED_PATTERN,
  CREDENTIAL_SPECIAL_CHARACTERS,
  hasOnlyAllowedCredentialCharacters,
} from '../credentialCharacters'

describe('credentialCharacters', () => {
  it('matches Python string.punctuation for the special-character set', () => {
    expect(CREDENTIAL_SPECIAL_CHARACTERS).toBe(
      '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
    )
  })

  it('includes letters, digits, and every special character', () => {
    expect(
      CREDENTIAL_ALLOWED_CHARACTERS.startsWith('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    ).toBe(true)
    for (const character of CREDENTIAL_SPECIAL_CHARACTERS) {
      expect(CREDENTIAL_ALLOWED_CHARACTERS.includes(character)).toBe(true)
      expect(CREDENTIAL_ALLOWED_PATTERN.test(`a${character}`)).toBe(true)
    }
  })

  it('rejects spaces and other whitespace', () => {
    expect(hasOnlyAllowedCredentialCharacters('pass word')).toBe(false)
    expect(hasOnlyAllowedCredentialCharacters('pass\tword')).toBe(false)
  })

  it('accepts a typical username or password', () => {
    expect(hasOnlyAllowedCredentialCharacters('Ada_Lovelace-1!')).toBe(true)
  })
})
