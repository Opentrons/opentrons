import { useTranslation } from 'react-i18next'

import { RUN_STATUS_BLOCKED_BY_OPEN_DOOR } from '@opentrons/api-client'

import {
  CANCELLABLE_STATUSES,
  DISABLED_STATUSES,
  START_RUN_STATUSES,
} from '../../../constants'
import { useIsDoorOpen } from '../../../hooks'
import { useIsFixtureMismatch } from './useIsFixtureMismatch'

import type { BaseActionButtonProps } from '..'

interface UseActionButtonDisabledUtilsProps extends BaseActionButtonProps {
  isCurrentRun: boolean
  isValidRunAgain: boolean
  isSetupComplete: boolean
  isOtherRunCurrent: boolean
  isProtocolNotReady: boolean
  isRobotOnWrongVersionOfSoftware: boolean
}

type UseActionButtonDisabledUtilsResult =
  | { isDisabled: true; disabledReason: string }
  | { isDisabled: false; disabledReason: null }

// Manages the various reasons the ActionButton may be disabled, returning the disabled state and user-facing disabled
// reason copy if applicable.
export function useActionBtnDisabledUtils(
  props: UseActionButtonDisabledUtilsProps
): UseActionButtonDisabledUtilsResult {
  const {
    isCurrentRun,
    isSetupComplete,
    isOtherRunCurrent,
    isProtocolNotReady,
    runStatus,
    isRobotOnWrongVersionOfSoftware,
    protocolRunControls,
    robotName,
    runId,
    isResetRunLoadingRef,
  } = props

  const { t } = useTranslation('shared')
  const {
    isPlayRunActionLoading,
    isPauseRunActionLoading,
  } = protocolRunControls
  const isDoorOpen = useIsDoorOpen(robotName)
  const isFixtureMismatch = useIsFixtureMismatch(runId, robotName)
  const isResetRunLoading = isResetRunLoadingRef.current

  const isDisabled =
    (isCurrentRun && !isSetupComplete) ||
    isPlayRunActionLoading ||
    isPauseRunActionLoading ||
    isResetRunLoading ||
    isOtherRunCurrent ||
    isProtocolNotReady ||
    isFixtureMismatch ||
    DISABLED_STATUSES.includes(runStatus) ||
    isRobotOnWrongVersionOfSoftware ||
    (isDoorOpen &&
      runStatus !== RUN_STATUS_BLOCKED_BY_OPEN_DOOR &&
      CANCELLABLE_STATUSES.includes(runStatus))

  const disabledReason = useDisabledReason({
    ...props,
    isDoorOpen,
    isFixtureMismatch,
    isResetRunLoading,
  })

  return isDisabled
    ? { isDisabled: true, disabledReason: disabledReason ?? t('robot_is_busy') }
    : { isDisabled: false, disabledReason: null }
}

type UseDisabledReasonProps = UseActionButtonDisabledUtilsProps & {
  isDoorOpen: boolean
  isFixtureMismatch: boolean
  isResetRunLoading: boolean
}

// The user-facing disabled explanation for why the ActionButton is disabled, if any.
function useDisabledReason({
  isCurrentRun,
  isSetupComplete,
  isFixtureMismatch,
  isValidRunAgain,
  isOtherRunCurrent,
  isRobotOnWrongVersionOfSoftware,
  isDoorOpen,
  runStatus,
  isResetRunLoading,
}: UseDisabledReasonProps): string | null {
  const { t } = useTranslation(['run_details', 'shared'])

  if (
    isCurrentRun &&
    (!isSetupComplete || isFixtureMismatch) &&
    !isValidRunAgain
  ) {
    return t('setup_incomplete')
  } else if (isOtherRunCurrent && !isResetRunLoading) {
    return t('shared:robot_is_busy')
  } else if (isRobotOnWrongVersionOfSoftware) {
    return t('shared:a_software_update_is_available')
  } else if (isDoorOpen && START_RUN_STATUSES.includes(runStatus)) {
    return t('close_door')
  } else {
    return null
  }
}
