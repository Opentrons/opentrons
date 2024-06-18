import { ERROR_KINDS } from '../constants'

import type { ErrorKind } from '../types'

export function getErrorKind(errorType?: string): ErrorKind {
  switch (errorType) {
    case 'overpressure':
      return ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING
    default:
      return ERROR_KINDS.GENERAL_ERROR
  }
}
