import Ajv from 'ajv'
import moduleSpecsSchema from '../../module/schemas/1.json'
import moduleSpecs from '../../module/definitions/1.json'

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})

const validateModuleSpecs = ajv.compile(moduleSpecsSchema)

describe('validate all module specs with schema', () => {
  test('ensure all module specs match the JSON schema', () => {
    const valid = validateModuleSpecs(moduleSpecs)
    const validationErrors = validateModuleSpecs.errors

    if (validationErrors) {
      console.log(JSON.stringify(validationErrors, null, 4))
    }
    expect(validationErrors).toBe(null)
    expect(valid).toBe(true)
  })
})
