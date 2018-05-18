// @flow
import {mergeWhen} from '../utils'

function concat (a: string, b: string): string {
  return a + b
}

describe('mergeWhen', () => {
  test('empty array input', () => {
    [true, false].forEach(shouldSplit => {
      const result = mergeWhen(
        [],
        (current, next) => shouldSplit,
        concat
      )
      expect(result).toEqual([])
    })
  })

  test('single array input', () => {
    [true, false].forEach(shouldSplit => {
      const result2 = mergeWhen(
        ['a'],
        (current, next) => shouldSplit,
        concat
      )
      expect(result2).toEqual(['a'])
    })
  })

  test('always merge', () => {
    const result = mergeWhen(
      ['1', '2', '3'],
      (current, next) => true,
      concat
    )
    expect(result).toEqual(['12', '3'])
  })

  test('never split', () => {
    const result = mergeWhen(
      ['1', '2', '3'],
      (current, next) => false,
      concat
    )
    expect(result).toEqual(['1', '2', '3'])
  })

  test('predicate true on index=0 only', () => {
    const result = mergeWhen(
      ['1', '2', '3'],
      (current, next) => current === 1,
      concat
    )
    expect(result).toEqual(['1', '2', '3'])
  })

  test('merge at end', () => {
    const result = mergeWhen(
      ['1', '2', '3'],
      (current, next) => current === '3',
      concat
    )
    expect(result).toEqual(['1', '2', '3'])
  })

  test('merge when "a*" before "b*"', () => {
    const result = mergeWhen(
      ['a1', 'a2', 'b3', 'a4', 'b5', 'b6', 'a7', 'b8'],
      (prev: string, current: string) => prev.startsWith('a') && current.startsWith('b'),
      concat
    )

    expect(result).toEqual(['a1', 'a2b3', 'a4b5', 'b6', 'a7b8'])
  })
})
