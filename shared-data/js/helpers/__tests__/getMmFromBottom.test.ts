import { describe, expect, it } from 'vitest'

import {
  POSITION_REFERENCE_BOTTOM,
  POSITION_REFERENCE_CENTER,
  POSITION_REFERENCE_TOP,
} from '../..'
import { getMmFromBottom } from '../getMmFromBottom'

// Adjust the import path as needed

describe('getMmFromBottom', () => {
  it('should return null when wellDepth is null', () => {
    expect(getMmFromBottom(10, POSITION_REFERENCE_BOTTOM, null)).toBeNull()
  })

  it('should return the zValue when reference is POSITION_REFERENCE_BOTTOM', () => {
    expect(getMmFromBottom(5, POSITION_REFERENCE_BOTTOM, 20)).toBe(5)
  })

  it('should return wellDepth / 2 + zValue when reference is POSITION_REFERENCE_CENTER', () => {
    expect(getMmFromBottom(3, POSITION_REFERENCE_CENTER, 10)).toBe(8)
  })

  it('should return wellDepth + zValue when reference is POSITION_REFERENCE_TOP', () => {
    expect(getMmFromBottom(-2, POSITION_REFERENCE_TOP, 15)).toBe(13)
  })

  it('should handle negative zValue correctly', () => {
    expect(getMmFromBottom(5, POSITION_REFERENCE_BOTTOM, 10)).toBe(5)
    expect(getMmFromBottom(-5, POSITION_REFERENCE_CENTER, 10)).toBe(0)
    expect(getMmFromBottom(-5, POSITION_REFERENCE_TOP, 10)).toBe(5)
  })

  it('should handle zero zValue correctly', () => {
    expect(getMmFromBottom(0, POSITION_REFERENCE_BOTTOM, 10)).toBe(0)
    expect(getMmFromBottom(0, POSITION_REFERENCE_CENTER, 10)).toBe(5)
    expect(getMmFromBottom(0, POSITION_REFERENCE_TOP, 10)).toBe(10)
  })
})
