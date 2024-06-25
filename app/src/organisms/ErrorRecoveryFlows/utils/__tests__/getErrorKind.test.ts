import { describe, expect, it } from 'vitest'

import { ERROR_KINDS, DEFINED_ERROR_TYPES } from '../../constants'
import { getErrorKind } from '../getErrorKind'

describe('getErrorKind', () => {
  it(`returns ${ERROR_KINDS.NO_LIQUID_DETECTED} for ${DEFINED_ERROR_TYPES.NO_LIQUID_DETECTED} errorType`, () => {
    const result = getErrorKind(DEFINED_ERROR_TYPES.NO_LIQUID_DETECTED)
    expect(result).toEqual(ERROR_KINDS.NO_LIQUID_DETECTED)
  })

  it(`returns ${ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE} for ${DEFINED_ERROR_TYPES.PIPETTE_COLLISION} errorType`, () => {
    const result = getErrorKind(DEFINED_ERROR_TYPES.PIPETTE_COLLISION)
    expect(result).toEqual(ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE)
  })

  it(`returns ${ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING} for ${DEFINED_ERROR_TYPES.OVERPRESSURE_ASPIRATION} errorType`, () => {
    const result = getErrorKind(DEFINED_ERROR_TYPES.OVERPRESSURE_ASPIRATION)
    expect(result).toEqual(ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING)
  })

  it(`returns ${ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING} for ${DEFINED_ERROR_TYPES.OVERPRESSURE_DISPENSING} errorType`, () => {
    const result = getErrorKind(DEFINED_ERROR_TYPES.OVERPRESSURE_DISPENSING)
    expect(result).toEqual(ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING)
  })

  it(`returns ${ERROR_KINDS.GENERAL_ERROR} if the errorType isn't handled explicitly`, () => {
    const mockErrorType = 'NON_HANDLED_ERROR'
    const result = getErrorKind(mockErrorType)
    expect(result).toEqual(ERROR_KINDS.GENERAL_ERROR)
  })
})
