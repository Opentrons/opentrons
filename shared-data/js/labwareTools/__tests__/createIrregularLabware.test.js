import omit from 'lodash/omit'
import range from 'lodash/range'

import {createIrregularLabware, _irregularWellName, _calculateWellCoord} from '../index.js'
import {splitWellsOnColumn, sortWells} from '../../helpers/index.js'

import exampleLabware1 from '../../__tests__/fixtures/irregularLabwareExample1.json'

jest.mock('../assignId', () => jest.fn(() => 'mock-id'))

describe('test createIrregularLabware function', () => {
  let labware1
  const well = [omit(exampleLabware1.wells.A1, ['x', 'y', 'z']), omit(exampleLabware1.wells.B1, ['x', 'y', 'z'])]
  const offset = [{x: 10, y: 10, z: 5}, {x: 15, y: 15, z: 5}]
  const grid = [{row: 5, column: 10}, {row: 1, column: 5}]
  const spacing = [{row: 5, column: 10}, {row: 5, column: 10}]
  const gridStart = [{rowStart: 'A', colStart: '1', rowStride: 2, colStride: 1}, {rowStart: 'B', colStart: '1', rowStride: 1, colStride: 1}]

  beforeEach(() => {
    labware1 = createIrregularLabware({
      metadata: exampleLabware1.metadata,
      parameters: exampleLabware1.parameters,
      dimensions: exampleLabware1.dimensions,
      offset,
      grid,
      spacing,
      well,
      brand: exampleLabware1.brand,
      gridStart,
    })
  })

  test('irregular ordering generates as expected', () => {
    const keyList = Object.keys(labware1.wells)
    const generatedOrdering = splitWellsOnColumn(keyList.sort(sortWells))
    expect(labware1.ordering).toEqual(generatedOrdering)
  })

  test('check labware matches schema', () => {
    expect(labware1).toEqual(exampleLabware1)
  })
  test('check labware name generates as expected', () => {
    expect(labware1.parameters.loadName).toEqual('generic_50x3_mL5x10_mL_irregular')
  })
  test('Well name generated correctly', () => {
    const grid = {row: 2, column: 2}
    const gridStart = [{rowStart: 'A', colStart: '1', rowStride: 1, colStride: 2}, {rowStart: 'B', colStart: '1', rowStride: 3, colStride: 1}]
    const expected1 = ['A1', 'B1', 'A3', 'B3']
    const expected2 = ['B1', 'E1', 'B2', 'E2']
    let idx = 0
    range(grid.column).forEach(colIdx => {
      range(grid.row).forEach(rowIdx => {
        const wellName1 = _irregularWellName(rowIdx, colIdx, gridStart[0])
        expect(expected1[idx]).toEqual(wellName1)
        const wellName2 = _irregularWellName(rowIdx, colIdx, gridStart[1])
        expect(expected2[idx]).toEqual(wellName2)
        idx += 1
      })
    })
  })

  test('XYZ generates correctly for each grid', () => {
    const grid = {row: 1, column: 5}
    const offset = {x: 1, y: 0.5, z: 55.5}
    const spacing = [{row: 10, column: 10}, {row: 5, column: 14}]
    const expectedX1 = range(offset.x,
      (grid.column * spacing[0].column) + offset.x, spacing[0].column)
    const expectedY1 = range(offset.y,
      (grid.row * spacing[0].row) + offset.y, spacing[0].row)
    const expectedX2 = range(offset.x,
      (grid.column * spacing[1].column) + offset.x, spacing[1].column)
    const expectedY2 = range(offset.y,
      (grid.row * spacing[1].row) + offset.y, spacing[1].row)

    range(grid.column).forEach(colIdx => {
      range(grid.row).forEach(rowIdx => {
          const well1 = _calculateWellCoord(rowIdx, colIdx, spacing[0], offset, well[0])
          expect(well1.x).toBeCloseTo(expectedX1[colIdx], 2)
          expect(well1.y).toBeCloseTo(expectedY1[rowIdx], 2)
          expect(well1.z).toBeCloseTo(offset.z - well[0].depth, 2)
          const well2 = _calculateWellCoord(rowIdx, colIdx, spacing[1], offset, well[1])
          expect(well2.x).toBeCloseTo(expectedX2[colIdx], 2)
          expect(well2.y).toBeCloseTo(expectedY2[rowIdx], 2)
          expect(well2.z).toBeCloseTo(offset.z - well[1].depth, 2)
      })
    })
  })
})
