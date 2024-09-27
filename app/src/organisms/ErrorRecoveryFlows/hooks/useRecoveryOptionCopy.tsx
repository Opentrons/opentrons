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
      case RECOVERY_MAP.RETRY_STEP.ROUTE:
        return t('retry_step')
      case RECOVERY_MAP.CANCEL_RUN.ROUTE:
        return t('cancel_run')
      case RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE:
        return t('retry_with_new_tips')
      case RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE:
        return t('retry_with_same_tips')
      case RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.ROUTE:
        return t('manually_fill_well_and_skip')
      case RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE:
        return t('ignore_error_and_skip')
      case RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.ROUTE:
        return t('skip_to_next_step_new_tips')
      case RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE:
        return t('skip_to_next_step_same_tips')
      default:
        return 'Unknown action'
    }
  }

  return getRecoveryOptionCopy
}
