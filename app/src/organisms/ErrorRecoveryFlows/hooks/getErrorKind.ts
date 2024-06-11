import { ERROR_KINDS } from '../constants'

import type { ErrorKind } from '../types'

export function getErrorKind(errorType?: string): ErrorKind {
  switch (errorType) {
    case 'pipetteOverpressureError':
      return ERROR_KINDS.OVERPERSSURE_WHILE_ASPIRATING
    default:
      return ERROR_KINDS.GENERAL_ERROR
  }
}
