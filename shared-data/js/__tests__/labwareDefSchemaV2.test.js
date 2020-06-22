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

const expectGroupsFollowConvention = (labwareDef, filename) => {
  test(`${filename} should not contain "groups.brand.brand" that matches the top-level "brand.brand"`, () => {
    const topLevelBrand = labwareDef.brand
    labwareDef.groups.forEach(group => {
      if (group.brand) {
        expect(group.brand.brand).not.toEqual(topLevelBrand)
      }
    })
  })
  test(`${filename} should not specify certain fields in 'groups' if it is a reservoir or wellPlate`, () => {
    const { displayCategory } = labwareDef.metadata
    const noGroupsMetadataAllowed =
      displayCategory === 'reservoir' || displayCategory === 'wellPlate'

    if (noGroupsMetadataAllowed) {
      labwareDef.groups.forEach(group => {
        expect(group.brand).toBe(undefined)
        expect(group.metadata.displayName).toBe(undefined)
        expect(group.metadata.displayCategory).toBe(undefined)
      })
    }
  })
}

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

    if (labwareDef.parameters.loadName !== 'nest_96_wellplate_2ml_deep') {
      // TODO(IL, 2020-06-22): make nest_96_wellplate_2ml_deep confirm to groups convention
      expectGroupsFollowConvention(labwareDef, labwarePath)
    }
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

    expectGroupsFollowConvention(labwareDef, filename)
  })
})
