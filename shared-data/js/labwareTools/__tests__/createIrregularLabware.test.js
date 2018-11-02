import omit from 'lodash/omit'
import range from 'lodash/range'

import {createIrregularLabware} from '../index.js'
import {toWellName, splitWellsOnColumn, sortWells} from '../../helpers/index.js'

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
  test('Well name generated correctly', () => {
    const grid = {row: 2, column: 2}
    const gridStart1 = {rowStart: 'A', colStart: '1', rowStride: 1, colStride: 2}
    const gridStart2 = {rowStart: 'B', colStart: '1', rowStride: 3, colStride: 1}
    const expected1 = ['A1', 'B1', 'A3', 'B3']
    const expected2 = ['B1', 'E1', 'B2', 'E2']
    let wellList1 = []
    let wellList2 = []
    range(grid.column).map(colIdx => {
      range(grid.row).map(rowIdx => {
        const rowNum = rowIdx * gridStart1.rowStride + gridStart1.rowStart.charCodeAt(0) - 65
        const colNum = colIdx * gridStart1.colStride + parseInt(gridStart1.colStart) - 1
        wellList1.push(toWellName({rowNum, colNum}))
        const rowNum2 = rowIdx * gridStart2.rowStride + gridStart2.rowStart.charCodeAt(0) - 65
        const colNum2 = colIdx * gridStart2.colStride + parseInt(gridStart2.colStart) - 1
        wellList2.push(toWellName({rowNum: rowNum2, colNum: colNum2}))
      })
    })
    expect(wellList1).toEqual(expected1)
    expect(wellList2).toEqual(expected2)
  })
  test('XYZ generates correctly for each grid', () => {
    let expectedXByCol = []
    let expectedYByRow = []
    offset.forEach((offsetObj, offsetIdx) => {
      expectedXByCol.push(range(offsetObj.x, (grid[offsetIdx].column * spacing[offsetIdx].column) + offsetObj.x, spacing[offsetIdx].column))
      expectedYByRow.push(range(offsetObj.y, (grid[offsetIdx].row * spacing[offsetIdx].row) + offsetObj.y, spacing[offsetIdx].row))
    })
    grid.forEach((gridObj, gridIdx) => {
      range(gridObj.column).map(colIdx => {
        range(gridObj.row).map(rowIdx => {
          const rowNum = rowIdx * gridStart[gridIdx].rowStride + gridStart[gridIdx].rowStart.charCodeAt(0) - 65
          const colNum = colIdx * gridStart[gridIdx].colStride + parseInt(gridStart[gridIdx].colStart) - 1
          const wellName = toWellName({rowNum, colNum})
          const wellData = labware1.wells[wellName]
          expect(wellData.x).toBeCloseTo(expectedXByCol[gridIdx][colIdx], 2)
          expect(wellData.y).toBeCloseTo(expectedYByRow[gridIdx][rowIdx], 2)
          expect(wellData.z).toBeCloseTo(exampleLabware1.dimensions.overallHeight + offset[gridIdx].z - well[gridIdx].depth, 2)
        })
      })
    })
  })
})
