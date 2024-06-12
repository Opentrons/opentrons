import { describe, expect, it } from 'vitest'

import { ERROR_KINDS } from '../../constants'
import { getErrorKind } from '../getErrorKind'

describe('getErrorKind', () => {
  it(`returns ${ERROR_KINDS.GENERAL_ERROR} if the errorType isn't handled explicitly`, () => {
    const mockErrorType = 'NON_HANDLED_ERROR'
    const result = getErrorKind(mockErrorType)
    expect(result).toEqual(ERROR_KINDS.GENERAL_ERROR)
  })
})
