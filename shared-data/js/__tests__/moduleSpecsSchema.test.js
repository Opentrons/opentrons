import Ajv from 'ajv'
import moduleSpecsSchemaV1 from '../../module/schemas/1.json'
import moduleSpecsV1 from '../../module/definitions/1.json'
import moduleSpecsSchemaV2 from '../../module/schemas/2.json'
import assert from 'assert'
import path from 'path'
import glob from 'glob'

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})

const validateModuleSpecsV1 = ajv.compile(moduleSpecsSchemaV1)
const validateModuleSpecsV2 = ajv.compile(moduleSpecsSchemaV2)

const V2_DEFS_GLOB_PATTERN = '../../module/definitions/2/*.json'
const GLOB_OPTIONS = { cwd: __dirname, absolute: true }
const MODULE_PATHS = glob.sync(V2_DEFS_GLOB_PATTERN, GLOB_OPTIONS)

beforeAll(() => {
  expect(MODULE_PATHS).not.toHaveLength(0)
})

describe('validate all module specs with schema', () => {
  test('ensure V1 module specs match the V1 JSON schema', () => {
    const valid = validateModuleSpecsV1(moduleSpecsV1)
    const validationErrors = validateModuleSpecsV1.errors

    expect(validationErrors).toBe(null)
    expect(valid).toBe(true)
  })

  MODULE_PATHS.forEach(modulePath => {
    const filename = path.parse(modulePath).name
    const moduleDef = require(modulePath)
    test(`${filename} validates against schema`, () => {
      const valid = validateModuleSpecsV2(moduleDef)
      const validationErrors = validateModuleSpecsV2.errors
      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })
  })
  test('validate each module specs model matches its filename', () => {
    MODULE_PATHS.forEach(modulePath => {
      const filename = path.parse(modulePath).name
      const moduleDef = require(modulePath)
      expect(moduleDef.model).toEqual(filename)
    })
  })
})
