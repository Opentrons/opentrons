// @flow
import { mergeWhen } from '../utils'

function concat(a: string, b: string): string {
  return a + b
}

describe('mergeWhen', () => {
  it('empty array input', () => {
    ;[true, false].forEach(shouldSplit => {
      const result = mergeWhen([], (current, next) => shouldSplit, concat)
      expect(result).toEqual([])
    })
  })

  it('single array input', () => {
    ;[true, false].forEach(shouldSplit => {
      const result2 = mergeWhen(['a'], (current, next) => shouldSplit, concat)
      expect(result2).toEqual(['a'])
    })
  })

  it('single array uses alternative when predicate is false', () => {
    const result = mergeWhen(
      ['a'],
      (current, next) => false,
      (current, next) => null,
      current => current.toUpperCase()
    )
    expect(result).toEqual(['A'])
  })

  it('always merge', () => {
    const result = mergeWhen(['1', '2', '3'], (current, next) => true, concat)
    expect(result).toEqual(['12', '3'])
  })

  it('never split', () => {
    const result = mergeWhen(['1', '2', '3'], (current, next) => false, concat)
    expect(result).toEqual(['1', '2', '3'])
  })

  it('predicate true on index=0 only', () => {
    const result = mergeWhen(
      ['1', '2', '3'],
      (current, next) => current === 1,
      concat
    )
    expect(result).toEqual(['1', '2', '3'])
  })

  it('merge at end', () => {
    const result = mergeWhen(
      ['1', '2', '3'],
      (current, next) => current === '3',
      concat
    )
    expect(result).toEqual(['1', '2', '3'])
  })

  it('merge when "a*" before "b*"', () => {
    const result = mergeWhen(
      ['a1', 'a2', 'b3', 'a4', 'b5', 'b6', 'a7', 'b8'],
      (prev: string, current: string) =>
        prev.startsWith('a') && current.startsWith('b'),
      concat
    )

    expect(result).toEqual(['a1', 'a2b3', 'a4b5', 'b6', 'a7b8'])
  })
})
