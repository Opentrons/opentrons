import Ajv from 'ajv'
import moduleSpecsSchemaV1 from '../../module/schemas/1.json'
import moduleSpecsV1 from '../../module/definitions/1.json'
import moduleSpecsSchemaV2 from '../../module/schemas/2.json'
import moduleSpecsV2 from '../../module/definitions/2.json'

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})

const validateModuleSpecsV1 = ajv.compile(moduleSpecsSchemaV1)
const validateModuleSpecsV2 = ajv.compile(moduleSpecsSchemaV2)

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
  test('ensure V2 module specs match the V2 JSON schema', () => {
    const valid = validateModuleSpecsV2(moduleSpecsV2)
    const validationErrors = validateModuleSpecsV2.errors

    if (validationErrors) {
      console.log(JSON.stringify(validationErrors, null, 4))
    }
    expect(validationErrors).toBe(null)
    expect(valid).toBe(true)
  })
})
