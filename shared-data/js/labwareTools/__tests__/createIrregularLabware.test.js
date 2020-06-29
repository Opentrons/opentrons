import omit from 'lodash/omit'
import range from 'lodash/range'

import fixture_irregular_example_1 from '../../../labware/fixtures/2/fixture_irregular_example_1.json'
import { sortWells, splitWellsOnColumn } from '../../helpers/index.js'
import {
  _calculateWellCoord,
  _generateIrregularLoadName,
  _irregularWellName,
  createIrregularLabware,
} from '../index.js'

// NOTE: loadName needs to be replaced here b/c fixture has a non-default loadName
const exampleLabware1 = {
  ...fixture_irregular_example_1,
  parameters: {
    ...fixture_irregular_example_1.parameters,
    loadName: 'generic_55_tuberack_50x3ml_5x10ml',
  },
}

describe('test helper functions', () => {
  it('Well name generated correctly', () => {
    const grid = { row: 2, column: 2 }
    const gridStart = [
      { rowStart: 'A', colStart: '1', rowStride: 1, colStride: 2 },
      { rowStart: 'B', colStart: '1', rowStride: 3, colStride: 1 },
    ]
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

  it('XYZ generates correctly for each grid', () => {
    const grid = { row: 1, column: 5 }
    const offset = { x: 1, y: 0.5, z: 55.5 }
    const spacing = [{ row: 10, column: 10 }, { row: 5, column: 14 }]
    const well = [
      omit(exampleLabware1.wells.A1, ['x', 'y', 'z']),
      omit(exampleLabware1.wells.B1, ['x', 'y', 'z']),
    ]
    const expectedX1 = [1, 11, 21, 31, 41]
    const expectedY1 = [0.5]
    const expectedX2 = [1, 15, 29, 43, 57]
    const expectedY2 = [0.5]

    range(grid.column).forEach(colIdx => {
      range(grid.row).forEach(rowIdx => {
        const well1 = _calculateWellCoord(
          rowIdx,
          colIdx,
          spacing[0],
          offset,
          well[0]
        )
        expect(well1.x).toBeCloseTo(expectedX1[colIdx], 2)
        expect(well1.y).toBeCloseTo(expectedY1[rowIdx], 2)
        expect(well1.z).toBeCloseTo(offset.z - well[0].depth, 2)

        const well2 = _calculateWellCoord(
          rowIdx,
          colIdx,
          spacing[1],
          offset,
          well[1]
        )
        expect(well2.x).toBeCloseTo(expectedX2[colIdx], 2)
        expect(well2.y).toBeCloseTo(expectedY2[rowIdx], 2)
        expect(well2.z).toBeCloseTo(offset.z - well[1].depth, 2)
      })
    })
  })
})

describe('test createIrregularLabware function', () => {
  let labware1
  let labware1Args
  beforeEach(() => {
    labware1Args = {
      namespace: 'fixture',
      metadata: {
        displayName: 'Fake Irregular Container',
        displayCategory: 'tubeRack',
        displayVolumeUnits: 'mL',
        tags: ['fake', 'opentrons'],
      },
      parameters: {
        format: 'irregular',
        isTiprack: false,
        isMagneticModuleCompatible: false,
      },
      dimensions: {
        xDimension: 127.76,
        yDimension: 85.48,
        zDimension: 64.48,
      },
      well: [
        {
          depth: 10.54,
          shape: 'circular',
          diameter: 10,
          totalLiquidVolume: 3000,
        },
        {
          depth: 20.54,
          shape: 'circular',
          diameter: 15,
          totalLiquidVolume: 10000,
        },
      ],
      offset: [{ x: 10, y: 10, z: 69.48 }, { x: 15, y: 15, z: 69.48 }],
      grid: [{ row: 5, column: 10 }, { row: 1, column: 5 }],
      spacing: [{ row: 5, column: 10 }, { row: 5, column: 10 }],
      gridStart: [
        { rowStart: 'A', colStart: '1', rowStride: 2, colStride: 1 },
        { rowStart: 'B', colStart: '1', rowStride: 1, colStride: 1 },
      ],
    }
    labware1 = createIrregularLabware(labware1Args)
  })

  it('irregular ordering generates as expected', () => {
    const keyList = Object.keys(labware1.wells)
    const generatedOrdering = splitWellsOnColumn(keyList.sort(sortWells))
    expect(labware1.ordering).toEqual(generatedOrdering)
  })

  it('check labware matches fixture', () => {
    expect(labware1).toEqual(exampleLabware1)
  })

  it('labware loadName generated correctly for multi-grid labware', () => {
    const loadName = _generateIrregularLoadName({
      grid: [{ row: 3, column: 2 }, { row: 1, column: 4 }],
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
      totalWellCount: 10,
      units: 'µL',
      displayCategory: 'wellPlate',
      brand: 'some brand',
    })

    expect(loadName).toEqual('somebrand_10_wellplate_6x400ul_4x2000ul')
  })

  it('labware loadName generated correctly for multi-grid labware in other units', () => {
    const loadName = _generateIrregularLoadName({
      grid: [{ row: 3, column: 2 }],
      well: [{ depth: 20, shape: 'circular', totalLiquidVolume: 4000 }],
      totalWellCount: 6,
      units: 'mL',
      displayCategory: 'wellPlate',
      brand: 'some brand',
    })

    expect(loadName).toEqual('somebrand_6_wellplate_6x4ml')
  })

  it('failing to validate against labware schema throws w/o "strict"', () => {
    const args = {
      ...labware1Args,
      // negative y offset should fail schema validation by making well `y` negative
      offset: [{ x: 10, y: -9999, z: 69.48 }, { x: 15, y: -9999, z: 69.48 }],
    }

    expect(() => createIrregularLabware(args)).toThrowErrorMatchingSnapshot()
    expect(() =>
      createIrregularLabware({ ...args, strict: false })
    ).not.toThrow()
  })
})
