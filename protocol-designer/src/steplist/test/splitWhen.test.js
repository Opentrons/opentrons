// @flow
import {splitWhen} from '../utils'

describe('splitWhen', () => {
  test('empty array input', () => {
    [true, false].forEach(shouldSplit => {
      const result = splitWhen(
        [],
        (prev, current) => shouldSplit
      )
      expect(result).toEqual([[]])
    })
  })

  test('single array input', () => {
    [true, false].forEach(shouldSplit => {
      const result2 = splitWhen(
        [123],
        (prev, current) => shouldSplit
      )
      expect(result2).toEqual([[123]])
    })
  })

  test('always split', () => {
    const result = splitWhen(
      [1, 2, 3],
      (prev, current) => true
    )
    expect(result).toEqual([[1], [2], [3]])
  })

  test('never split', () => {
    const result = splitWhen(
      [1, 2, 3],
      (prev, current) => false
    )
    expect(result).toEqual([[1, 2, 3]])
  })

  test('predicate true on index=0 only', () => {
    const result = splitWhen(
      [1, 2, 3],
      (prev, current) => current === 1
    )
    expect(result).toEqual([
      [1, 2, 3]
    ])
  })

  test('split on index=1, conditional on index=0', () => {
    const result = splitWhen(
      [1, 2, 3],
      (prev, current) => prev === 1
    )
    expect(result).toEqual([
      [1],
      [2, 3]
    ])
  })

  test('split when "a*" before "b*"', () => {
    const result = splitWhen(
      ['a1', 'a2', 'b3', 'a4', 'b5', 'b6', 'a7', 'b8'],
      (prev: string, current: string) => prev.startsWith('a') && current.startsWith('b')
    )

    expect(result).toEqual([
      ['a1', 'a2'],
      ['b3', 'a4'],
      ['b5', 'b6', 'a7'],
      ['b8']
    ])
  })
})
