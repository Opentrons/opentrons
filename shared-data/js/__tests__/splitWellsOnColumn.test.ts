import { splitWellsOnColumn } from '../helpers'

describe('test splitWellsOnColumn', () => {
  it('empty array', () => {
    expect(splitWellsOnColumn([])).toEqual([])
  })

  it('one value', () => {
    expect(splitWellsOnColumn(['A1'])).toEqual([['A1']])
  })

  it('sort multi-digit wels', () => {
    expect(splitWellsOnColumn(['A1', 'B2', 'C2', 'D3', 'X10', 'X11'])).toEqual([
      ['A1'],
      ['B2', 'C2'],
      ['D3'],
      ['X10'],
      ['X11'],
    ])
  })
})
