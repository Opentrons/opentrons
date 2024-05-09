import { describe, it, expect } from 'vitest'
import { getAreFlexSlotsAdjacent } from '../getAreFlexSlotsAdjacent'

describe('getAreFlexSlotsAdjacent', () => {
  it('returns false when slots are apart', () => {
    const results = getAreFlexSlotsAdjacent('A1', 'A3')
    expect(results).toStrictEqual(false)
  })
  it('returns true when slots are left/right', () => {
    const results = getAreFlexSlotsAdjacent('A1', 'A2')
    expect(results).toStrictEqual(true)
  })
  it('returns true when slots are north/south', () => {
    const results = getAreFlexSlotsAdjacent('A1', 'B1')
    expect(results).toStrictEqual(true)
  })
  it('returns true when slots are diagonal', () => {
    const results = getAreFlexSlotsAdjacent('A1', 'B2')
    expect(results).toStrictEqual(true)
  })
})
