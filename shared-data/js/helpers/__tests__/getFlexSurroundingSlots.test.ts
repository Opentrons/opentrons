import { describe, it, expect } from 'vitest'
import { getFlexSurroundingSlots } from '../getFlexSurroundingSlots'

describe('getFlexSurroundingSlots', () => {
  it('returns slots when slot is D2', () => {
    const results = getFlexSurroundingSlots('D2', [])
    expect(results).toStrictEqual(['C1', 'C2', 'C3', 'D1', 'D3'])
  })
  it('returns slots when selected is a center slot', () => {
    const results = getFlexSurroundingSlots('C2', [])
    expect(results).toStrictEqual([
      'B1',
      'B2',
      'B3',
      'C1',
      'C3',
      'D1',
      'D2',
      'D3',
    ])
  })
  it('returns slots when selected is a column 3 with staging areas present', () => {
    const results = getFlexSurroundingSlots('B3', ['A4'])
    expect(results).toStrictEqual(['A2', 'A3', 'A4', 'B2', 'C2', 'C3'])
  })
  it('returns slots when selected is a corner, A1', () => {
    const results = getFlexSurroundingSlots('A1', ['A4'])
    expect(results).toStrictEqual(['A2', 'B1', 'B2'])
  })
})
