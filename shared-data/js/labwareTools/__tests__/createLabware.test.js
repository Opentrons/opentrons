import omit from 'lodash/omit'
import range from 'lodash/range'

import {createRegularLabware} from '../index.js'

import exampleLabware1 from '../../__tests__/fixtures/labwareExample.json'
import exampleLabware2 from '../../__tests__/fixtures/labwareExample2.json'

jest.mock('../assignId', () => jest.fn(() => 'mock-id'))

describe('createLabware', () => {
  let labware1
  let labware2
  let well1
  let well2

  beforeEach(() => {
    well1 = omit(exampleLabware1.wells.A1, ['x', 'y', 'z'])
    well2 = omit(exampleLabware2.wells.A1, ['x', 'y', 'z'])
    const offset1 = {x: 10, y: 10, z: 5}
    const offset2 = {x: 10, y: 10, z: 0}
    labware1 = createRegularLabware({
      metadata: exampleLabware1.metadata,
      parameters: exampleLabware1.parameters,
      dimensions: exampleLabware1.dimensions,
      offset: offset1,
      grid: {row: 1, column: 2},
      spacing: {row: 10, column: 10},
      well: well1,
      brand: exampleLabware1.brand,
    })

    labware2 = createRegularLabware({
      metadata: exampleLabware2.metadata,
      parameters: exampleLabware2.parameters,
      dimensions: exampleLabware2.dimensions,
      offset: offset2,
      grid: {row: 3, column: 2},
      spacing: {row: 9, column: 9},
      well: well2,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('snapshot tests', () => {
    expect(labware1).toEqual(exampleLabware1)
    expect(labware2).toEqual(exampleLabware2)
  })

  test('id is from assignId', () => {
    expect(labware1.otId).toBe('mock-id')
    expect(labware2.otId).toBe('mock-id')
  })

  test('ordering generates as expected', () => {
    expect(exampleLabware2.ordering).toEqual(labware2.ordering)
  })

  test('well XYZ generates correctly', () => {
    const spacing = {row: 11.8, column: 12.1}
    const grid = {row: 8, column: 12}
    const offset = {x: 10, y: 10, z: 5}
    const labware3 = createRegularLabware({
      metadata: exampleLabware2.metadata,
      parameters: exampleLabware2.parameters,
      dimensions: exampleLabware2.dimensions,
      offset,
      grid,
      spacing,
      well: well2,
    })

    const expectedXByCol = range(offset.x, (grid.column * spacing.column) + offset.x, spacing.column)
    const expectedYByRow = range(offset.y, (grid.row * spacing.row) + offset.y, spacing.row).reverse()
    labware3.ordering.forEach((column, cIndex) => {
      column.forEach((wellName, rIndex) => {
        const well = labware3.wells[wellName]
        expect(well.x).toBeCloseTo(expectedXByCol[cIndex], 2)
        expect(well.y).toBeCloseTo(expectedYByRow[rIndex], 2)
        expect(well.z).toBeCloseTo(exampleLabware2.dimensions.overallHeight + offset.z - well.depth, 2)
      })
    })
  })
})
