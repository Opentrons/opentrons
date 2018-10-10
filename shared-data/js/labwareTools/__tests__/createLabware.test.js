import Ajv from 'ajv'
import omit from 'lodash/omit'
import range from 'lodash/range'

import labwareSchema from '../../../labware-json-schema/labware-schema.json'
import {createRegularLabware} from '../index.js'

import exampleLabware1 from './example.json'
import exampleLabware2 from './example2.json'

jest.mock('../assignId', () => jest.fn(() => 'mock-id'))

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})

const validate = ajv.compile(labwareSchema)

describe('createLabware', () => {
  let labware1
  let labware2
  let well1
  let well2

  beforeEach(() => {
    well1 = omit(exampleLabware1.wells.A1, ['x', 'y', 'z'])
    well2 = omit(exampleLabware2.wells.A1, ['x', 'y', 'z'])

    labware1 = createRegularLabware({
      metadata: exampleLabware1.metadata,
      parameters: exampleLabware1.parameters,
      dimensions: exampleLabware1.dimensions,
      offset: exampleLabware2.cornerOffsetFromSlot,
      grid: {row: 1, column: 2},
      spacing: {row: 10, column: 10},
      well: well1,
      brand: exampleLabware1.brand,
    })

    labware2 = createRegularLabware({
      metadata: exampleLabware2.metadata,
      parameters: exampleLabware2.parameters,
      dimensions: exampleLabware2.dimensions,
      offset: exampleLabware2.cornerOffsetFromSlot,
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

  test('generated labware passes schema', () => {
    const valid = validate(exampleLabware1)
    const validationErrors = validate.errors

    expect(validationErrors).toBe(null)
    expect(valid).toBe(true)
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

    const labware3 = createRegularLabware({
      metadata: exampleLabware2.metadata,
      parameters: exampleLabware2.parameters,
      dimensions: exampleLabware2.dimensions,
      offset: exampleLabware2.cornerOffsetFromSlot,
      grid,
      spacing,
      well: well2,
    })

    const expectedXByCol = range(0, grid.column * spacing.column, spacing.column)
    const expectedYByRow = range(0, grid.row * spacing.row, spacing.row).reverse()

    labware3.ordering.forEach((column, cIndex) => {
      column.forEach((wellName, rIndex) => {
        const well = labware3.wells[wellName]
        expect(well.x).toBeCloseTo(expectedXByCol[cIndex], 2)
        expect(well.y).toBeCloseTo(expectedYByRow[rIndex], 2)
        expect(well.z).toBeCloseTo(0, 2)
      })
    })
  })
})
