// @flow
import { sortWells } from '../helpers'

describe('sortWells', () => {
  it('single letters', () => {
    const input = ['A12', 'A2', 'B1', 'B12', 'A1']
    const expected = ['A1', 'B1', 'A2', 'A12', 'B12']
    const result = [...input].sort(sortWells)
    expect(result).toEqual(expected)
  })

  // just in case we get a 1536-well plate
  it('double letters', () => {
    const input = [
      'AB12',
      'A12',
      'B12',
      'Z12',
      'AA12',
      'AB1',
      'Z1',
      'A1',
      'B1',
      'AA1',
    ]
    const expected = [
      'A1',
      'B1',
      'Z1',
      'AA1',
      'AB1',
      'A12',
      'B12',
      'Z12',
      'AA12',
      'AB12',
    ]
    const result = [...input].sort(sortWells)
    expect(result).toEqual(expected)
  })
})
