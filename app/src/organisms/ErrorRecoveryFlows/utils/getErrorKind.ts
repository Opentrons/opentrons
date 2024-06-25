import { ERROR_KINDS, DEFINED_ERROR_TYPES } from '../constants'

import type { ErrorKind } from '../types'

// TODO(jh, 06-18-24): Add the correct errorTypes for these errors when they are available.
export function getErrorKind(errorType?: string): ErrorKind {
  switch (errorType) {
    case DEFINED_ERROR_TYPES.NO_LIQUID_DETECTED:
      return ERROR_KINDS.NO_LIQUID_DETECTED
    case DEFINED_ERROR_TYPES.PIPETTE_COLLISION:
      return ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE
    case DEFINED_ERROR_TYPES.OVERPRESSURE_ASPIRATION:
      return ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING
    case DEFINED_ERROR_TYPES.OVERPRESSURE_DISPENSING:
      return ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING
    default:
      return ERROR_KINDS.GENERAL_ERROR
  }
}
