import path from 'path'
import glob from 'glob'
import Ajv from 'ajv'
import schema from '../../labware/schemas/2.json'

const definitionsGlobPath = path.join(
  __dirname,
  '../../labware/definitions/2/**/*.json'
)

const fixturesGlobPath = path.join(__dirname, '../../labware/fixtures/2/*.json')

// JSON Schema defintion & setup

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})

const validate = ajv.compile(schema)

describe('fail on bad labware', () => {
  const badDef = {
    metadata: { name: 'bad' },
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

describe('test schemas of all opentrons definitions', () => {
  const labwarePaths = glob.sync(definitionsGlobPath)
  it(`path to definitions OK`, () => {
    // Make sure definitions path didn't break, which would give you false positives
    expect(labwarePaths.length).toBeGreaterThan(0)
  })

  labwarePaths.forEach(labwarePath => {
    const filename = path.parse(labwarePath).base
    const labwareDef = require(labwarePath)
    it(`${filename} validates against schema`, () => {
      const valid = validate(labwareDef)
      const validationErrors = validate.errors

      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })
    it(`file name matches version: ${labwarePath}`, () => {
      expect(`${labwareDef.version}`).toEqual(path.basename(filename, '.json'))
    })
    it(`parent dir matches loadName: ${labwarePath}`, () => {
      expect(labwareDef.parameters.loadName).toEqual(
        path.basename(path.dirname(labwarePath))
      )
    })
    it(`namespace is "opentrons": ${labwarePath}`, () => {
      expect(labwareDef.namespace).toEqual('opentrons')
    })
  })
})

describe('test schemas of all v2 labware fixtures', () => {
  const labwarePaths = glob.sync(fixturesGlobPath)

  it(`path to fixtures OK`, () => {
    // Make sure fixtures path didn't break, which would give you false positives
    expect(labwarePaths.length).toBeGreaterThan(0)
  })

  labwarePaths.forEach(labwarePath => {
    const filename = path.parse(labwarePath).base
    const labwareDef = require(labwarePath)
    it(`${filename} validates against schema`, () => {
      const valid = validate(labwareDef)
      const validationErrors = validate.errors

      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })
    it(`fixture file name matches loadName: ${labwarePath}`, () => {
      expect(labwareDef.parameters.loadName).toEqual(
        path.basename(filename, '.json')
      )
    })
    it(`namespace is "fixture": ${labwarePath}`, () => {
      expect(labwareDef.namespace).toEqual('fixture')
    })
  })
})
