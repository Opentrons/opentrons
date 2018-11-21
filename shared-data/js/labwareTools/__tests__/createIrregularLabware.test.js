import omit from 'lodash/omit'
import range from 'lodash/range'

import {
  createIrregularLabware,
  _irregularWellName,
  _generateIrregularLoadName,
  _calculateWellCoord,
} from '../index.js'
import {splitWellsOnColumn, sortWells} from '../../helpers/index.js'

import exampleLabware1 from '../../__tests__/fixtures/irregularLabwareExample1.json'

jest.mock('../assignId', () => jest.fn(() => 'mock-id'))

describe('test helper functions', () => {
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
    const well = [omit(exampleLabware1.wells.A1, ['x', 'y', 'z']), omit(exampleLabware1.wells.B1, ['x', 'y', 'z'])]
    const expectedX1 = [1, 11, 21, 31, 41]
    const expectedY1 = [0.5]
    const expectedX2 = [ 1, 15, 29, 43, 57 ]
    const expectedY2 = [0.5]

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

describe('test createIrregularLabware function', () => {
  let labware1

  beforeEach(() => {
    labware1 = createIrregularLabware({
      metadata: {
        displayName: 'Fake Irregular Container',
        displayCategory: 'irregular',
        displayVolumeUnits: 'mL',
        displayLengthUnits: 'mm',
        tags: [
          'fake',
          'opentrons',
        ],
      },
      parameters: {
        format: 'irregular',
        isTiprack: false,
        isMagneticModuleCompatible: false,
      },
      dimensions: {
        overallLength: 127.76,
        overallWidth: 85.48,
        overallHeight: 64.48,
      },
      well: [
        {
          depth: 10.54,
          shape: 'circular',
          diameter: 10,
          totalLiquidVolume: 3,
        },
        {
          depth: 20.54,
          shape: 'circular',
          diameter: 15,
          totalLiquidVolume: 10,
        },
      ],
      offset: [
        {x: 10, y: 10, z: 69.48},
        {x: 15, y: 15, z: 69.48},
      ],
      grid: [
        {row: 5, column: 10},
        {row: 1, column: 5},
      ],
      spacing: [
        {row: 5, column: 10},
        {row: 5, column: 10},
      ],
      gridStart: [
        {rowStart: 'A', colStart: '1', rowStride: 2, colStride: 1},
        {rowStart: 'B', colStart: '1', rowStride: 1, colStride: 1},
      ],
    })
  })

  test('irregular ordering generates as expected', () => {
    const keyList = Object.keys(labware1.wells)
    const generatedOrdering = splitWellsOnColumn(keyList.sort(sortWells))
    expect(labware1.ordering).toEqual(generatedOrdering)
  })

  test('check labware matches fixture', () => {
    expect(labware1).toEqual(exampleLabware1)
  })

  test('labware loadName generated correctly for multi-grid labware', () => {
    const loadName = _generateIrregularLoadName({
      grid: [
        {row: 3, column: 2},
        {row: 1, column: 4},
      ],
      well: [
        {
          depth: 20,
          shape: 'circular',
          totalLiquidVolume: 400,
        },
        {
          depth: 110,
          shape: 'circular',
          totalLiquidVolume: 2000,
        },
      ],
      // TODO Ian 2018-11-08: add test with mL, expect displayVol = vol/1000 (would fail right now)
      units: 'uL',
      displayCategory: 'exampleDisplayCat',
      brand: 'some brand',
    })

    expect(loadName).toEqual(
      'some_brand_6x400_uL_4x2000_uL_exampleDisplayCat')
  })
})
