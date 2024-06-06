// Tests for error data validation
import { describe, expect, it } from 'vitest'

import Ajv from 'ajv'

import errorDefinitions from '../../errors/definitions/1/errors.json'
import errorSchema from '../../errors/schemas/1.json'

describe('error data should match error schema', () => {
  it('error schema should match', () => {
    const ajv = new Ajv({ allErrors: true })
    const validator = ajv.compile(errorSchema)
    const valid = validator(errorDefinitions)
    const validationFailures = validator.errors
    if (validationFailures) {
      console.log(
        'errors.json does not follow its schema',
        JSON.stringify(validationFailures, null, 4)
      )
    }
    expect(valid).toBe(true)
    expect(validationFailures).toBeNull()
  })
})

describe('error code unschemad requirements should match', () =>
  Object.entries(errorDefinitions.codes).forEach(
    ([errorCode, { category: errorCategory }]) => {
      it(`error code ${errorCode} category is correct`, () => {
        const categoryObj = errorDefinitions.categories[errorCategory] ?? null
        expect(categoryObj).not.toBeNull()
        expect(errorCode).toMatch(new RegExp(`^${categoryObj.codePrefix}.*$`))
      })
    }
  ))
