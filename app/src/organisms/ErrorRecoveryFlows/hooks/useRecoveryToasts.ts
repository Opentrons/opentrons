import { useToaster } from '../../ToasterOven'
import { RECOVERY_MAP } from '../constants'
import type { CurrentRecoveryOptionUtils } from './useRecoveryRouting'
import { useTranslation } from 'react-i18next'
import type { StepCounts } from '../../../resources/protocols/hooks'

interface BuildToast {
  isOnDevice: boolean
  currentStepCount: StepCounts['currentStepNumber']
  selectedRecoveryOption: CurrentRecoveryOptionUtils['selectedRecoveryOption']
}

export interface RecoveryToasts {
  /* Renders a recovery success toast. */
  makeSuccessToast: () => void
}

// Provides methods for rendering success/failure toasts after performing a terminal recovery command.
export function useRecoveryToasts({
  currentStepCount,
  isOnDevice,
  selectedRecoveryOption,
}: BuildToast): RecoveryToasts {
  const { makeToast } = useToaster()

  const toastText = useToastText({ currentStepCount, selectedRecoveryOption })

  const makeSuccessToast = (): void => {
    if (selectedRecoveryOption !== RECOVERY_MAP.CANCEL_RUN.ROUTE) {
      makeToast(toastText, 'success', {
        closeButton: true,
        disableTimeout: true,
        displayType: isOnDevice ? 'odd' : 'desktop',
      })
    }
  }

  return { makeSuccessToast }
}

// Return i18n toast text for the corresponding user selected recovery option.
export function useToastText({
  currentStepCount,
  selectedRecoveryOption,
}: Omit<BuildToast, 'isOnDevice'>): string {
  const { t } = useTranslation('error_recovery')

  const stepNumber = getStepNumber(selectedRecoveryOption, currentStepCount)

  const currentStepReturnVal = t('retrying_step_succeeded', {
    step: stepNumber,
  }) as string
  const nextStepReturnVal = t('skipping_to_step_succeeded', {
    step: stepNumber,
  }) as string

  const toastText = handleRecoveryOptionAction(
    selectedRecoveryOption,
    currentStepReturnVal,
    nextStepReturnVal
  )

  return toastText
}

export function getStepNumber(
  selectedRecoveryOption: BuildToast['selectedRecoveryOption'],
  currentStepCount: BuildToast['currentStepCount']
): number | string {
  const currentStepReturnVal = currentStepCount ?? '?'
  // There is always a next protocol step after a command that can error, therefore, we don't need to handle that.
  const nextStepReturnVal =
    typeof currentStepCount === 'number' ? currentStepCount + 1 : '?'

  return handleRecoveryOptionAction(
    selectedRecoveryOption,
    currentStepReturnVal,
    nextStepReturnVal
  )
}

// Recovery options can be categorized into broad categories of behavior, currently performing the same step again
// or skipping to the next step.
function handleRecoveryOptionAction<T>(
  selectedRecoveryOption: CurrentRecoveryOptionUtils['selectedRecoveryOption'],
  currentStepReturnVal: T,
  nextStepReturnVal: T
): T | string {
  switch (selectedRecoveryOption) {
    case RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.ROUTE:
    case RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE:
    case RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.ROUTE:
    case RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE:
      return nextStepReturnVal
    case RECOVERY_MAP.CANCEL_RUN.ROUTE:
    case RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE:
    case RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE:
    case RECOVERY_MAP.RETRY_FAILED_COMMAND.ROUTE:
      return currentStepReturnVal
    default:
      return 'HANDLE RECOVERY TOAST OPTION EXPLICITLY.'
  }
}
