import Ajv from 'ajv'
import moduleSpecsSchemaV1 from '../../module/schemas/1.json'
import moduleSpecsV1 from '../../module/definitions/1.json'
import moduleSpecsSchemaV2 from '../../module/schemas/2.json'
import path from 'path'
import glob from 'glob'

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})

const validateModuleSpecsV1 = ajv.compile(moduleSpecsSchemaV1)
const validateModuleSpecsV2 = ajv.compile(moduleSpecsSchemaV2)

const v2DefinitionsGlobPath = path.join(
  __dirname,
  '../../module/definitions/2/*.json'
)

describe('validate all module specs with schema', () => {
  test('ensure V1 module specs match the V1 JSON schema', () => {
    const valid = validateModuleSpecsV1(moduleSpecsV1)
    const validationErrors = validateModuleSpecsV1.errors

    if (validationErrors) {
      console.log(JSON.stringify(validationErrors, null, 4))
    }
    expect(validationErrors).toBe(null)
    expect(valid).toBe(true)
  })
  const modulePaths = glob.sync(v2DefinitionsGlobPath)
  test('got at least 1 v2 module def (avoid false positive for tests)', () => {
    expect(modulePaths.length).toBeGreaterThan(0)
  })
  modulePaths.forEach(modulePath => {
    const filename = path.parse(modulePath).name
    const moduleDef = require(modulePath)
    test(`${filename} validates against schema`, () => {
      const valid = validateModuleSpecsV2(moduleDef)
      const validationErrors = validateModuleSpecsV2.errors
      if (validationErrors) {
        console.log(JSON.stringify(validationErrors, null, 4))
      }
      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })
  })
  test('validate each module specs model matches its filename', () => {
    modulePaths.forEach(modulePath => {
      console.log(`full path is ${modulePath}`)
      const filename = path.parse(modulePath).name
      const moduleDef = require(modulePath)
      expect(moduleDef.model).toEqual(filename)
    })
  })
})
