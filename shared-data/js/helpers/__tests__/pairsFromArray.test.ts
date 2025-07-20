import { expect, it } from 'vitest'

import { pairsFromArray } from '../pairsFromArray'

it('should return all consecutive pairs from the input array', () => {
  expect(pairsFromArray(['a', 'b'])).toStrictEqual([['a', 'b']])
  expect(pairsFromArray(['a', 'b', 'c'])).toStrictEqual([
    ['a', 'b'],
    ['b', 'c'],
  ])
  expect(pairsFromArray(['a', 'b', 'c', 'd'])).toStrictEqual([
    ['a', 'b'],
    ['b', 'c'],
    ['c', 'd'],
  ])
})

it('should return [] if the input array has fewer than 2 elements', () => {
  expect(pairsFromArray([])).toStrictEqual([])
  expect(pairsFromArray(['a'])).toStrictEqual([])
})
