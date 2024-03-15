import Ajv from 'ajv'
import { describe, expect, it, beforeAll } from 'vitest'
import moduleSpecsSchemaV1 from '../../module/schemas/1.json'
import moduleSpecsV1 from '../../module/definitions/1.json'
import moduleSpecsSchemaV2 from '../../module/schemas/2.json'
import moduleSpecsSchemaV3 from '../../module/schemas/3.json'
import path from 'path'
import glob from 'glob'

const ajv = new Ajv({ allErrors: true, jsonPointers: true })
const validateModuleSpecsV1 = ajv.compile(moduleSpecsSchemaV1)
const validateModuleSpecsV2 = ajv.compile(moduleSpecsSchemaV2)
const validateModuleSpecsV3 = ajv.compile(moduleSpecsSchemaV3)

const V2_DEFS_GLOB_PATTERN = '../../module/definitions/2/*.json'
const V3_DEFS_GLOB_PATTERN = '../../module/definitions/3/*.json'

const GLOB_OPTIONS = { cwd: __dirname, absolute: true }

const V2_MODULE_PATHS = glob.sync(V2_DEFS_GLOB_PATTERN, GLOB_OPTIONS)
const V3_MODULE_PATHS = glob.sync(V3_DEFS_GLOB_PATTERN, GLOB_OPTIONS)

describe('validate all module specs with schema', () => {
  beforeAll(() => {
    expect(V2_MODULE_PATHS).not.toHaveLength(0)
    expect(V3_MODULE_PATHS).not.toHaveLength(0)
  })

  it('ensure V1 module specs match the V1 JSON schema', () => {
    const valid = validateModuleSpecsV1(moduleSpecsV1)
    const validationErrors = validateModuleSpecsV1.errors

    expect(validationErrors).toBe(null)
    expect(valid).toBe(true)
  })

  V2_MODULE_PATHS.forEach(modulePath => {
    const filename = path.parse(modulePath).name
    const moduleDef = require(modulePath)

    it(`${filename} validates against schema`, () => {
      const valid = validateModuleSpecsV2(moduleDef)
      const validationErrors = validateModuleSpecsV2.errors

      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })
  })

  V3_MODULE_PATHS.forEach(modulePath => {
    const filename = path.parse(modulePath).name
    const moduleDef = require(modulePath)

    it(`validates ${filename} against schema`, () => {
      const valid = validateModuleSpecsV3(moduleDef)
      const validationErrors = validateModuleSpecsV3.errors

      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })
  })

  it('validate each module specs model matches its filename', () => {
    V2_MODULE_PATHS.forEach(modulePath => {
      const filename = path.parse(modulePath).name
      const moduleDef = require(modulePath)

      expect(moduleDef.model).toEqual(filename)
    })

    V3_MODULE_PATHS.forEach(modulePath => {
      const filename = path.parse(modulePath).name
      const moduleDef = require(modulePath)

      expect(moduleDef.model).toEqual(filename)
    })
  })
})
