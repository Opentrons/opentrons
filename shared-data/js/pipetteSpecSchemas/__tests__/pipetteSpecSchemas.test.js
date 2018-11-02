import Ajv from 'ajv'
import modelSpecsSchema from '../pipetteModelSpecsSchema.json'
import versionSpecsSchema from '../pipetteVersionSpecsSchema.json'
import pipetteModelSpecs from '../../../robot-data/pipetteModelSpecs.json'
import pipetteVersionSpecs from '../../../robot-data/pipetteVersionSpecs.json'

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})

const validateModelSpecs = ajv.compile(modelSpecsSchema)
const validateVersionSpecs = ajv.compile(versionSpecsSchema)

describe('validate pipette specs with JSON schemas', () => {
  test('ensure all pipette *MODEL* specs match model JSON schema', () => {
    const valid = validateModelSpecs(pipetteModelSpecs)
    const validationErrors = validateModelSpecs.errors

    if (validationErrors) {
      console.log(JSON.stringify(validationErrors, null, 4))
    }

    expect(validationErrors).toBe(null)
    expect(valid).toBe(true)
  })

  test('ensure all pipette *VERSION* specs match version JSON schema', () => {
    const valid = validateVersionSpecs(pipetteVersionSpecs)
    const validationErrors = validateVersionSpecs.errors

    if (validationErrors) {
      console.log(JSON.stringify(validationErrors, null, 4))
    }

    expect(validationErrors).toBe(null)
    expect(valid).toBe(true)
  })
})

describe('version -> model referencing', () => {
  test('ensure all pipette version specs reference a valid pipette model', () => {
    const versionKeys = Object.keys(pipetteVersionSpecs)
    const modelKeys = Object.keys(pipetteModelSpecs)

    versionKeys.forEach(version => {
      const modelForVersion = pipetteVersionSpecs[version].model
      expect(modelKeys).toContain(modelForVersion)
    })
  })
})
