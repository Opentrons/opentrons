import { describe, expect, it } from 'vitest'

import { isSupportedVersion } from '../utils'

describe('isSupportedVersion', () => {
  it('should return true if versionA is greater than versionB', () => {
    expect(isSupportedVersion([2, 15], [2, 14])).toBe(true)
  })
  it('should return false if versionA is less than versionB', () => {
    expect(isSupportedVersion([2, 13], [2, 14])).toBe(false)
  })
  it('should return true if versionA is equal to versionB', () => {
    expect(isSupportedVersion([2, 14], [2, 14])).toBe(true)
  })
  it('should return true if versionA is not defined', () => {
    expect(isSupportedVersion([2, 16], [2, 14])).toBe(true)
  })
})
