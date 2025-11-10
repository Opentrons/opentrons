import { beforeEach, describe, expect, it } from 'vitest'

import { STANDARD_FLEX_SLOTS, STANDARD_OT2_SLOTS } from '../../fixtures'
import { getIsSlotValid } from '../symbolicPositionHelpers'

describe('getIsSlotValid', () => {
  beforeEach(() => {})

  it('returns true for a valid slot', () => {
    STANDARD_FLEX_SLOTS.forEach(slot => {
      expect(getIsSlotValid(slot)).toBe(true)
    })
    STANDARD_OT2_SLOTS.forEach(slot => {
      expect(getIsSlotValid(slot)).toBe(true)
    })
  })
  it('returns false for an invalid slot', () => {
    expect(getIsSlotValid('13')).toBe(false)
  })
  it('returns false for an invalid slot', () => {
    expect(getIsSlotValid('A5')).toBe(false)
  })
})
