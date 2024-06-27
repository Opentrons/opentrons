import { ERROR_KINDS } from '../constants'

import type { ErrorKind } from '../types'

export function getErrorKind(errorType?: string): ErrorKind {
  switch (errorType) {
    default:
      return ERROR_KINDS.GENERAL_ERROR
  }
}
