// @flow
import { removePairs } from '../utils/removePairs'

const twoThenThree = (a, b) => {
  if (a === undefined) {
    throw new Error('a is undefined')
  }
  if (b === undefined) {
    throw new Error('b is undefined')
  }
  return a === 2 && b === 3
}

describe('removePairs', () => {
  it('should work with empty array', () => {
    expect(removePairs([], () => true)).toEqual([])
    expect(removePairs([], () => false)).toEqual([])
  })

  const cases = [
    { input: [2], expected: [2] },
    { input: [2, 3], expected: [] },
    { input: [2, 3, 2, 3], expected: [] },
    { input: [2, 3, 2, 3, 2, 3], expected: [] },
    { input: [1, 2, 3], expected: [1] },
    { input: [2, 3, 4], expected: [4] },
    { input: [1, 2, 3, 4], expected: [1, 4] },
    { input: [1, 2, 3, 4, 2, 3], expected: [1, 4] },
    { input: [2, 3, 1, 2, 3, 4], expected: [1, 4] },
    { input: [2, 2, 2, 2], expected: [2, 2, 2, 2] },
  ]
  cases.forEach(({ input, expected }) =>
    it(`should do ${JSON.stringify(input)} => ${JSON.stringify(
      expected
    )}`, () => {
      const result = removePairs(input, twoThenThree)
      expect(result).toEqual(expected)
    })
  )
})
