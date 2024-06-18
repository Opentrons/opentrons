import { useTranslation } from 'react-i18next'

import type { RecoveryRoute } from '../types'
import { RECOVERY_MAP } from '../constants'

// Return user-friendly recovery option copy from a given route. Only routes that are
// recovery options are handled.
export function useRecoveryOptionCopy(): (
  recoveryOption: RecoveryRoute | null
) => string {
  const { t } = useTranslation('error_recovery')

  const getRecoveryOptionCopy = (
    recoveryOption: RecoveryRoute | null
  ): string => {
    switch (recoveryOption) {
      case RECOVERY_MAP.RETRY_FAILED_COMMAND.ROUTE:
        return t('retry_step')
      case RECOVERY_MAP.CANCEL_RUN.ROUTE:
        return t('cancel_run')
      case RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE:
        return t('retry_with_new_tips')
      default:
        return 'Unknown action'
    }
  }

  return getRecoveryOptionCopy
}
