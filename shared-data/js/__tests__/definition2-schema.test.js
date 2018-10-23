import path from 'path'
import glob from 'glob'
import Ajv from 'ajv'
import schema from '../../labware-json-schema/labware-schema.json'
import exampleLabware1 from './fixtures/labwareExample.json'
import exampleLabware2 from './fixtures/labwareExample2.json'

const definitionsGlobPath = path.join(__dirname, '../../definitions2/*.json')

// JSON Schema defintion & setup

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})

const validate = ajv.compile(schema)

describe('test the schema against a minimalist fixture', () => {
  test('validate example definitions with schema', () => {
    const valid1 = validate(exampleLabware1)
    const validationErrors1 = validate.errors
    expect(validationErrors1).toBe(null)
    expect(valid1).toBe(true)
    const valid2 = validate(exampleLabware2)
    const validationErrors2 = validate.errors
    expect(validationErrors2).toBe(null)
    expect(valid2).toBe(true)
  })

  test('fail on bad labware', () => {
    const badDef = {
      metadata: {name: 'bad'},
      ordering: ['A1'], // array of strings not array of arrays
      wells: {},
    }
    const valid = validate(badDef)
    const validationErrors = validate.errors

    expect(
      validationErrors.find(err => err.dataPath === '/ordering/0')
    ).toMatchObject({
      message: 'should be array',
    })
    expect(valid).toBe(false)
  })
})

describe('test schemas of all definitions', () => {
  const labwarePaths = glob.sync(definitionsGlobPath)
  beforeAll(() => {
    // Make sure definitions path didn't break, which would give you false positives
    expect(labwarePaths.length).toBeGreaterThan(0)
  })

  labwarePaths.forEach(labwarePath => {
    test(path.parse(labwarePath).name, () => {
      const labware = require(labwarePath)
      const valid = validate(labware)
      const validationErrors = validate.errors

      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })
  })
})
