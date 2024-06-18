import { useTranslation } from 'react-i18next'

import { ERROR_KINDS } from '../constants'

import type { ErrorKind } from '../types'

// Returns the user-facing name of the errorKind.
export function useErrorName(errorKind: ErrorKind): string {
  const { t } = useTranslation('error_recovery')

  switch (errorKind) {
    case ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING:
      return t('pipette_overpressure')
    default:
      return t('general_error')
  }
}
