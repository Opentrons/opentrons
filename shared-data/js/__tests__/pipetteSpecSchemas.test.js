import Ajv from 'ajv'
import nameSpecsSchema from '../../pipette/schemas/pipetteNameSpecsSchema.json'
import modelSpecsSchema from '../../pipette/schemas/pipetteModelSpecsSchema.json'
import pipetteNameSpecs from '../../pipette/definitions/pipetteNameSpecs.json'
import pipetteModelSpecs from '../../pipette/definitions/pipetteModelSpecs.json'

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})

const validateNameSpecs = ajv.compile(nameSpecsSchema)
const validateModelSpecs = ajv.compile(modelSpecsSchema)

describe('validate pipette specs with JSON schemas', () => {
  it('ensure all pipette *NAME* specs match name JSON schema', () => {
    const valid = validateNameSpecs(pipetteNameSpecs)
    const validationErrors = validateNameSpecs.errors

    if (validationErrors) {
      console.log(JSON.stringify(validationErrors, null, 4))
    }

    expect(validationErrors).toBe(null)
    expect(valid).toBe(true)
  })

  it('ensure all pipette *MODEL* specs match model JSON schema', () => {
    const valid = validateModelSpecs(pipetteModelSpecs)
    const validationErrors = validateModelSpecs.errors

    if (validationErrors) {
      console.log(JSON.stringify(validationErrors, null, 4))
    }

    expect(validationErrors).toBe(null)
    expect(valid).toBe(true)
  })
})

describe('model -> name referencing', () => {
  it('ensure all pipette model specs reference a valid pipette name', () => {
    const modelKeys = Object.keys(pipetteModelSpecs.config)
    const nameKeys = Object.keys(pipetteNameSpecs)

    modelKeys.forEach(model => {
      const nameForVersion = pipetteModelSpecs.config[model].name
      expect(nameKeys).toContain(nameForVersion)
    })
  })
})
