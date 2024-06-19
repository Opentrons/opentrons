import { ERROR_KINDS } from '../constants'

import type { ErrorKind } from '../types'

// TODO(jh, 06-18-24): Add the correct errorTypes for these errors when they are available.
export function getErrorKind(errorType?: string): ErrorKind {
  switch (errorType) {
    case 'NO_FLUIDS_OH_NO':
      return ERROR_KINDS.NO_LIQUID_DETECTED
    case 'overpressure_5_The_Overpressure_Strikes_Back':
      return ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE
    case 'overpressure':
      return ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING
    case 'overpressure_6_Return_of_the_Overpressure':
      return ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING
    default:
      return ERROR_KINDS.GENERAL_ERROR
  }
}
