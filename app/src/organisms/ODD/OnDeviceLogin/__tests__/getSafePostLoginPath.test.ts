import { describe, expect, it } from 'vitest'

import { getSafePostLoginPath } from '../getSafePostLoginPath'

describe('getSafePostLoginPath', () => {
  it('returns the path when from is a valid internal path', () => {
    expect(getSafePostLoginPath('/protocols')).toBe('/protocols')
  })

  it('returns null for invalid values', () => {
    expect(getSafePostLoginPath(undefined)).toBeNull()
    expect(getSafePostLoginPath('')).toBeNull()
    expect(getSafePostLoginPath('//evil.com')).toBeNull()
    expect(getSafePostLoginPath('http://evil.com')).toBeNull()
  })
})
