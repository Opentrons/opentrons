// @flow
import { orderWells } from '../utils'

describe('orderWells', () => {
  const orderTuples = [
    ['t2b', 'l2r'],
    ['t2b', 'r2l'],
    ['b2t', 'l2r'],
    ['b2t', 'r2l'],
    ['l2r', 't2b'],
    ['l2r', 'b2t'],
    ['r2l', 't2b'],
    ['r2l', 'b2t'],
  ]

  describe('regular labware', () => {
    const regularOrdering = [['A1', 'B1'], ['A2', 'B2']]
    const regularAnswerMap = {
      t2b: {
        l2r: ['A1', 'B1', 'A2', 'B2'],
        r2l: ['A2', 'B2', 'A1', 'B1'],
      },
      b2t: {
        l2r: ['B1', 'A1', 'B2', 'A2'],
        r2l: ['B2', 'A2', 'B1', 'A1'],
      },
      l2r: {
        t2b: ['A1', 'A2', 'B1', 'B2'],
        b2t: ['B1', 'B2', 'A1', 'A2'],
      },
      r2l: {
        t2b: ['A2', 'A1', 'B2', 'B1'],
        b2t: ['B2', 'B1', 'A2', 'A1'],
      },
    }
    orderTuples.forEach(tuple => {
      it(`first ${tuple[0]} then ${tuple[1]}`, () => {
        expect(orderWells(regularOrdering, ...tuple)).toEqual(
          regularAnswerMap[tuple[0]][tuple[1]]
        )
      })
    })
  })

  describe('irregular labware', () => {
    const irregularOrdering = [
      ['A1', 'B1'],
      ['A2', 'B2', 'C2'],
      ['A3'],
      ['A4', 'B4', 'C4', 'D4'],
    ]
    const irregularAnswerMap = {
      t2b: {
        l2r: ['A1', 'B1', 'A2', 'B2', 'C2', 'A3', 'A4', 'B4', 'C4', 'D4'],
        r2l: ['A4', 'B4', 'C4', 'D4', 'A3', 'A2', 'B2', 'C2', 'A1', 'B1'],
      },
      b2t: {
        l2r: ['B1', 'A1', 'C2', 'B2', 'A2', 'A3', 'D4', 'C4', 'B4', 'A4'],
        r2l: ['D4', 'C4', 'B4', 'A4', 'A3', 'C2', 'B2', 'A2', 'B1', 'A1'],
      },
      l2r: {
        t2b: ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B4', 'C2', 'C4', 'D4'],
        b2t: ['D4', 'C2', 'C4', 'B1', 'B2', 'B4', 'A1', 'A2', 'A3', 'A4'],
      },
      r2l: {
        t2b: ['A4', 'A3', 'A2', 'A1', 'B4', 'B2', 'B1', 'C4', 'C2', 'D4'],
        b2t: ['D4', 'C4', 'C2', 'B4', 'B2', 'B1', 'A4', 'A3', 'A2', 'A1'],
      },
    }

    orderTuples.forEach(tuple => {
      it(`first ${tuple[0]} then ${tuple[1]}`, () => {
        expect(orderWells(irregularOrdering, ...tuple)).toEqual(
          irregularAnswerMap[tuple[0]][tuple[1]]
        )
      })
    })
  })
})
