import { describe, expect, it } from 'vitest'

import { getOt2SurroundingSlots } from '../getOt2SurroundingSlots'

import type { OT2AddressableAreaName } from '../../../deck'

describe('getOt2SurroundingSlots', () => {
  it('returns the correct adjacent slots for a center slot (slot 5)', () => {
    const result = getOt2SurroundingSlots('5')
    expect(result).toEqual(['1', '2', '3', '4', '6', '7', '8', '9'])
  })

  it('returns correct adjacent slots for a corner slot (slot 1)', () => {
    const result = getOt2SurroundingSlots('1')
    expect(result).toEqual(['2', '4', '5'])
  })

  it('returns correct adjacent slots for an edge slot (slot 2)', () => {
    const result = getOt2SurroundingSlots('2')
    expect(result).toEqual(['1', '3', '4', '5', '6'])
  })

  it('returns empty array for slot not on the OT-2 deck', () => {
    const result = getOt2SurroundingSlots('99' as OT2AddressableAreaName)
    expect(result).toEqual([])
  })

  it('returns correct adjacent slots for slot in right-most column (slot 3)', () => {
    const result = getOt2SurroundingSlots('3')
    expect(result).toEqual(['2', '5', '6'])
  })

  it('returns correct adjacent slots for slot 11', () => {
    const result = getOt2SurroundingSlots('11')
    expect(result).toEqual(['7', '8', '9', '10'])
  })
})
