import {splitWellsOnColumn} from '../helpers'

describe('test splitWellsOnColumn', () => {
  test('empty array', () => {
    expect(splitWellsOnColumn([])).toEqual([])
  })

  test('one value', () => {
    expect(splitWellsOnColumn(['A1'])).toEqual([['A1']])
  })

  test('sort multi-digit wels', () => {
    expect(splitWellsOnColumn(['A1', 'B2', 'C2', 'D3', 'X10', 'X11'])).toEqual([['A1'], ['B2', 'C2'], ['D3'], ['X10'], ['X11']])
  })
})
