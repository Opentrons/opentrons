import { useTranslation } from 'react-i18next'

import { ERROR_KINDS } from '../constants'

import type { ErrorKind } from '../types'

// Returns the user-facing name of the errorKind.
export function useErrorName(errorKind: ErrorKind): string {
  const { t } = useTranslation('error_recovery')

  switch (errorKind) {
    case ERROR_KINDS.NO_LIQUID_DETECTED:
      return t('no_liquid_detected')
    case ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE:
      return t('pipette_overpressure')
    case ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING:
      return t('pipette_overpressure')
    case ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING:
      return t('pipette_overpressure')
    // The only "general error" case currently is tipPhysicallyMissing.
    default:
      return t('tip_not_detected')
  }
}
