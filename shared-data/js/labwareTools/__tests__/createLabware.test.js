import Ajv from 'ajv'
import exampleLabware from './example.json'
import exampleLabware2 from './example2.json'
import labwareSchema from '../../../labware-json-schema/labware-schema.json'
import omit from 'lodash/omit'
import {createRegularLabware} from '../index.js'
import roundTo from 'round-to'
import assignId from '../assignId'
jest.mock('../assignId', () => {
  return jest.fn().mockImplementation(() => 1)
})

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})

const validate = ajv.compile(labwareSchema)

// Test a minimal labware definition
const well = omit(exampleLabware['wells']['A1'], ['x', 'y', 'z'])
const labware = createRegularLabware(exampleLabware['metadata'], exampleLabware['parameters'], exampleLabware['dimensions'], [1, 2], [10, 10], well, exampleLabware['vendor'])

const well2 = omit(exampleLabware2['wells']['A1'], ['x', 'y', 'z'])
const labware2 = createRegularLabware(exampleLabware2['metadata'], exampleLabware2['parameters'], exampleLabware2['dimensions'], [3, 2], [9, 9], well2)

describe('test the schema against a minimalist fixture', () => {
  test('...', () => {
    const valid = validate(exampleLabware)
    const validationErrors = validate.errors

    expect(validationErrors).toBe(null)
    expect(valid).toBe(true)
  })
})

describe('test fields generate correctly', () => {
  test('...', () => {
    expect(exampleLabware).toEqual(labware)
    expect(exampleLabware2).toEqual(labware2)
  })
  test('id is from assignId', () => {
    expect(assignId).toHaveBeenCalled()
  })
  test('ordering generates as expected', () => {
    expect(exampleLabware2.ordering).toEqual(labware2.ordering)
  })
  test('well XYZ generates correctly', () => {
    const spacing = [11.8, 12.1]
    const grid = [8, 12]
    const labware3 = createRegularLabware(
      exampleLabware2['metadata'],
      exampleLabware2['parameters'],
      exampleLabware2['dimensions'],
      grid,
      spacing,
      well2)

    var col = 0
    var row = 0
    var c
    var r
    for (c in labware3.ordering) {
      var columns = labware3.ordering[c]
      row = columns.length - 1
      for (r in columns) {
        var index = labware3.ordering[c][r]
        var well = labware3.wells[index]
        expect(well.x).toEqual(roundTo(col * spacing[1], 2))
        expect(well.y).toEqual(roundTo(row * spacing[0], 2))
        expect(well.z).toEqual(0)
        row = row - 1
      }
      col = col + 1
    }
  })
})
