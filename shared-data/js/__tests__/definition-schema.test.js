import path from 'path'
import glob from 'glob'
import Ajv from 'ajv'
import schema from '../schema'

const definitionsGlobPath = path.join(__dirname, '../../definitions/*.json')

// JSON Schema defintion & setup

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})

const validate = ajv.compile(schema)

describe('test the schema against a minimalist fixture', () => {
  test('...', () => {
    const minimalLabwareDef = {
      metadata: {
        name: 'test-labware',
        format: 'trough',
      },
      ordering: [['A1']],
      wells: {
        'A1': {
          depth: 40,
          height: 40,
          length: 70,
          'total-liquid-volume': 22000,
          width: 7,
          x: 10.84,
          y: 7.75,
          z: 0,
        },
      },
    }
    const valid = validate(minimalLabwareDef)
    const validationErrors = validate.errors

    expect(validationErrors).toBe(null)
    expect(valid).toBe(true)
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

  test('got at least 1 labware definition file', () => {
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
