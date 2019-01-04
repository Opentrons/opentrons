// @flow
import {getIdsInRange} from '../utils'

describe('getIdsInRange', () => {
  test('gets id in array of length 1', () => {
    expect(getIdsInRange(['X'], 'X', 'X')).toEqual(['X'])
  })
  test('gets ids in array of length > 1', () => {
    const orderedIds = ['T', 'E', 'S', 'TTT', 'C', 'A', 'SSS', 'EEE']
    // includes first element
    expect(getIdsInRange(orderedIds, 'T', 'C')).toEqual(['T', 'E', 'S', 'TTT', 'C'])
    // middle
    expect(getIdsInRange(orderedIds, 'S', 'A')).toEqual(['S', 'TTT', 'C', 'A'])
    // includes last element
    expect(getIdsInRange(orderedIds, 'S', 'EEE')).toEqual(['S', 'TTT', 'C', 'A', 'SSS', 'EEE'])
    // startId same as endId
    expect(getIdsInRange(orderedIds, 'T', 'T')).toEqual(['T'])
  })
})
