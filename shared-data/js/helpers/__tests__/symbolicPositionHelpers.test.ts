import { beforeEach, describe, expect, it } from 'vitest'

import { STANDARD_FLEX_SLOTS, STANDARD_OT2_SLOTS } from '../../fixtures'
import { getIsValidSlotName } from '../symbolicPositionHelpers'

describe('getIsSlotValid', () => {
  beforeEach(() => {})

  it('returns true for a valid slot', () => {
    STANDARD_FLEX_SLOTS.forEach(slot => {
      expect(getIsValidSlotName(slot)).toBe(true)
    })
    STANDARD_OT2_SLOTS.forEach(slot => {
      expect(getIsValidSlotName(slot)).toBe(true)
    })
  })
  it('returns false for an invalid slot', () => {
    expect(getIsValidSlotName('13')).toBe(false)
  })
  it('returns false for an invalid slot', () => {
    expect(getIsValidSlotName('A5')).toBe(false)
  })
})
