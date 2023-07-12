// tests for error accessors

import { getError } from '../errors'

import errorDefinitions from '@opentrons/shared-data/errors/definitions/1/errors.json'

Object.keys(errorDefinitions.codes).forEach(errorCode =>
  describe(`error ${errorCode} accessors`, () => {
    it('should be accessible', () => {
      const errorData = getError(errorCode)
      expect(errorData).not.toBeNull()
      expect(errorCode).toMatch(
        new RegExp(`^${errorData.category.codePrefix}.*$`)
      )
    })
  })
)

describe('accessor should handle missing error codes', () =>
  it('should return null for a missing error', () =>
    expect(getError('aaaaa this isnt real')).toBeNull()))
