import { ERROR_KINDS } from '../constants'

import type { ErrorKind } from '../types'

export function getErrorKind(errorType?: string): ErrorKind {
  switch (errorType) {
    case 'NO_LIQUID_OH_NO_PLACEHOLDER_ERRORTYPE':
      return ERROR_KINDS.NO_LIQUID_DETECTED
    case 'overpressure':
      return ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE
    case 'overpressure_2_The_Overpressure_Strikes_Back':
      return ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING
    case 'overpressure_3_Return_of_the_Overpressure':
      return ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING
    default:
      return ERROR_KINDS.GENERAL_ERROR
  }
}
