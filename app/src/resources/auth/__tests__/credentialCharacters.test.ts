import { describe, expect, it } from 'vitest'

import {
  CREDENTIAL_SPECIAL_CHARACTERS,
  hasOnlyAllowedCredentialCharacters,
  SOFTWARE_KEYBOARD_SYMBOLS,
} from '../credentialCharacters'

describe('credentialCharacters', () => {
  it('uses the ODD software keyboard symbol set', () => {
    expect(CREDENTIAL_SPECIAL_CHARACTERS).toBe(SOFTWARE_KEYBOARD_SYMBOLS)
    expect(CREDENTIAL_SPECIAL_CHARACTERS.includes('`')).toBe(false)
  })

  it('allows spaces in passwords and rejects characters off the keyboard', () => {
    expect(hasOnlyAllowedCredentialCharacters('pass word')).toBe(true)
    expect(hasOnlyAllowedCredentialCharacters('pass\tword')).toBe(false)
    expect(hasOnlyAllowedCredentialCharacters('Ada_Lovelace-1!')).toBe(true)
    expect(hasOnlyAllowedCredentialCharacters('你hao')).toBe(true)
    expect(hasOnlyAllowedCredentialCharacters('José')).toBe(false)
  })
})
